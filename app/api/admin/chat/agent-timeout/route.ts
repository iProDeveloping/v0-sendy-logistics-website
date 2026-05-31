import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendSMS } from "@/lib/twilio"

// This endpoint checks for agent mode timeouts and auto-disables them
// Can be called by a cron job or client-side polling

export async function POST() {
  try {
    const supabase = createServiceClient()
    
    // Find conversations where agent mode has timed out
    const { data: timedOutConversations, error: fetchError } = await supabase
      .from("chat_conversations")
      .select("id, phone_number, agent_mode_enabled_at, agent_mode_timeout_at")
      .eq("agent_mode", true)
      .lt("agent_mode_timeout_at", new Date().toISOString())
    
    if (fetchError) throw fetchError
    
    const results = []
    
    for (const conv of timedOutConversations || []) {
      // Disable agent mode
      const { error: updateError } = await supabase
        .from("chat_conversations")
        .update({
          agent_mode: false,
          agent_mode_enabled_at: null,
          agent_mode_enabled_by: null,
          agent_mode_timeout_at: null
        })
        .eq("id", conv.id)
      
      if (updateError) {
        results.push({ id: conv.id, success: false, error: updateError.message })
        continue
      }
      
      // Notify customer that they're back with AI
      if (conv.phone_number) {
        const timeoutMessage = `Our agent is no longer available. You're now connected with our AI assistant. How can I help you continue?`
        
        await sendSMS(conv.phone_number, timeoutMessage)
        
        await supabase.from("chat_messages").insert({
          conversation_id: conv.id,
          direction: "outbound",
          message: timeoutMessage,
          sender_type: "system"
        })
      }
      
      results.push({ id: conv.id, success: true })
    }
    
    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      results 
    })
  } catch (error) {
    console.error("Error processing agent timeouts:", error)
    return NextResponse.json(
      { error: "Failed to process agent timeouts" },
      { status: 500 }
    )
  }
}

// GET endpoint to check timeout status (for client-side polling)
export async function GET() {
  try {
    const supabase = createServiceClient()
    
    // Count conversations with active agent mode that might timeout soon
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id, agent_mode_timeout_at")
      .eq("agent_mode", true)
      .not("agent_mode_timeout_at", "is", null)
    
    if (error) throw error
    
    const now = new Date()
    const timedOut = (data || []).filter(c => 
      c.agent_mode_timeout_at && new Date(c.agent_mode_timeout_at) < now
    )
    const expiringSoon = (data || []).filter(c => {
      if (!c.agent_mode_timeout_at) return false
      const timeoutAt = new Date(c.agent_mode_timeout_at)
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
      return timeoutAt > now && timeoutAt < fiveMinutesFromNow
    })
    
    return NextResponse.json({
      activeAgentModes: data?.length || 0,
      timedOut: timedOut.length,
      expiringSoon: expiringSoon.length
    })
  } catch (error) {
    console.error("Error checking agent timeouts:", error)
    return NextResponse.json(
      { error: "Failed to check agent timeouts" },
      { status: 500 }
    )
  }
}
