import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
const phoneNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize Twilio client
export function getTwilioClient() {
  if (!accountSid || !authToken) {
    console.error('[Twilio] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN')
    return null
  }
  return twilio(accountSid, authToken)
}

// Send SMS message
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const client = getTwilioClient()
  
  if (!client) {
    return { success: false, error: 'Twilio client not configured' }
  }

  try {
    const messageOptions: {
      body: string
      to: string
      from?: string
      messagingServiceSid?: string
    } = {
      body,
      to: formatPhoneNumber(to),
    }

    // Use messaging service if available, otherwise use phone number
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid
    } else if (phoneNumber) {
      messageOptions.from = phoneNumber
    } else {
      return { success: false, error: 'No Twilio phone number or messaging service configured' }
    }

    const message = await client.messages.create(messageOptions)
    
    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('[Twilio] Error sending SMS:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    }
  }
}

// Validate Twilio webhook signature
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false
  
  return twilio.validateRequest(authToken, signature, url, params)
}

// Format phone number to E.164 format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If it starts with 1 and is 11 digits, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // If it already has a country code, just add +
  if (digits.length > 10) {
    return `+${digits}`
  }
  
  // Return as-is if we can't determine format
  return phone
}

// Parse phone number from Twilio format
export function parsePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

export { twilio }
