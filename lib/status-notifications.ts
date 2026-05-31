import { sendSMS } from "./twilio"
import { createServiceClient } from "./supabase/server"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://sendylogistics.com"

// Status messages with tracking link
const STATUS_MESSAGES: Record<string, (trackingId: string, details?: Record<string, string>) => string> = {
  confirmed: (trackingId) => 
    `Your Sendy delivery #${trackingId} has been confirmed! We're finding you a driver.\n\nTrack: ${BASE_URL}/track?id=${trackingId}`,
  
  assigned: (trackingId, details) => 
    `Great news! Driver ${details?.driverName || 'has been'} assigned to your delivery #${trackingId}. They'll pick up your package soon.\n\nTrack: ${BASE_URL}/track?id=${trackingId}`,
  
  picked_up: (trackingId) => 
    `Your package #${trackingId} has been picked up and is on its way!\n\nTrack: ${BASE_URL}/track?id=${trackingId}`,
  
  in_transit: (trackingId) => 
    `Your delivery #${trackingId} is in transit.\n\nTrack: ${BASE_URL}/track?id=${trackingId}`,
  
  out_for_delivery: (trackingId, details) => 
    `Your package #${trackingId} is out for delivery! Estimated arrival: ${details?.eta || 'soon'}.\n\nTrack: ${BASE_URL}/track?id=${trackingId}`,
  
  delivered: (trackingId) => 
    `Your Sendy delivery #${trackingId} has been delivered! Thank you for choosing Sendy.\n\nRate your experience: ${BASE_URL}/track?id=${trackingId}`,
  
  cancelled: (trackingId) => 
    `Your delivery #${trackingId} has been cancelled. If you have questions, reply to this message or contact support.`,
  
  returned: (trackingId) => 
    `Delivery attempt for #${trackingId} was unsuccessful. The package is being returned. Please contact support for assistance.`,
}

// Get short tracking ID from UUID (legacy support)
export function getShortTrackingId(tripId: string): string {
  return tripId.slice(0, 8).toUpperCase()
}

// Get tracking ID - prefer trip_number if available
export function getTrackingId(tripNumber: number | null, tripId?: string): string {
  if (tripNumber) {
    return String(tripNumber)
  }
  return tripId ? tripId.slice(0, 8).toUpperCase() : ''
}

// Get tracking URL
export function getTrackingUrl(tripNumber: number | null, tripId?: string): string {
  const trackingId = getTrackingId(tripNumber, tripId)
  return `${BASE_URL}/track?id=${trackingId}`
}

// Send status update SMS
export async function sendStatusUpdateSMS(
  tripId: string,
  status: string,
  customerPhone: string,
  details?: Record<string, string>,
  tripNumber?: number | null
): Promise<{ success: boolean; error?: string }> {
  const trackingId = getTrackingId(tripNumber ?? null, tripId)
  
  // Get the message template for this status
  const messageTemplate = STATUS_MESSAGES[status]
  if (!messageTemplate) {
    console.log(`[StatusNotifications] No message template for status: ${status}`)
    return { success: false, error: `No message template for status: ${status}` }
  }
  
  const message = messageTemplate(trackingId, details)
  
  // Send SMS
  const result = await sendSMS(customerPhone, message)
  
  if (result.success) {
    console.log(`[StatusNotifications] Sent ${status} SMS to ${customerPhone} for trip ${trackingId}`)
  } else {
    console.error(`[StatusNotifications] Failed to send SMS:`, result.error)
  }
  
  return result
}

// Update trip status and send notification
export async function updateTripStatusWithNotification(
  tripId: string,
  newStatus: string,
  details?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient()
  
  // Get trip details including trip_number
  const { data: trip, error: fetchError } = await supabase
    .from("trip_requests")
    .select("id, customer_phone, status, trip_number")
    .eq("id", tripId)
    .single()
  
  if (fetchError || !trip) {
    return { success: false, error: "Trip not found" }
  }
  
  // Don't send notification if status hasn't changed
  if (trip.status === newStatus) {
    return { success: true }
  }
  
  // Update status
  const { error: updateError } = await supabase
    .from("trip_requests")
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", tripId)
  
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  // Send SMS notification if customer has a phone number
  if (trip.customer_phone) {
    await sendStatusUpdateSMS(tripId, newStatus, trip.customer_phone, details, trip.trip_number)
  }
  
  return { success: true }
}
