import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient()
  const { id } = await params
  const body = await request.json()
  
  const { name, logo_url, website_url, active, sort_order } = body
  
  const { data, error } = await supabase
    .from("partners")
    .update({
      name,
      logo_url,
      website_url,
      active,
      sort_order,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ partner: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient()
  const { id } = await params
  
  const { error } = await supabase
    .from("partners")
    .delete()
    .eq("id", id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
