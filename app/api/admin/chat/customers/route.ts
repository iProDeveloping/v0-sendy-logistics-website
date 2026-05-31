import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: customers, error } = await supabase
    .from("sms_customers")
    .select(`
      *,
      customer_levels (name, discount_percentage)
    `)
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ customers })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const body = await request.json()
    
    const { phone_number, name, email, company, customer_level_id, sms_approved } = body
    
    if (!phone_number) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }
    
    // Normalize phone number
    const normalizedPhone = phone_number.replace(/\D/g, "")
    
    const { data: customer, error } = await supabase
      .from("sms_customers")
      .insert({
        phone_number: normalizedPhone,
        name: name || null,
        email: email || null,
        company: company || null,
        customer_level_id: customer_level_id || null,
        sms_approved: sms_approved ?? true,
        sms_opted_in_at: sms_approved ? new Date().toISOString() : null,
      })
      .select(`
        *,
        customer_levels (name, discount_percentage)
      `)
      .single()
    
    if (error) {
      console.error("[Customers API] Error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    console.error("[Customers API] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create customer" 
    }, { status: 500 })
  }
}
