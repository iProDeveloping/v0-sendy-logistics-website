import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: trips, error } = await supabase
    .from("trip_requests")
    .select(`
      *,
      sms_customers (id, name, phone_number, company),
      drivers (id, name, phone),
      package_types (id, name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ trips })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Build trip data
  const tripData: Record<string, unknown> = {
    customer_phone: body.customer_phone,
    pickup_address: body.pickup_address,
    delivery_address: body.delivery_address,
    status: "pending",
    source: "admin",
    created_by: user?.id,
  }
  
  // Optional fields
  if (body.customer_id && body.customer_id !== "manual") {
    tripData.customer_id = body.customer_id
  }
  if (body.customer_name) tripData.customer_name = body.customer_name
  if (body.customer_email) tripData.customer_email = body.customer_email
  if (body.pickup_notes) tripData.pickup_notes = body.pickup_notes
  if (body.delivery_notes) tripData.delivery_notes = body.delivery_notes
  if (body.package_type_id) tripData.package_type_id = body.package_type_id
  if (body.package_description) tripData.package_description = body.package_description
  if (body.special_instructions) tripData.special_instructions = body.special_instructions
  if (body.scheduled_pickup_at) tripData.scheduled_pickup_at = body.scheduled_pickup_at
  if (body.notes) tripData.notes = body.notes
  
  const { data: trip, error } = await supabase
    .from("trip_requests")
    .insert(tripData)
    .select(`
      *,
      sms_customers (id, name, phone_number, company),
      drivers (id, name, phone),
      package_types (id, name)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ trip })
}
