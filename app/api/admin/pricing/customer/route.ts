import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const data = await request.json()
    
    const { data: customerPricing, error } = await supabase
      .from("customer_pricing")
      .insert({
        customer_id: data.customer_id,
        custom_base_price: data.custom_base_price,
        custom_per_mile_rate: data.custom_per_mile_rate,
        custom_discount_percentage: data.custom_discount_percentage,
        custom_minimum_charge: data.custom_minimum_charge,
        flat_rate_enabled: data.flat_rate_enabled,
        flat_rate_amount: data.flat_rate_amount,
        flat_rate_max_miles: data.flat_rate_max_miles,
        notes: data.notes,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ customerPricing })
  } catch (error) {
    console.error("Error creating customer pricing:", error)
    return NextResponse.json({ error: "Failed to create customer pricing" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  
  try {
    const data = await request.json()
    
    const { error } = await supabase
      .from("customer_pricing")
      .update({
        custom_base_price: data.custom_base_price,
        custom_per_mile_rate: data.custom_per_mile_rate,
        custom_discount_percentage: data.custom_discount_percentage,
        custom_minimum_charge: data.custom_minimum_charge,
        flat_rate_enabled: data.flat_rate_enabled,
        flat_rate_amount: data.flat_rate_amount,
        flat_rate_max_miles: data.flat_rate_max_miles,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating customer pricing:", error)
    return NextResponse.json({ error: "Failed to update customer pricing" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const id = request.nextUrl.searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }
  
  try {
    const { error } = await supabase
      .from("customer_pricing")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer pricing:", error)
    return NextResponse.json({ error: "Failed to delete customer pricing" }, { status: 500 })
  }
}
