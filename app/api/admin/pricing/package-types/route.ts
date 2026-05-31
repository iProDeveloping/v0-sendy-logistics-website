import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const data = await request.json()
    
    const { data: packageType, error } = await supabase
      .from("package_types")
      .insert({
        name: data.name,
        description: data.description,
        base_multiplier: data.base_multiplier,
        per_mile_multiplier: data.per_mile_multiplier,
        min_price: data.min_price,
        max_weight_lbs: data.max_weight_lbs,
        max_dimensions: data.max_dimensions,
        is_active: data.is_active,
        sort_order: data.sort_order,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ packageType })
  } catch (error) {
    console.error("Error creating package type:", error)
    return NextResponse.json({ error: "Failed to create package type" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  
  try {
    const data = await request.json()
    
    const { error } = await supabase
      .from("package_types")
      .update({
        name: data.name,
        description: data.description,
        base_multiplier: data.base_multiplier,
        per_mile_multiplier: data.per_mile_multiplier,
        min_price: data.min_price,
        max_weight_lbs: data.max_weight_lbs,
        max_dimensions: data.max_dimensions,
        is_active: data.is_active,
        sort_order: data.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating package type:", error)
    return NextResponse.json({ error: "Failed to update package type" }, { status: 500 })
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
      .from("package_types")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting package type:", error)
    return NextResponse.json({ error: "Failed to delete package type" }, { status: 500 })
  }
}
