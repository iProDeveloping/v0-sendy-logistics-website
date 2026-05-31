import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  
  const { data: trip, error } = await supabase
    .from("trip_requests")
    .select(`
      *,
      sms_customers (id, name, phone_number, company, customer_levels (name, discount_percentage)),
      drivers (id, name, phone, vehicle_type, vehicle_plate),
      package_types (id, name, description)
    `)
    .eq("id", tripId)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ trip })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Add updated_by and updated_at
  const updateData = {
    ...body,
    updated_at: new Date().toISOString(),
    updated_by: user?.id,
  }
  
  // Handle status-specific timestamps
  if (body.status === "picked_up" && !body.actual_pickup_at) {
    updateData.actual_pickup_at = new Date().toISOString()
  }
  if (body.status === "delivered" && !body.actual_delivery_at) {
    updateData.actual_delivery_at = new Date().toISOString()
  }
  
  const { data: trip, error } = await supabase
    .from("trip_requests")
    .update(updateData)
    .eq("id", tripId)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("trip_requests")
    .delete()
    .eq("id", tripId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
