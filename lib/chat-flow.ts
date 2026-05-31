import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'
import { processMessageWithAI } from '@/lib/ai-chat-processor'

// Flow states
export type FlowState = 
  | 'greeting'
  | 'awaiting_pickup'
  | 'selecting_pickup'      // User selecting from pickup address list
  | 'awaiting_unit_pickup'  // Asking for unit number for pickup
  | 'awaiting_delivery'
  | 'selecting_delivery'    // User selecting from delivery address list
  | 'awaiting_unit_delivery' // Asking for unit number for delivery
  | 'awaiting_confirmation'
  | 'trip_confirmed'
  | 'idle'

interface FlowData {
  tripRequestId?: string
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  pickupPlaceId?: string
  pickupUnit?: string
  deliveryAddress?: string
  deliveryLat?: number
  deliveryLng?: number
  deliveryPlaceId?: string
  deliveryUnit?: string
  distanceMiles?: number
  durationMinutes?: number
  basePrice?: number
  pricePerMile?: number
  subtotal?: number
  discountPercentage?: number
  discountAmount?: number
  totalPrice?: number
  packageDescription?: string
  scheduledPickup?: string
  confirmedAt?: string
  // Address selection flow
  pendingAddressType?: 'pickup' | 'delivery'
  addressSuggestions?: Array<{ placeId: string; description: string }>
  originalInput?: string
  // Unit number flow
  pendingAddress?: string
  pendingLat?: number
  pendingLng?: number
  pendingPlaceId?: string
}

interface Conversation {
  id: string
  customer_id: string | null
  phone_number: string
  status: string
  current_flow: FlowState
  flow_data: FlowData
  agent_mode?: boolean
  agent_requested_at?: string
}

interface Customer {
  id: string
  phone_number: string
  name: string | null
  customer_level_id: string | null
  sms_approved: boolean
  customer_levels?: {
    name: string
    discount_percentage: number
  }
}

