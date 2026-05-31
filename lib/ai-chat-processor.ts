import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { saveTripToDatabase } from '@/lib/database/trips'
import { validateAddress } from '@/lib/address-validation'

// Intent schema for understanding user messages
const IntentSchema = z.object({
  intent: z.enum([
    'greeting',
    'new_trip_request',
    'restart_order',          // User wants to start fresh / clear current order
    'provide_pickup_address',
    'provide_delivery_address', 
    'select_address_option',  // User selecting from numbered list (1-5)
    'provide_unit_number',    // User providing apt/unit number
    'confirm_no_unit',        // User confirming no unit needed
    'confirm_trip',
    'cancel_trip',
    'check_price',
    'track_delivery',
    'help',
    'general_question',
    'provide_package_info',
    'schedule_pickup',
    'unknown'
  ]),
  confidence: z.number().min(0).max(1),
  extractedData: z.object({
    address: z.string().nullable(),
    packageDescription: z.string().nullable(),
    scheduledTime: z.string().nullable(),
    trackingNumber: z.string().nullable(),
    confirmation: z.boolean().nullable(),
    selectedOption: z.number().nullable(),  // 1-5 for address selection
    unitNumber: z.string().nullable(),      // Apt/unit/suite number
  }),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'urgent']),
})

type Intent = z.infer<typeof IntentSchema>

interface ConversationContext {
  currentFlow: string
  flowData: Record<string, unknown>
  customerName?: string
  customerLevel?: string
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
}

// Understand the user's message intent
export async function understandMessage(
  message: string,
  context: ConversationContext
): Promise<Intent> {
  const systemPrompt = `You are an AI assistant for Sendy Logistics, a delivery company. 
Analyze the user's message and determine their intent.

Current conversation state:
- Flow: ${context.currentFlow}
- Flow data: ${JSON.stringify(context.flowData)}
- Customer: ${context.customerName || 'Unknown'}
- Customer level: ${context.customerLevel || 'Standard'}

Recent conversation:
${context.recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Based on the context and the new message, determine:
1. The user's intent
2. Your confidence level (0-1)
3. Any data that can be extracted (addresses, package info, times, etc.)
4. The sentiment of the message

If the user provides an address, extract it fully. If they mention a time, extract it.
If they say yes/yeah/ok/confirm, that's a confirmation.
If they say no/cancel/stop, that's a cancellation.

IMPORTANT: If the user responds with just a number (1, 2, 3, 4, or 5) or says "option 1", "number 2", etc., 
and the current flow is 'selecting_pickup' or 'selecting_delivery', their intent is 'select_address_option' 
and you should extract the selectedOption number.

UNIT NUMBERS: If the current flow is 'awaiting_unit_pickup' or 'awaiting_unit_delivery':
- If user provides a unit/apt/suite number (e.g., "apt 4B", "unit 12", "#305", "suite 100"), intent is 'provide_unit_number' and extract unitNumber
- If user says "no", "none", "no unit", "skip", "that's correct", intent is 'confirm_no_unit'

RESTART: If user says "start over", "restart", "new order", "clear", "begin again", "fresh start" at any point, their intent is 'restart_order'.
This should work even if they're in the middle of an order flow.`

  try {
    console.log('[v0] Calling AI to understand message:', message)
    
    // Use text generation with JSON instruction for more reliable parsing
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt + `\n\nRespond ONLY with a valid JSON object in this exact format:
{
  "intent": "one of: greeting, new_trip_request, restart_order, provide_pickup_address, provide_delivery_address, select_address_option, provide_unit_number, confirm_no_unit, confirm_trip, cancel_trip, check_price, track_delivery, help, general_question, provide_package_info, schedule_pickup, unknown",
  "confidence": 0.0 to 1.0,
  "extractedData": {
    "address": "string or null",
    "packageDescription": "string or null",
    "scheduledTime": "string or null",
    "trackingNumber": "string or null",
    "confirmation": true/false or null,
    "selectedOption": 1-5 or null,
    "unitNumber": "string or null (apt/unit/suite number)"
  },
  "sentiment": "one of: positive, neutral, negative, urgent"
}`,
      prompt: `User message: "${message}"\n\nRespond with JSON only:`,
    })

    console.log('[v0] AI raw response:', result.text)
    
    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const validated = IntentSchema.safeParse(parsed)
      
      if (validated.success) {
        console.log('[v0] AI intent parsed successfully:', JSON.stringify(validated.data))
        return validated.data
      } else {
        console.error('[v0] Schema validation failed:', validated.error)
      }
    }
    
    // If parsing failed, try to infer intent from simple keywords
    console.log('[v0] Falling back to keyword detection')
    return inferIntentFromKeywords(message, context)
  } catch (error) {
    console.error('[v0] Error understanding message:', error)
    return inferIntentFromKeywords(message, context)
  }
}

