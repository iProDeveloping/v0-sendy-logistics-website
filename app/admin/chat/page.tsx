import { createClient } from "@/lib/supabase/server"
import { ChatDashboard } from "@/components/admin/chat-dashboard"

export default async function AdminChatPage() {
  const supabase = await createClient()
  
  // Fetch conversations with customer info (including agent mode fields)
  const { data: conversations } = await supabase
    .from("chat_conversations")
    .select(`
      id,
      customer_id,
      phone_number,
      status,
      current_flow,
      flow_data,
      last_message_at,
      created_at,
      agent_mode,
      agent_mode_enabled_at,
      agent_requested_at,
      sms_customers (
        id,
        name,
        phone_number,
        company,
        customer_levels (name, discount_percentage)
      )
    `)
    .order("last_message_at", { ascending: false })
    .limit(50)
  
  // Fetch SMS customers for the customer management section
  const { data: customers } = await supabase
    .from("sms_customers")
    .select(`
      *,
      customer_levels (name, discount_percentage)
    `)
    .order("created_at", { ascending: false })
  
  // Fetch customer levels for dropdown
  const { data: customerLevels } = await supabase
    .from("customer_levels")
    .select("*")
    .order("priority", { ascending: true })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SMS Chat</h1>
        <p className="text-muted-foreground mt-1">
          Manage customer conversations and SMS communications
        </p>
      </div>
      
      <ChatDashboard 
        initialConversations={conversations || []}
        customers={customers || []}
        customerLevels={customerLevels || []}
      />
    </div>
  )
}
