import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getWooDeliveryClient } from "@/lib/woodelivery"

export async function GET() {
  try {
    const supabase = createServiceClient()
    
    // Fetch drivers from our database
    const { data: localDrivers, error } = await supabase
      .from("drivers")
      .select("*")
      .order("name")
    
    if (error) {
      console.error("[Drivers Locations] DB error:", error)
      return NextResponse.json({ drivers: [] })
    }
    
    // Try to get real-time locations from WooDelivery
    const wooClient = getWooDeliveryClient()
    let wooDrivers: Array<{
      id: string
      name: string
      phone?: string
      status: string
      lat?: number
      lng?: number
      lastUpdate?: string
    }> = []
    
    if (wooClient) {
      try {
        const drivers = await wooClient.getDrivers()
        wooDrivers = drivers.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          status: d.status,
          // WooDelivery may include location in driver data
          // This depends on WooDelivery's API - adjust as needed
        }))
      } catch (wooError) {
        console.error("[Drivers Locations] WooDelivery error:", wooError)
      }
    }
    
    // Merge local drivers with WooDelivery data
    const driversWithLocations = (localDrivers || []).map(driver => {
      // Find matching WooDelivery driver by phone or name
      const wooDriver = wooDrivers.find(
        w => w.phone === driver.phone || w.name.toLowerCase() === driver.name.toLowerCase()
      )
      
      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        status: wooDriver?.status || driver.status,
        vehicle_type: driver.vehicle_type,
        vehicle_plate: driver.vehicle_plate,
        // Real-time location from WooDelivery
        current_lat: wooDriver?.lat || driver.current_lat || null,
        current_lng: wooDriver?.lng || driver.current_lng || null,
        last_location_update: wooDriver?.lastUpdate || driver.last_location_update || null,
        woo_driver_id: wooDriver?.id || null,
      }
    })
    
    return NextResponse.json({ 
      drivers: driversWithLocations,
      wooConnected: !!wooClient
    })
  } catch (error) {
    console.error("[Drivers Locations] Error:", error)
    return NextResponse.json({ drivers: [], error: "Failed to fetch driver locations" }, { status: 500 })
  }
}
