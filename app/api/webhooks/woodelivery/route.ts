import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { sendStatusUpdateSMS, getShortTrackingId } from "@/lib/status-notifications"

// WooDelivery webhook payload types
interface WooDeliveryWebhookPayload {
  event: string
  task_id: string
  external_id?: string
  status: string
  status_text?: string
  driver_name?: string
  driver_phone?: string
  location?: string
  timestamp: string
  signature?: string
}

// Verify webhook signature (if WooDelivery provides one)
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const webhookSecret = process.env.WOODELIVERY_WEBHOOK_SECRET
  if (!webhookSecret || !signature) return true // Skip verification if not configured
  
  // WooDelivery may use HMAC-SHA256 for webhook verification
  // Implement based on their documentation
  return true
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("x-woodelivery-signature")
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const data: WooDeliveryWebhookPayload = JSON.parse(payload)
    
    // Map WooDelivery status to our status
    const statusMap: Record<string, string> = {
      pending: "pending",
      assigned: "pending",
      picked_up: "picked_up",
      in_transit: "in_transit",
      out_for_delivery: "out_for_delivery",
      completed: "delivered",
      delivered: "delivered",
      cancelled: "returned",
      failed: "returned",
    }

    const mappedStatus = statusMap[data.status?.toLowerCase()] || data.status

    // If we have an external_id, try to sync with our database
    if (data.external_id) {
      const supabase = await createClient()
      
      // Check if package exists in our database
      const { data: existingPackage } = await supabase
        .from("packages")
        .select("id")
        .eq("tracking_number", data.external_id.toUpperCase())
        .single()

      if (existingPackage) {
        // Update package status
        await supabase
          .from("packages")
          .update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPackage.id)

        // Add event to history
        await supabase.from("package_events").insert({
          package_id: existingPackage.id,
          status: mappedStatus,
          location: data.location,
          description: data.status_text || `Status updated to ${data.status}`,
          event_time: data.timestamp || new Date().toISOString(),
        })
      }
      
      // Also check trip_requests table and send SMS notification
      const { data: tripRequest } = await supabase
        .from("trip_requests")
        .select("id, customer_phone, status")
        .or(`id.eq.${data.external_id},conversation_id.eq.${data.external_id}`)
        .single()
      
      if (tripRequest && tripRequest.customer_phone && tripRequest.status !== mappedStatus) {
        // Update trip status
        await supabase
          .from("trip_requests")
          .update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tripRequest.id)
        
        // Send SMS notification with tracking link
        await sendStatusUpdateSMS(
          tripRequest.id,
          mappedStatus,
          tripRequest.customer_phone,
          {
            driverName: data.driver_name || undefined,
            location: data.location || undefined,
          }
        )
        
        console.log(`[WooDelivery Webhook] Sent SMS notification for trip ${getShortTrackingId(tripRequest.id)}`)
      }
    }

    // Log webhook for debugging
    console.log("[WooDelivery Webhook]", {
      event: data.event,
      task_id: data.task_id,
      external_id: data.external_id,
      status: data.status,
      timestamp: data.timestamp,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WooDelivery Webhook] Error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

// Handle webhook verification (GET request from WooDelivery)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get("challenge")
  
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ status: "Webhook endpoint active" })
}
