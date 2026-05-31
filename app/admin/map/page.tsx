import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TripMap } from "@/components/admin/trip-map"

export default async function MapPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  
  // Fetch active/pending trips with coordinates
  const { data: trips } = await supabase
    .from("trip_requests")
    .select(`
      id,
      customer_name,
      customer_phone,
      pickup_address,
      pickup_lat,
      pickup_lng,
      pickup_notes,
      delivery_address,
      delivery_lat,
      delivery_lng,
      delivery_notes,
      status,
      driver_id,
      scheduled_pickup_at,
      total_price,
      created_at,
      drivers (id, name, phone)
    `)
    .in("status", ["pending", "confirmed", "assigned", "picked_up", "in_transit"])
    .order("created_at", { ascending: false })
  
  // Fetch all drivers with location data
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, name, phone, status, current_lat, current_lng, last_location_update")
    .order("name")
  
  return (
    <div className="h-[calc(100vh-4rem)]">
      <TripMap 
        initialTrips={trips || []} 
        drivers={drivers || []}
      />
    </div>
  )
}
