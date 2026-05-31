import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  try {
    const body = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.company !== undefined) updateData.company = body.company
    if (body.customer_level_id !== undefined) updateData.customer_level_id = body.customer_level_id
    if (body.sms_approved !== undefined) {
      updateData.sms_approved = body.sms_approved
      if (body.sms_approved) {
        updateData.sms_opted_in_at = new Date().toISOString()
      }
    }
    if (body.notes !== undefined) updateData.notes = body.notes
    
    updateData.updated_at = new Date().toISOString()
    
    const { data: customer, error } = await supabase
      .from("sms_customers")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        customer_levels (name, discount_percentage)
      `)
      .single()
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    console.error("[Customer Update] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update customer" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("sms_customers")
    .delete()
    .eq("id", id)
  
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