// Fallback keyword-based intent detection
function inferIntentFromKeywords(message: string, context: ConversationContext): Intent {
  const lowerMsg = message.toLowerCase().trim()
  const defaultExtracted = { address: null, packageDescription: null, scheduledTime: null, trackingNumber: null, confirmation: null, selectedOption: null, unitNumber: null }
  
  // PRIORITY 1: Check for restart/start over commands (works from any state)
  if (/^(start\s*over|restart|new\s*order|clear|begin\s*again|fresh\s*start|reset|new\s*delivery)$/i.test(lowerMsg) ||
      /\b(start\s*over|restart|new\s*order|want\s*to\s*start\s*fresh)\b/i.test(lowerMsg)) {
    return { intent: 'restart_order', confidence: 1, extractedData: defaultExtracted, sentiment: 'neutral' }
  }
  
  // PRIORITY 2: Check for cancellation commands (works from any state)
  if (/^(cancel|stop|quit|exit|nevermind|never\s*mind|forget\s*it)$/i.test(lowerMsg)) {
    return { intent: 'cancel_trip', confidence: 1, extractedData: { ...defaultExtracted, confirmation: false }, sentiment: 'negative' }
  }
  
  // Check for unit number flow
  if (context.currentFlow === 'awaiting_unit_pickup' || context.currentFlow === 'awaiting_unit_delivery') {
    // Check if user says no unit needed
    if (/^(no|none|nope|skip|no\s*unit|that'?s?\s*(it|correct|right|all)|correct|n\/a)$/i.test(lowerMsg)) {
      return {
        intent: 'confirm_no_unit',
        confidence: 1,
        extractedData: defaultExtracted,
        sentiment: 'neutral'
      }
    }
    // Otherwise treat as unit number
    const unitMatch = message.match(/(?:apt|apartment|unit|suite|ste|#|room|rm|floor|fl)?\.?\s*([A-Za-z0-9\-]+)/i)
    if (unitMatch) {
      return {
        intent: 'provide_unit_number',
        confidence: 0.9,
        extractedData: { ...defaultExtracted, unitNumber: unitMatch[1] || message.trim() },
        sentiment: 'neutral'
      }
    }
  }
  
  // Check for number selection (1-5)
  const numberMatch = lowerMsg.match(/^(\d)$|^option\s*(\d)|^number\s*(\d)|^#(\d)/)
  if (numberMatch && (context.currentFlow === 'selecting_pickup' || context.currentFlow === 'selecting_delivery')) {
    const num = parseInt(numberMatch[1] || numberMatch[2] || numberMatch[3] || numberMatch[4])
    if (num >= 1 && num <= 5) {
      return {
        intent: 'select_address_option',
        confidence: 1,
        extractedData: { ...defaultExtracted, selectedOption: num },
        sentiment: 'neutral'
      }
    }
  }
  
  // Greetings
  if (/^(hi|hello|hey|yo|sup|good\s*(morning|afternoon|evening))/.test(lowerMsg)) {
    return { intent: 'greeting', confidence: 0.9, extractedData: defaultExtracted, sentiment: 'positive' }
  }
  
  // New trip request
  if (/^(new|start|delivery|pickup|send|ship|need\s*(a\s*)?(delivery|pickup))/.test(lowerMsg)) {
    return { intent: 'new_trip_request', confidence: 0.9, extractedData: defaultExtracted, sentiment: 'neutral' }
  }
  
  // Confirmation
  if (/^(yes|yeah|yep|yup|ok|okay|sure|confirm|book\s*it|sounds\s*good|perfect|go\s*ahead)/.test(lowerMsg)) {
    return { intent: 'confirm_trip', confidence: 0.9, extractedData: { ...defaultExtracted, confirmation: true }, sentiment: 'positive' }
  }
  
  // Cancellation
  if (/^(no|nope|cancel|stop|nevermind|never\s*mind|forget\s*it)/.test(lowerMsg)) {
    return { intent: 'cancel_trip', confidence: 0.9, extractedData: { ...defaultExtracted, confirmation: false }, sentiment: 'negative' }
  }
  
  // Help
  if (/^(help|info|how|what|commands|\?)/.test(lowerMsg)) {
    return { intent: 'help', confidence: 0.9, extractedData: defaultExtracted, sentiment: 'neutral' }
  }
  
  // If it looks like an address (has numbers and letters, or common address words)
  if (/\d+\s+\w+/.test(lowerMsg) || /(street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|way|plaza|court|ct)\b/i.test(lowerMsg)) {
    const addressType = context.currentFlow === 'awaiting_delivery' ? 'provide_delivery_address' : 'provide_pickup_address'
    return { intent: addressType, confidence: 0.8, extractedData: { ...defaultExtracted, address: message }, sentiment: 'neutral' }
  }
  
  // Default to unknown but try to treat as address if in address flow
  if (context.currentFlow === 'awaiting_pickup' || context.currentFlow === 'awaiting_delivery') {
    const addressType = context.currentFlow === 'awaiting_delivery' ? 'provide_delivery_address' : 'provide_pickup_address'
    return { intent: addressType, confidence: 0.5, extractedData: { ...defaultExtracted, address: message }, sentiment: 'neutral' }
  }
  
  return { intent: 'unknown', confidence: 0, extractedData: defaultExtracted, sentiment: 'neutral' }
}

// Generate a natural response based on intent and context
export async function generateResponse(
  intent: Intent,
  context: ConversationContext,
  additionalInfo?: Record<string, unknown>
): Promise<string> {
  // Handle address selection list - return formatted list directly
  if (additionalInfo?.showAddressSelection && additionalInfo?.addressList) {
    const addressType = additionalInfo.addressType === 'pickup' ? 'PICKUP' : 'DELIVERY'
    return `Please select your ${addressType} address by replying with the number (1-5):\n\n${additionalInfo.addressList}`
  }
  
  // Handle invalid selection
  if (additionalInfo?.invalidSelection) {
    return `Please reply with a number ${additionalInfo.validRange} to select an address, or type a new address to search again.`
  }
  
  // Handle no address found
  if (additionalInfo?.noAddressFound) {
    return `I couldn't find that address. Please try again with more details (street number, city, state).`
  }
  
  // Handle address confirmed with quote
  if (additionalInfo?.showQuote && additionalInfo?.totalPrice) {
    const miles = additionalInfo.distanceMiles
    const price = additionalInfo.totalPrice
    const discount = additionalInfo.discountPercentage as number
    
    let response = `Got it!\n\nPickup: ${context.flowData.pickupAddress}\nDelivery: ${additionalInfo.confirmedAddress}\n\nDistance: ${miles} miles\nTotal: $${price}`
    
    if (discount > 0) {
      response += ` (${discount}% discount applied!)`
    }
    
    response += `\n\nReply YES to confirm or CANCEL to start over.`
    return response
  }
  
  // Handle asking for unit number
  if (additionalInfo?.askForUnit) {
    const addrType = additionalInfo.addressType === 'pickup' ? 'PICKUP' : 'DELIVERY'
    return `${addrType} address found:\n${additionalInfo.selectedAddress}\n\nDo you have an apartment or unit number?\n\nReply with your unit number (e.g., "4B") or reply "NO" if there's no unit.`
  }
  
  // Handle pickup confirmed, ask for delivery
  if (additionalInfo?.askForDelivery) {
    if (additionalInfo.unitAdded) {
      return `Got it! Pickup address confirmed:\n\n${additionalInfo.confirmedAddress}\n\nNow, where should we deliver to?`
    }
    return `Pickup confirmed:\n\n${additionalInfo.confirmedAddress}\n\nWhere should we deliver to?`
  }
  
  // Handle delivery confirmed with unit, show quote
  if (additionalInfo?.addressConfirmed && additionalInfo?.addressType === 'delivery' && additionalInfo?.unitAdded && !additionalInfo?.showQuote) {
    return `Delivery address confirmed:\n\n${additionalInfo.confirmedAddress}\n\nCalculating your quote...`
  }
  
  // Handle trip confirmed - delivery booked
  if (additionalInfo?.tripConfirmed) {
    const tripNumber = additionalInfo.tripNumber as number | undefined
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sendylogistics.com'
    
    let response = `Your delivery has been confirmed!`
    if (tripNumber) {
      response += `\n\nOrder #: ${tripNumber}`
      response += `\n\nTrack your delivery: ${baseUrl}/track?id=${tripNumber}`
    }
    response += `\n\nWe'll assign a driver shortly and send you updates.`
    response += `\n\nThank you for choosing Sendy!`
    return response
  }
  
  // Handle trip cancelled
  if (additionalInfo?.tripCancelled) {
    return `Your trip request has been cancelled. No worries! Just text us when you need another delivery.`
  }
  
  // Handle order restarted
  if (additionalInfo?.orderRestarted) {
    return `No problem! I've cleared your previous order.\n\nLet's start fresh. Where should we pick up your package from?`
  }
  
  // Handle greeting when user has an active order in progress
  if (additionalInfo?.isGreeting && additionalInfo?.hasActiveOrder) {
    const step = additionalInfo.currentStep as string
    const flowData = additionalInfo.flowData as Record<string, unknown>
    
    let statusMsg = `Hey! You have an order in progress.\n\n`
    
    if (flowData.pickupAddress) {
      statusMsg += `Pickup: ${flowData.pickupAddress}\n`
    }
    if (flowData.deliveryAddress) {
      statusMsg += `Delivery: ${flowData.deliveryAddress}\n`
    }
    
    // Tell them what's next
    if (step === 'awaiting_pickup' || step === 'selecting_pickup') {
      statusMsg += `\nWaiting for: Pickup address`
    } else if (step === 'awaiting_unit_pickup') {
      statusMsg += `\nWaiting for: Pickup unit/apt number`
    } else if (step === 'awaiting_delivery' || step === 'selecting_delivery') {
      statusMsg += `\nWaiting for: Delivery address`
    } else if (step === 'awaiting_unit_delivery') {
      statusMsg += `\nWaiting for: Delivery unit/apt number`
    } else if (step === 'awaiting_confirmation') {
      statusMsg += `\nWaiting for: Your confirmation (YES to book)`
    }
    
    statusMsg += `\n\nReply "START OVER" to begin a new order.`
    return statusMsg
  }

  const systemPrompt = `You are Sendy, the friendly AI assistant for Sendy Logistics delivery service.
You help customers request deliveries, get quotes, and track packages via SMS.

Your personality:
- Friendly and professional
- Concise (SMS messages should be brief)
- Helpful and proactive
- Use simple language

Current state:
- Flow: ${context.currentFlow}
- Flow data: ${JSON.stringify(context.flowData)}
- Customer: ${context.customerName || 'Valued Customer'}
- Customer level: ${context.customerLevel || 'Standard'}
${additionalInfo ? `- Additional info: ${JSON.stringify(additionalInfo)}` : ''}

User's intent: ${intent.intent}
Confidence: ${intent.confidence}
Sentiment: ${intent.sentiment}
Extracted data: ${JSON.stringify(intent.extractedData)}

Generate an appropriate SMS response. Keep it under 160 characters if possible, max 320.
Do NOT use emojis.
Do NOT say "I'm an AI" or similar.
Be conversational but efficient.

IMPORTANT CONTEXT:
- If this is a greeting or new trip request, welcome them and ask for their PICKUP address
- If trip is confirmed, thank them and let them know we'll be in touch
- If trip is cancelled, acknowledge and let them know they can start a new request anytime`

  try {
    console.log('[v0] Generating AI response for intent:', intent.intent)
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      prompt: `Generate a response for intent: ${intent.intent}`,
    })

    console.log('[v0] AI response generated:', result.text)
    return result.text
  } catch (error) {
    console.error('[v0] Error generating response:', error)
    return "Sorry, I'm having trouble right now. Please try again or call us at 845-736-3946."
  }
}

// Main AI-powered message processor
export async function processMessageWithAI(
  phoneNumber: string,
  messageBody: string,
  conversationId: string,
  flowState: { currentFlow: string; flowData: Record<string, unknown> },
  customer: { name?: string; customerLevel?: string } | null
): Promise<{ 
  response: string; 
  newFlow: string; 
  newFlowData: Record<string, unknown>;
  intent: Intent;
}> {
  console.log('[v0] processMessageWithAI called - phone:', phoneNumber, 'message:', messageBody)
  console.log('[v0] Current flow:', flowState.currentFlow, 'Flow data:', JSON.stringify(flowState.flowData))
  
  const supabase = createServiceClient()
  
  // Get recent messages for context
  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('direction, message')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(6)
  
  const context: ConversationContext = {
    currentFlow: flowState.currentFlow,
    flowData: flowState.flowData,
    customerName: customer?.name,
    customerLevel: customer?.customerLevel,
    recentMessages: (recentMessages || []).reverse().map(m => ({
      role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
      content: m.message
    }))
  }
  
  // Understand the message
  const intent = await understandMessage(messageBody, context)
  
  // Process based on intent and current flow
  let newFlow = flowState.currentFlow
  let newFlowData = { ...flowState.flowData }
  let additionalInfo: Record<string, unknown> = {}
  
  // Handle the intent
  switch (intent.intent) {
    case 'greeting':
      // If user is in the middle of an order, remind them of their progress
      if (flowState.currentFlow && flowState.currentFlow !== 'greeting' && flowState.currentFlow !== 'trip_confirmed') {
        additionalInfo = { 
          isGreeting: true, 
          hasActiveOrder: true,
          currentStep: flowState.currentFlow,
          flowData: flowState.flowData
        }
        // Don't reset flow - keep their progress
      } else {
        newFlow = 'greeting'
        additionalInfo = { isGreeting: true }
      }
      break
      
    case 'new_trip_request':
      newFlow = 'awaiting_pickup'
      newFlowData = {}
      additionalInfo = { startingNewTrip: true }
      break
      
    case 'restart_order':
      // Clear everything and start fresh
      newFlow = 'awaiting_pickup'
      newFlowData = {}
      additionalInfo = { orderRestarted: true }
      break
      
    case 'provide_pickup_address':
    case 'provide_delivery_address':
      if (intent.extractedData.address) {
        // Get address suggestions from Google
        const suggestions = await getAddressSuggestions(intent.extractedData.address)
        
        if (suggestions.length > 0) {
          // Determine if this is for pickup or delivery based on:
          // 1. Current flow state
          // 2. Whether we already have a pickup address
          // 3. The intent itself (provide_pickup_address vs provide_delivery_address)
          const hasPickupAddress = !!flowState.flowData.pickupAddress
          const isPickup = !hasPickupAddress || 
                          flowState.currentFlow === 'awaiting_pickup' || 
                          flowState.currentFlow === 'greeting' ||
                          flowState.currentFlow === 'selecting_pickup' ||
                          intent.intent === 'provide_pickup_address'
          
          // Store suggestions and move to selection flow
          newFlow = isPickup ? 'selecting_pickup' : 'selecting_delivery'
          newFlowData = { 
            ...newFlowData, 
            pendingAddressType: isPickup ? 'pickup' : 'delivery',
            addressSuggestions: suggestions,
            originalInput: intent.extractedData.address
          }
          
          // Format the address list for response
          const addressList = formatAddressList(suggestions)
          additionalInfo = { 
            showAddressSelection: true,
            addressList,
            addressType: isPickup ? 'pickup' : 'delivery'
          }
        } else {
          // No suggestions found, ask to try again
          const hasPickupForError = !!flowState.flowData.pickupAddress
          additionalInfo = { 
            noAddressFound: true,
            addressType: hasPickupForError ? 'delivery' : 'pickup',
            originalInput: intent.extractedData.address
          }
        }
      }
      break
      
    case 'select_address_option':
      const selectedNum = intent.extractedData.selectedOption
      const storedSuggestions = flowState.flowData.addressSuggestions as Array<{ placeId: string; description: string }> | undefined
      
      if (selectedNum && selectedNum >= 1 && selectedNum <= 5 && storedSuggestions && storedSuggestions[selectedNum - 1]) {
        const selectedSuggestion = storedSuggestions[selectedNum - 1]
        const placeDetails = await getPlaceDetails(selectedSuggestion.placeId)
        const addressType = flowState.flowData.pendingAddressType as string
        
        if (placeDetails) {
          // Get original input to check for unit numbers
          const originalInput = flowState.flowData.originalInput as string | undefined
          
          // Check if user already provided a unit in their original message
          const { unit: extractedUnit } = extractUnitFromAddress(originalInput || selectedSuggestion.description)
          
          // Check if this address might need a unit number (only if user didn't provide one)
          const needsUnit = !extractedUnit && await mightNeedUnitNumber(placeDetails?.address || selectedSuggestion.description, originalInput)
          
          // If user already included unit, add it to the address
          let finalAddr = placeDetails.address
          if (extractedUnit) {
            finalAddr = appendUnitToAddress(placeDetails.address, extractedUnit)
          }
          
          if (needsUnit) {
            // Ask for unit number before proceeding
            newFlow = addressType === 'pickup' ? 'awaiting_unit_pickup' : 'awaiting_unit_delivery'
            newFlowData = {
              ...newFlowData,
              pendingAddress: placeDetails.address,
              pendingLat: placeDetails.lat,
              pendingLng: placeDetails.lng,
              pendingPlaceId: selectedSuggestion.placeId,
              pendingAddressType: addressType,
              addressSuggestions: undefined
            }
            additionalInfo = {
              askForUnit: true,
              addressType,
              selectedAddress: placeDetails.address
            }
          } else if (addressType === 'pickup') {
            // Pickup address confirmed, now get delivery
            newFlow = 'awaiting_delivery'
            newFlowData = { 
              ...newFlowData, 
              pickupAddress: placeDetails.address,
              pickupLat: placeDetails.lat,
              pickupLng: placeDetails.lng,
              pickupPlaceId: selectedSuggestion.placeId,
              addressSuggestions: undefined,
              pendingAddressType: undefined
            }
            additionalInfo = { 
              addressConfirmed: true,
              addressType: 'pickup',
              confirmedAddress: placeDetails.address,
              askForDelivery: true
            }
          } else {
            // Delivery address confirmed, calculate quote
            newFlowData = { 
              ...newFlowData, 
              deliveryAddress: placeDetails.address,
              deliveryLat: placeDetails.lat,
              deliveryLng: placeDetails.lng,
              deliveryPlaceId: selectedSuggestion.placeId,
              addressSuggestions: undefined,
              pendingAddressType: undefined
            }
            
            // Calculate price using coordinates
            const priceInfo = await calculateDeliveryPrice(
              flowState.flowData.pickupAddress as string,
              placeDetails.address,
              customer?.customerLevel
            )
            
            if (priceInfo) {
              newFlow = 'awaiting_confirmation'
              newFlowData = { ...newFlowData, ...priceInfo }
              additionalInfo = { 
                addressConfirmed: true,
                addressType: 'delivery',
                confirmedAddress: placeDetails.address,
                showQuote: true,
                ...priceInfo
              }
            } else {
              newFlow = 'awaiting_confirmation'
              additionalInfo = { 
                addressConfirmed: true,
                priceError: true
              }
            }
          }
        }
      } else {
        // Invalid selection
        additionalInfo = { 
          invalidSelection: true,
          validRange: storedSuggestions ? `1-${storedSuggestions.length}` : '1-5'
        }
      }
      break
    
    case 'provide_unit_number':
    case 'confirm_no_unit':
      const pendingAddrType = flowState.flowData.pendingAddressType as string
      const pendingAddress = flowState.flowData.pendingAddress as string
      const pendingLat = flowState.flowData.pendingLat as number
      const pendingLng = flowState.flowData.pendingLng as number
      const pendingPlaceId = flowState.flowData.pendingPlaceId as string
      
      // Determine final address (with or without unit)
      let finalAddress = pendingAddress
      if (intent.intent === 'provide_unit_number' && intent.extractedData.unitNumber) {
        finalAddress = appendUnitToAddress(pendingAddress, intent.extractedData.unitNumber)
      }
      
      if (pendingAddrType === 'pickup') {
        newFlow = 'awaiting_delivery'
        newFlowData = {
          ...newFlowData,
          pickupAddress: finalAddress,
          pickupLat: pendingLat,
          pickupLng: pendingLng,
          pickupPlaceId: pendingPlaceId,
          pickupUnit: intent.extractedData.unitNumber || undefined,
          pendingAddress: undefined,
          pendingLat: undefined,
          pendingLng: undefined,
          pendingPlaceId: undefined,
          pendingAddressType: undefined
        }
        additionalInfo = {
          addressConfirmed: true,
          addressType: 'pickup',
          confirmedAddress: finalAddress,
          unitAdded: intent.intent === 'provide_unit_number',
          askForDelivery: true
        }
      } else {
        // Delivery - calculate quote
        newFlowData = {
          ...newFlowData,
          deliveryAddress: finalAddress,
          deliveryLat: pendingLat,
          deliveryLng: pendingLng,
          deliveryPlaceId: pendingPlaceId,
          deliveryUnit: intent.extractedData.unitNumber || undefined,
          pendingAddress: undefined,
          pendingLat: undefined,
          pendingLng: undefined,
          pendingPlaceId: undefined,
          pendingAddressType: undefined
        }
        
        const priceInfoUnit = await calculateDeliveryPrice(
          flowState.flowData.pickupAddress as string,
          finalAddress,
          customer?.customerLevel
        )
        
        if (priceInfoUnit) {
          newFlow = 'awaiting_confirmation'
          newFlowData = { ...newFlowData, ...priceInfoUnit }
          additionalInfo = {
            addressConfirmed: true,
            addressType: 'delivery',
            confirmedAddress: finalAddress,
            unitAdded: intent.intent === 'provide_unit_number',
            showQuote: true,
            ...priceInfoUnit
          }
        } else {
          newFlow = 'awaiting_confirmation'
          additionalInfo = {
            addressConfirmed: true,
            priceError: true
          }
        }
      }
      break
      
    case 'confirm_trip':
      console.log('[v0] confirm_trip: currentFlow=', flowState.currentFlow, 'confirmation=', intent.extractedData.confirmation)
      
      if (flowState.currentFlow === 'awaiting_confirmation' && intent.extractedData.confirmation) {
        console.log('[v0] Saving trip to database...')
        // Save the trip to the database
        const tripData = {
          customer_id: customer?.id,
          customer_name: customer?.name || undefined,
          customer_phone: phoneNumber,
          customer_email: customer?.email || undefined,
          pickup_address: flowState.flowData.pickupAddress,
          pickup_lat: flowState.flowData.pickupLat,
          pickup_lng: flowState.flowData.pickupLng,
          pickup_place_id: flowState.flowData.pickupPlaceId,
          delivery_address: flowState.flowData.deliveryAddress,
          delivery_lat: flowState.flowData.deliveryLat,
          delivery_lng: flowState.flowData.deliveryLng,
          delivery_place_id: flowState.flowData.deliveryPlaceId,
          distance_miles: flowState.flowData.distanceMiles,
          duration_minutes: flowState.flowData.durationMinutes,
          base_price: flowState.flowData.basePrice,
          per_mile_rate: flowState.flowData.pricePerMile,
          subtotal: flowState.flowData.subtotal,
          discount_percentage: flowState.flowData.discountPercentage || 0,
          discount_amount: flowState.flowData.discountAmount || 0,
          total_price: flowState.flowData.totalPrice,
          status: 'confirmed',
          source: 'sms',
          conversation_id: conversationId,
        }
        
        const savedTrip = await saveTripToDatabase(tripData)
        console.log('[v0] Trip save result:', savedTrip)
        
        newFlow = 'trip_confirmed'
        newFlowData = { 
          ...newFlowData, 
          confirmedAt: new Date().toISOString(),
          tripRequestId: savedTrip?.id 
        }
        additionalInfo = { 
          tripConfirmed: true, 
          tripDetails: newFlowData,
          tripId: savedTrip?.id,
          tripNumber: savedTrip?.trip_number
        }
      }
      break
      
    case 'cancel_trip':
      newFlow = 'greeting'
      newFlowData = {}
      additionalInfo = { tripCancelled: true }
      break
      
    case 'check_price':
      additionalInfo = { 
        wantsPrice: true,
        currentFlowData: flowState.flowData 
      }
      break
      
    case 'track_delivery':
      additionalInfo = { 
        wantsTracking: true,
        trackingNumber: intent.extractedData.trackingNumber 
      }
      break
      
    case 'help':
      additionalInfo = { needsHelp: true }
      break
      
    case 'provide_package_info':
      if (intent.extractedData.packageDescription) {
        newFlowData = { 
          ...newFlowData, 
          packageDescription: intent.extractedData.packageDescription 
        }
      }
      break
      
    case 'schedule_pickup':
      if (intent.extractedData.scheduledTime) {
        newFlowData = { 
          ...newFlowData, 
          scheduledPickup: intent.extractedData.scheduledTime 
        }
      }
      break
      
    default:
      // For unknown or general questions, just respond naturally
      break
  }
  
  // Generate response
  const updatedContext = { ...context, currentFlow: newFlow, flowData: newFlowData }
  const response = await generateResponse(intent, updatedContext, additionalInfo)
  
  return {
    response,
    newFlow,
    newFlowData,
    intent
  }
}

// Helper to get address suggestions from Google Places
async function getAddressSuggestions(input: string): Promise<Array<{ placeId: string; description: string }>> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.predictions) {
      return []
    }
    
    // Return top 5 suggestions
    return data.predictions.slice(0, 5).map((p: { place_id: string; description: string }) => ({
      placeId: p.place_id,
      description: p.description
    }))
  } catch (error) {
    console.error('[AI] Error fetching address suggestions:', error)
    return []
  }
}

