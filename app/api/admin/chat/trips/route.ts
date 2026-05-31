import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: trips, error } = await supabase
    .from("sms_trip_requests")
    .select(`
      *,
      sms_customers (
        name,
        phone_number,
        company
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ trips })
}
