import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  const supabase = await createClient()
  
  try {
    const { id, value } = await request.json()
    
    const { error } = await supabase
      .from("pricing_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating pricing setting:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}
