import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { updateTripStatusWithNotification } from "@/lib/status-notifications"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId: id } = await params
    const { status, sendNotification = true, driverName, eta } = await request.json()
    
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }
    
    const validStatuses = [
      "pending", "confirmed", "assigned", "picked_up", 
      "in_transit", "out_for_delivery", "delivered", 
      "cancelled", "returned"
    ]
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get trip to verify it exists
    const { data: trip, error: fetchError } = await supabase
      .from("trip_requests")
      .select("id, customer_phone, status")
      .eq("id", id)
      .single()
    
    if (fetchError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }
    
    // Update status
    const { error: updateError } = await supabase
      .from("trip_requests")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // Send SMS notification if enabled and status changed
    if (sendNotification && trip.customer_phone && trip.status !== status) {
      const { sendStatusUpdateSMS } = await import("@/lib/status-notifications")
      await sendStatusUpdateSMS(id, status, trip.customer_phone, {
        driverName,
        eta,
      })
    }
    
    return NextResponse.json({ 
      success: true,
      tripId: id,
      newStatus: status,
      notificationSent: sendNotification && trip.customer_phone && trip.status !== status
    })
  } catch (error) {
    console.error("[Trip Status API] Error:", error)
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    )
  }
}
