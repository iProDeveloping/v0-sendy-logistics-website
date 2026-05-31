import { NextRequest, NextResponse } from 'next/server'
import { processIncomingMessage } from '@/lib/chat-flow'
import { sendSMS, validateTwilioSignature } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await request.formData()
    const params: Record<string, string> = {}
    
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })
    
    // Extract message details
    const from = params.From || ''
    const body = params.Body || ''
    const messageSid = params.MessageSid || ''
    
    if (!from || !body) {
      return new NextResponse('Missing required fields', { status: 400 })
    }
    
    // Process the message through AI-powered chat flow
    const { response } = await processIncomingMessage(from, body, messageSid)
    
    // Send response SMS
    if (response) {
      await sendSMS(from, response)
    }
    
    // Return TwiML response (empty to prevent double-send)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    )
  } catch (error) {
    console.error('[Twilio Webhook Error]:', error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown'}`, { status: 500 })
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Twilio webhook active' })
}
