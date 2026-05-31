import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendAdminMessage } from "@/lib/chat-flow"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { conversationId, message } = await request.json()
    
    if (!conversationId || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }
    
    const result = await sendAdminMessage(conversationId, message, user.id)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Admin Chat] Error sending message:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send message" 
    }, { status: 500 })
  }
}
