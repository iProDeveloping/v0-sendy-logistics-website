import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .order("sort_order", { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const body = await request.json()
  
  // Get next sort order
  const { data: existing } = await supabase
    .from("case_studies")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
  
  const nextOrder = existing?.[0]?.sort_order ? existing[0].sort_order + 1 : 1
  
  const { data, error } = await supabase
    .from("case_studies")
    .insert({
      ...body,
      sort_order: nextOrder,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
