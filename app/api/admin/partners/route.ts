import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = createServiceClient()
  
  const { data: partners, error } = await supabase
    .from("partners")
    .select("*")
    .order("sort_order", { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ partners })
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  
  const { name, logo_url, website_url, active = true, sort_order = 0 } = body
  
  if (!name || !logo_url) {
    return NextResponse.json(
      { error: "Name and logo URL are required" },
      { status: 400 }
    )
  }
  
  const { data, error } = await supabase
    .from("partners")
    .insert({
      name,
      logo_url,
      website_url,
      active,
      sort_order
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ partner: data })
}
