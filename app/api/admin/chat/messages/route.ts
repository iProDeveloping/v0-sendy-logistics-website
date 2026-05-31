import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId")
  
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
  
  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }
  
  // Fetch trip requests for this conversation
  const { data: tripRequests } = await supabase
    .from("sms_trip_requests")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
  
  return NextResponse.json({ messages, tripRequests: tripRequests || [] })
}