// Helper to get full address details from place ID
async function getPlaceDetails(placeId: string): Promise<{ address: string; lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.result) {
      return null
    }
    
    return {
      address: data.result.formatted_address,
      lat: data.result.geometry.location.lat,
      lng: data.result.geometry.location.lng
    }
  } catch (error) {
    console.error('[AI] Error fetching place details:', error)
    return null
  }
}

// Format numbered address list for SMS
function formatAddressList(suggestions: Array<{ description: string }>): string {
  return suggestions.map((s, i) => `${i + 1}. ${s.description}`).join('\n')
}

// Check if address might need a unit number using Google Address Validation API
async function mightNeedUnitNumber(address: string, originalInput?: string): Promise<boolean> {
  const addrLower = address.toLowerCase()
  const inputLower = (originalInput || '').toLowerCase()
  
  // Common indicators that unit is ALREADY provided
  const unitAlreadyProvided = [
    /\bapartment\s*#?\s*[A-Za-z0-9]/i,
    /\bapt\.?\s*#?\s*[A-Za-z0-9]/i,
    /\bunit\s*#?\s*[A-Za-z0-9]/i,
    /\bsuite\s*#?\s*[A-Za-z0-9]/i,
    /\bste\.?\s*#?\s*[A-Za-z0-9]/i,
    /\bfloor\s*#?\s*[0-9]/i,
    /\bfl\.?\s*#?\s*[0-9]/i,
    /\b#\s*[A-Za-z0-9]+\b/i,
    /\b\d+[A-Za-z]\b/i, // e.g., "4B", "12A"
  ]
  
  // If unit is already in address or input, don't ask again
  const hasUnitAlready = unitAlreadyProvided.some(pattern => 
    pattern.test(addrLower) || pattern.test(inputLower)
  )
  
  if (hasUnitAlready) {
    console.log(`[v0] Unit already provided in address: ${address}`)
    return false
  }
  
  // Single-family indicators - skip unit prompt for these
  const singleFamilyIndicators = [
    /\bhouse\b/i,
    /\bresidence\b/i,
    /\bestate\b/i,
    /\bfarm\b/i,
    /\branch\b/i,
  ]
  
  if (singleFamilyIndicators.some(p => p.test(addrLower))) {
    console.log(`[v0] Single-family indicator found, skipping unit prompt`)
    return false
  }
  
  // Try Google Address Validation API first
  try {
    const validation = await validateAddress(address)
    console.log(`[v0] Address validation result for "${address}":`, {
      needsSubpremise: validation.needsSubpremise,
      confidence: validation.confidence,
      issues: validation.issues
    })
    
    // Google API explicitly tells us if subpremise is needed
    if (validation.needsSubpremise) {
      console.log(`[v0] Google API says ${address} needs subpremise`)
      return true
    }
    
    // Check USPS-related issues
    if (validation.issues.some(i => 
      i.toLowerCase().includes('secondary') || 
      i.toLowerCase().includes('incomplete') ||
      i.toLowerCase().includes('subpremise')
    )) {
      console.log(`[v0] USPS indicates ${address} may need unit`)
      return true
    }
    
    // If Google says address is complete with HIGH confidence, trust it
    if (validation.confidence === 'HIGH') {
      console.log(`[v0] Address validation API says ${address} is complete (HIGH confidence)`)
      return false
    }
    
    // Only return false for MEDIUM confidence - don't prompt unless API explicitly says so
    console.log(`[v0] Address validation returned confidence: ${validation.confidence} - not prompting for unit`)
    return false
  } catch (error) {
    console.error('[v0] Address validation API failed:', error)
    // On API failure, don't prompt for unit - assume address is complete
    return false
  }
}

