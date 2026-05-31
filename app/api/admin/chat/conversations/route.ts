import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: conversations, error } = await supabase
    .from("chat_conversations")
    .select(`
      *,
      sms_customers (
        id,
        name,
        phone_number,
        company,
        customer_levels (name, discount_percentage)
      )
    `)
    .order("last_message_at", { ascending: false })
    .limit(50)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ conversations })
}
