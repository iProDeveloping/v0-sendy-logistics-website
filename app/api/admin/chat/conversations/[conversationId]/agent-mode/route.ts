import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendSMS } from "@/lib/twilio"

// Agent mode timeout in milliseconds (30 minutes)
const AGENT_MODE_TIMEOUT_MS = 30 * 60 * 1000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient()
    const { conversationId } = await params
    
    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id, first_name, last_name")
      .eq("id", user.id)
      .single()
    
    if (!adminProfile) {
      return NextResponse.json({ error: "Not an admin" }, { status: 403 })
    }
    
    const { agent_mode } = await request.json()
    
    // Get conversation details first
    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("phone_number, agent_requested_at")
      .eq("id", conversationId)
      .single()
    
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    
    // Calculate timeout timestamp
    const timeoutAt = agent_mode 
      ? new Date(Date.now() + AGENT_MODE_TIMEOUT_MS).toISOString()
      : null
    
    // Update conversation
    const { data, error } = await supabase
      .from("chat_conversations")
      .update({
        agent_mode,
        agent_mode_enabled_at: agent_mode ? new Date().toISOString() : null,
        agent_mode_enabled_by: agent_mode ? user.id : null,
        agent_mode_timeout_at: timeoutAt,
        // Clear agent request when agent mode is enabled
        agent_requested_at: agent_mode ? null : undefined
      })
      .eq("id", conversationId)
      .select()
      .single()
    
    if (error) throw error
    
    // Send SMS notification to customer
    if (agent_mode && conversation.phone_number) {
      const agentName = adminProfile.first_name || "An agent"
      const connectMessage = `${agentName} from Sendy Logistics has joined the chat. How can I help you today?`
      
      // Send the connection notification
      await sendSMS(conversation.phone_number, connectMessage)
      
      // Save the message to the conversation
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        direction: "outbound",
        message: connectMessage,
        sender_type: "admin",
        sender_id: user.id
      })
    } else if (!agent_mode && conversation.phone_number) {
      // Agent disconnected - notify customer they're back with AI
      const disconnectMessage = `Our agent has stepped away. You're now connected with our AI assistant. How can I help you?`
      
      await sendSMS(conversation.phone_number, disconnectMessage)
      
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        direction: "outbound",
        message: disconnectMessage,
        sender_type: "system"
      })
    }
    
    return NextResponse.json({ success: true, conversation: data })
  } catch (error) {
    console.error("Error toggling agent mode:", error)
    return NextResponse.json(
      { error: "Failed to toggle agent mode" },
      { status: 500 }
    )
  }
}