// Extract unit number from an address string if present
function extractUnitFromAddress(address: string): { address: string; unit: string | null } {
  // Patterns to match unit numbers in addresses
  const unitPatterns = [
    /\s*,?\s*(apt\.?|apartment)\s*#?\s*([A-Za-z0-9\-]+)/i,
    /\s*,?\s*(unit)\s*#?\s*([A-Za-z0-9\-]+)/i,
    /\s*,?\s*(suite|ste\.?)\s*#?\s*([A-Za-z0-9\-]+)/i,
    /\s*,?\s*#\s*([A-Za-z0-9\-]+)/i,
    /\s*,?\s*(floor|fl\.?)\s*#?\s*([A-Za-z0-9\-]+)/i,
  ]
  
  for (const pattern of unitPatterns) {
    const match = address.match(pattern)
    if (match) {
      // Extract the unit number (last capture group)
      const unit = match[match.length - 1]
      // Remove the unit from the address
      const cleanAddress = address.replace(pattern, '').trim().replace(/\s+/g, ' ')
      return { address: cleanAddress, unit }
    }
  }
  
  return { address, unit: null }
}

// Append unit number to address
function appendUnitToAddress(address: string, unitNumber: string): string {
  // Clean up the unit number
  const cleanUnit = unitNumber.trim().replace(/^(apt|apartment|unit|suite|ste|#|room|rm)\.?\s*/i, '')
  
  // Insert unit after street address but before city/state
  const parts = address.split(',')
  if (parts.length >= 2) {
    parts[0] = `${parts[0]} Apt ${cleanUnit}`
    return parts.join(',')
  }
  
  return `${address} Apt ${cleanUnit}`
}

// Helper to calculate delivery price using Google Maps
async function calculateDeliveryPrice(
  pickupAddress: string,
  deliveryAddress: string,
  customerLevel?: string
): Promise<Record<string, unknown> | null> {
  try {
    const supabase = createServiceClient()
    
    // Get distance from Google Maps
    const distanceResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickupAddress)}&destinations=${encodeURIComponent(deliveryAddress)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )
    
    const distanceData = await distanceResponse.json()
    
    if (distanceData.rows?.[0]?.elements?.[0]?.status !== 'OK') {
      return null
    }
    
    const distanceMeters = distanceData.rows[0].elements[0].distance.value
    const durationSeconds = distanceData.rows[0].elements[0].duration.value
    const distanceMiles = distanceMeters / 1609.34
    const durationMinutes = Math.ceil(durationSeconds / 60)
    
    // Get pricing rule
    const { data: pricingRule } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .eq('service_type', 'standard')
      .gte('max_miles', distanceMiles)
      .lte('min_miles', distanceMiles)
      .order('min_miles', { ascending: true })
      .limit(1)
      .single()
    
    if (!pricingRule) {
      // Use default pricing
      const basePrice = 15
      const pricePerMile = 2
      const subtotal = basePrice + (distanceMiles * pricePerMile)
      
      return {
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        durationMinutes,
        basePrice,
        pricePerMile,
        subtotal: Math.round(subtotal * 100) / 100,
        discountPercentage: 0,
        discountAmount: 0,
        totalPrice: Math.round(subtotal * 100) / 100
      }
    }
    
    const subtotal = Number(pricingRule.base_price) + (distanceMiles * Number(pricingRule.price_per_mile))
    
    // Get customer discount
    let discountPercentage = 0
    if (customerLevel) {
      const { data: level } = await supabase
        .from('customer_levels')
        .select('discount_percentage')
        .eq('name', customerLevel)
        .single()
      
      discountPercentage = level?.discount_percentage || 0
    }
    
    const discountAmount = subtotal * (discountPercentage / 100)
    const totalPrice = subtotal - discountAmount
    
    return {
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      durationMinutes,
      basePrice: Number(pricingRule.base_price),
      pricePerMile: Number(pricingRule.price_per_mile),
      subtotal: Math.round(subtotal * 100) / 100,
      discountPercentage,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100
    }
  } catch (error) {
    console.error('[AI] Error calculating price:', error)
    return null
  }
}
