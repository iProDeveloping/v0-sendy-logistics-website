import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: partners, error } = await supabase
    .from("partners")
    .select("id, name, logo_url, website_url, industry")
    .eq("active", true)
    .order("sort_order", { ascending: true })
  
  if (error) {
    return NextResponse.json({ partners: [] })
  }
  
  return NextResponse.json({ partners })
}