// Process incoming message and return response
export async function processIncomingMessage(
  phoneNumber: string,
  messageBody: string,
  twilioSid?: string
): Promise<{ response: string; conversation: Conversation }> {
  const supabase = createServiceClient()
  const normalizedPhone = phoneNumber.replace(/\D/g, '')
  
  const input = messageBody.trim()
  
  // Find or check customer
  const { data: customer, error: customerError } = await supabase
    .from('sms_customers')
    .select('*, customer_levels(name, discount_percentage)')
    .eq('phone_number', normalizedPhone)
    .single() as { data: Customer | null; error: unknown }
  
  // If not an approved customer, send opt-in message
  if (!customer || !customer.sms_approved) {
    // Create or update conversation for tracking
    const { data: conv } = await supabase
      .from('chat_conversations')
      .upsert({
        phone_number: normalizedPhone,
        status: 'pending_response',
        current_flow: 'idle',
        flow_data: {},
        last_message_at: new Date().toISOString()
      }, { onConflict: 'phone_number' })
      .select()
      .single()
    
    // Save incoming message
    if (conv) {
      await supabase.from('chat_messages').insert({
        conversation_id: conv.id,
        direction: 'inbound',
        message: input,
        sender_type: 'customer',
        twilio_sid: twilioSid
      })
    }
    
    const response = `Thank you for contacting Sendy Logistics! To enable SMS services, please call us at 845-736-3946 or visit sendylogistics.com/contact to set up your account.`
    
    // Save outgoing message
    if (conv) {
      await supabase.from('chat_messages').insert({
        conversation_id: conv.id,
        direction: 'outbound',
        message: response,
        sender_type: 'system'
      })
    }
    
    return { 
      response, 
      conversation: conv as Conversation || {
        id: '',
        customer_id: null,
        phone_number: normalizedPhone,
        status: 'pending_response',
        current_flow: 'idle' as FlowState,
        flow_data: {}
      }
    }
  }
  
  // Get or create conversation
  let { data: conversation } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('phone_number', normalizedPhone)
    .single()
  
  if (!conversation) {
    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({
        customer_id: customer.id,
        phone_number: normalizedPhone,
        status: 'active',
        current_flow: 'greeting',
        flow_data: {},
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()
    conversation = newConv
  }
  
  if (!conversation) {
    throw new Error('Failed to create conversation')
  }
  
  // Save incoming message
  await supabase.from('chat_messages').insert({
    conversation_id: conversation.id,
    direction: 'inbound',
    message: input,
    sender_type: 'customer',
    twilio_sid: twilioSid
  })
  
  // Check if user is requesting an agent
  const agentRequestKeywords = /\b(agent|human|person|representative|rep|talk to someone|speak to someone|real person|help me|operator)\b/i
  if (agentRequestKeywords.test(input.toLowerCase())) {
    // Count how many conversations are waiting for an agent
    const { count: queuePosition } = await supabase
      .from('chat_conversations')
      .select('id', { count: 'exact', head: true })
      .not('agent_requested_at', 'is', null)
      .eq('agent_mode', false)
      .lt('agent_requested_at', new Date().toISOString())
    
    // Mark that customer requested an agent
    await supabase
      .from('chat_conversations')
      .update({
        agent_requested_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id)
    
    // Build personalized response with queue info
    let agentResponse = "I understand you'd like to speak with a human agent. I've notified our team and someone will respond to you shortly."
    
    const currentQueuePos = (queuePosition || 0) + 1
    if (currentQueuePos === 1) {
      agentResponse += "\n\nYou're next in line! An agent should connect with you soon."
    } else if (currentQueuePos <= 3) {
      agentResponse += `\n\nYou're #${currentQueuePos} in the queue. Estimated wait: 2-5 minutes.`
    } else {
      agentResponse += `\n\nYou're #${currentQueuePos} in the queue. We'll connect you as soon as possible.`
    }
    
    agentResponse += "\n\nIn the meantime, feel free to share details about your delivery needs. Reply CANCEL to return to the AI assistant."
    
    await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      direction: 'outbound',
      message: agentResponse,
      sender_type: 'system'
    })
    
    return {
      response: agentResponse,
      conversation: { ...conversation, agent_requested_at: new Date().toISOString() } as Conversation
    }
  }
  
  // Check if user wants to cancel agent request
  const cancelAgentKeywords = /^(cancel|back to ai|ai|nevermind|never mind)$/i
  if (cancelAgentKeywords.test(input.trim()) && conversation.agent_requested_at) {
    // Clear the agent request
    await supabase
      .from('chat_conversations')
      .update({
        agent_requested_at: null,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id)
    
    const cancelResponse = "No problem! You're back with the AI assistant. How can I help you with your delivery today?"
    
    await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      direction: 'outbound',
      message: cancelResponse,
      sender_type: 'system'
    })
    
    return {
      response: cancelResponse,
      conversation: { ...conversation, agent_requested_at: null } as Conversation
    }
  }
  
  // If agent mode is enabled, don't auto-respond - let admin handle it
  if (conversation.agent_mode) {
    // Just update last_message_at, no auto-response
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id)
    
    // Return empty response - admin will respond manually
    return {
      response: '', // No auto-response in agent mode
      conversation: conversation as Conversation
    }
  }
  
  // Process message with AI
  let aiResult
  try {
    aiResult = await processMessageWithAI(
      normalizedPhone,
      input,
      conversation.id,
      {
        currentFlow: conversation.current_flow || 'greeting',
        flowData: (conversation.flow_data as FlowData) || {}
      },
      {
        name: customer.name || undefined,
        customerLevel: customer.customer_levels?.name
      }
    )
    console.log('[v0] AI result received:', JSON.stringify(aiResult))
  } catch (aiError) {
    console.error('[v0] AI processing failed:', aiError)
    // Return a fallback response
    return {
      response: "Hi! Thanks for reaching out to Sendy Logistics. What can I help you with today? Reply NEW to start a delivery request.",
      conversation: conversation as Conversation
    }
  }
  
  // Update conversation state
  await supabase
    .from('chat_conversations')
    .update({
      current_flow: aiResult.newFlow,
      flow_data: aiResult.newFlowData,
      last_message_at: new Date().toISOString(),
      status: aiResult.newFlow === 'trip_confirmed' ? 'trip_in_progress' : 'active'
    })
    .eq('id', conversation.id)
  
  // Save outgoing message
  await supabase.from('chat_messages').insert({
    conversation_id: conversation.id,
    direction: 'outbound',
    message: aiResult.response,
    sender_type: 'system',
    metadata: { intent: aiResult.intent }
  })
  
  // If trip was confirmed, create trip request
  if (aiResult.newFlow === 'trip_confirmed' && aiResult.newFlowData.pickupAddress && aiResult.newFlowData.deliveryAddress) {
    await supabase.from('sms_trip_requests').insert({
      conversation_id: conversation.id,
      customer_id: customer.id,
      pickup_address: aiResult.newFlowData.pickupAddress,
      pickup_formatted: aiResult.newFlowData.pickupAddress,
      delivery_address: aiResult.newFlowData.deliveryAddress,
      delivery_formatted: aiResult.newFlowData.deliveryAddress,
      distance_miles: aiResult.newFlowData.distanceMiles,
      duration_minutes: aiResult.newFlowData.durationMinutes,
      base_price: aiResult.newFlowData.basePrice,
      price_per_mile: aiResult.newFlowData.pricePerMile,
      subtotal: aiResult.newFlowData.subtotal,
      discount_percentage: aiResult.newFlowData.discountPercentage || 0,
      discount_amount: aiResult.newFlowData.discountAmount || 0,
      total_price: aiResult.newFlowData.totalPrice,
      package_description: aiResult.newFlowData.packageDescription,
      scheduled_pickup: aiResult.newFlowData.scheduledPickup,
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    })
  }
  
  // Update conversation object with new state
  const updatedConversation: Conversation = {
    ...conversation,
    current_flow: aiResult.newFlow as FlowState,
    flow_data: aiResult.newFlowData as FlowData
  }
  
  return { response: aiResult.response, conversation: updatedConversation }
}

// Send admin message to customer
export async function sendAdminMessage(
  conversationId: string,
  message: string,
  adminId: string
): Promise<boolean> {
  const supabase = createServiceClient()
  
  // Get conversation
  const { data: conversation } = await supabase
    .from('chat_conversations')
    .select('phone_number')
    .eq('id', conversationId)
    .single()
  
  if (!conversation) {
    return false
  }
  
  // Send SMS
  const success = await sendSMS(conversation.phone_number, message)
  
  if (success) {
    // Save message
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      direction: 'outbound',
      message: message,
      sender_type: 'admin',
      sender_id: adminId
    })
  }
  
  return success
}

// Get conversation history
export async function getConversationHistory(conversationId: string) {
  const supabase = createServiceClient()
  
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  
  return messages || []
}

// Get all active conversations
export async function getActiveConversations() {
  const supabase = createServiceClient()
  
  const { data: conversations } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      sms_customers(name, company),
      chat_messages(message, direction, created_at)
    `)
    .in('status', ['active', 'pending_response', 'trip_in_progress'])
    .order('last_message_at', { ascending: false })
  
  return conversations || []
}
