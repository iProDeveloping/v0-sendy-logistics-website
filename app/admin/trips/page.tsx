import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TripsDashboard } from "@/components/admin/trips-dashboard"

export default async function TripsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  // Fetch trips with related data
  const { data: trips } = await supabase
    .from("trip_requests")
    .select(`
      *,
      sms_customers (id, name, phone_number, company),
      drivers (id, name, phone),
      package_types (id, name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  // Fetch drivers for assignment dropdown
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, name, phone, status")
    .eq("status", "active")
    .order("name")

  // Fetch customers for new trip form
  const { data: customers } = await supabase
    .from("sms_customers")
    .select("id, name, phone_number, company")
    .eq("sms_approved", true)
    .order("name")

  // Fetch package types
  const { data: packageTypes } = await supabase
    .from("package_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  return (
    <TripsDashboard 
      initialTrips={trips || []}
      drivers={drivers || []}
      customers={customers || []}
      packageTypes={packageTypes || []}
    />
  )
}
