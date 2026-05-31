import { createClient } from "@/lib/supabase/server"
import { getWooDeliveryClient } from "@/lib/woodelivery"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const trackingNumber = searchParams.get("number")

  if (!trackingNumber) {
    return NextResponse.json({ error: "Tracking number is required" }, { status: 400 })
  }

  // Try WooDelivery first if configured
  const wooDelivery = getWooDeliveryClient()

  if (wooDelivery) {
    try {
      // Try to find task by tracking number (external ID)
      const task = await wooDelivery.getTaskByTrackingNumber(trackingNumber)

      if (task) {
        // Get task events/history
        const events = await wooDelivery.getTaskEvents(task.id)

        // Map WooDelivery status to our status format
        const statusMap: Record<string, string> = {
          pending: "pending",
          assigned: "pending",
          picked_up: "picked_up",
          in_transit: "in_transit",
          out_for_delivery: "out_for_delivery",
          completed: "delivered",
          delivered: "delivered",
          cancelled: "returned",
          failed: "returned",
        }

        return NextResponse.json({
          source: "woodelivery",
          id: task.id,
          tracking_number: trackingNumber,
          recipient_name: task.recipientName,
          recipient_address: task.recipientAddress,
          status: statusMap[task.status?.toLowerCase()] || task.status,
          estimated_delivery: task.scheduledTime,
          driver_name: task.driverName,
          driver_phone: task.driverPhone,
          notes: task.notes,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
          events: events.map((event) => ({
            id: event.id,
            status: event.status,
            location: event.location,
            description: event.description,
            event_time: event.timestamp,
          })),
        })
      }
    } catch (error) {
      console.error("[Track API] WooDelivery error:", error)
      // Fall through to Supabase lookup
    }
  }

  // Fallback to Supabase for internal packages and trip_requests
  const supabase = await createClient()
  const upperTrackingNumber = trackingNumber.toUpperCase()

  // First try packages table
  const { data: packageData } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_number", upperTrackingNumber)
    .maybeSingle()

  if (packageData) {
    // Get package events
    const { data: events } = await supabase
      .from("package_events")
      .select("*")
      .eq("package_id", packageData.id)
      .order("event_time", { ascending: false })

    return NextResponse.json({
      source: "internal",
      ...packageData,
      events: events || [],
    })
  }

  // Try trip_requests table - first by sequential trip_number, then by UUID prefix
  let tripData = null
  
  // Check if tracking number is numeric (sequential trip number)
  const numericTrackingNumber = parseInt(trackingNumber, 10)
  
  if (!isNaN(numericTrackingNumber)) {
    // Search by sequential trip_number
    const { data: tripByNumber } = await supabase
      .from("trip_requests")
      .select("*")
      .eq("trip_number", numericTrackingNumber)
      .maybeSingle()
    
    if (tripByNumber) {
      tripData = tripByNumber
    }
  }
  
  // If not found by number, try by UUID prefix (legacy support)
  if (!tripData) {
    const searchTerm = upperTrackingNumber.toLowerCase()
    
    // Try RPC function first (searches by ID prefix with text casting)
    try {
      const { data: tripResults, error: rpcError } = await supabase
        .rpc("search_trips_by_id_prefix", { prefix: searchTerm })
        .limit(1)
      
      if (!rpcError && tripResults?.length > 0) {
        tripData = tripResults[0]
      }
    } catch (err) {
      console.log("[Track API] RPC not available, trying direct query")
    }
    
    // If RPC didn't work, try fetching recent trips and filtering in JS
    if (!tripData) {
      const { data: recentTrips } = await supabase
        .from("trip_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
      
      if (recentTrips) {
        tripData = recentTrips.find(trip => 
          trip.id.toLowerCase().startsWith(searchTerm) ||
          trip.id.toUpperCase().startsWith(upperTrackingNumber)
        ) || null
      }
    }
  }

  if (tripData) {
    // Get driver info if assigned
    let driverInfo = null
    if (tripData.driver_id) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("id, name, phone, current_lat, current_lng, last_location_update")
        .eq("id", tripData.driver_id)
        .maybeSingle()
      
      if (driver) {
        driverInfo = {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          current_lat: driver.current_lat,
          current_lng: driver.current_lng,
          last_update: driver.last_location_update,
        }
      }
    }
    
    // Create events from trip status history
    const events = [
      {
        id: `${tripData.id}-created`,
        status: "confirmed",
        location: tripData.pickup_address,
        description: "Delivery request confirmed",
        event_time: tripData.created_at,
      }
    ]

    // Add current status event if different from confirmed
    if (tripData.status !== "confirmed") {
      events.unshift({
        id: `${tripData.id}-current`,
        status: tripData.status,
        location: tripData.status === "delivered" ? tripData.delivery_address : null,
        description: getStatusDescription(tripData.status),
        event_time: tripData.updated_at,
      })
    }

    return NextResponse.json({
      source: "trip_request",
      id: tripData.id,
      tracking_number: tripData.trip_number ? String(tripData.trip_number) : tripData.id.slice(0, 8).toUpperCase(),
      trip_number: tripData.trip_number,
      recipient_name: tripData.customer_name || "Customer",
      recipient_address: tripData.delivery_address,
      pickup_address: tripData.pickup_address,
      pickup_lat: tripData.pickup_lat,
      pickup_lng: tripData.pickup_lng,
      delivery_lat: tripData.delivery_lat,
      delivery_lng: tripData.delivery_lng,
      status: tripData.status,
      estimated_delivery: null,
      distance_miles: tripData.distance_miles,
      total_price: tripData.total_price,
      created_at: tripData.created_at,
      updated_at: tripData.updated_at,
      driver: driverInfo,
      events,
    })
  }

  // No exact match - suggest using trip number format
  const { data: recentTripsForSuggestion } = await supabase
    .from("trip_requests")
    .select("trip_number")
    .not("trip_number", "is", null)
    .order("created_at", { ascending: false })
    .limit(5)
  
  // Suggest recent trip numbers if input looks like a number
  if (recentTripsForSuggestion && recentTripsForSuggestion.length > 0) {
    const tripNumbers = recentTripsForSuggestion.map(t => String(t.trip_number))
    return NextResponse.json({ 
      error: "Package not found", 
      message: "Enter your numeric tracking number (e.g., 1001, 1002)",
      recentNumbers: tripNumbers
    }, { status: 404 })
  }

  return NextResponse.json({ error: "Package not found" }, { status: 404 })
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    pending: "Awaiting driver assignment",
    confirmed: "Delivery request confirmed",
    assigned: "Driver assigned to your delivery",
    picked_up: "Package picked up from sender",
    in_transit: "Package is on the way",
    out_for_delivery: "Out for delivery",
    delivered: "Package delivered successfully",
    cancelled: "Delivery cancelled",
    returned: "Package returned to sender",
  }
  return descriptions[status] || `Status: ${status}`
}
