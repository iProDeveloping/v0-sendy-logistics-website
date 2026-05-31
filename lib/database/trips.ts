import { createServiceClient } from "@/lib/supabase/server"

interface TripData {
  customer_id?: string
  customer_name?: string
  customer_phone: string
  customer_email?: string
  pickup_address: string
  pickup_lat?: number
  pickup_lng?: number
  pickup_place_id?: string
  pickup_unit?: string
  delivery_address: string
  delivery_lat?: number
  delivery_lng?: number
  delivery_place_id?: string
  delivery_unit?: string
  distance_miles?: number
  duration_minutes?: number
  base_price?: number
  per_mile_rate?: number
  subtotal?: number
  discount_percentage?: number
  discount_amount?: number
  total_price?: number
  status?: string
  source?: string
  conversation_id?: string
}

// Save a confirmed trip to the database
export async function saveTripToDatabase(tripData: TripData): Promise<{ id: string; trip_number: number | null } | null> {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('trip_requests')
      .insert({
        ...tripData,
        status: tripData.status || 'confirmed',
        source: tripData.source || 'sms',
      })
      .select('id, trip_number')
      .single()
    
    if (error) {
      console.error('[trips] Error saving trip:', error)
      return null
    }
    
    console.log('[trips] Trip saved successfully:', data.id, 'Order #:', data.trip_number)
    return data
  } catch (err) {
    console.error('[trips] Failed to save trip:', err)
    return null
  }
}

// Get trip by ID
export async function getTripById(tripId: string) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('trip_requests')
    .select(`
      *,
      sms_customers (id, name, phone_number, company),
      drivers (id, name, phone),
      package_types (id, name)
    `)
    .eq('id', tripId)
    .single()
  
  if (error) {
    console.error('[trips] Error fetching trip:', error)
    return null
  }
  
  return data
}

// Update trip status
export async function updateTripStatus(tripId: string, status: string, additionalData?: Record<string, unknown>) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('trip_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    })
    .eq('id', tripId)
    .select('id, status')
    .single()
  
  if (error) {
    console.error('[trips] Error updating trip status:', error)
    return null
  }
  
  return data
}

// Get trips by phone number
export async function getTripsByPhone(phoneNumber: string, limit = 10) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('trip_requests')
    .select('*')
    .eq('customer_phone', phoneNumber)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[trips] Error fetching trips by phone:', error)
    return []
  }
  
  return data
}

// Get active trips (for map display)
export async function getActiveTrips() {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('trip_requests')
    .select(`
      *,
      sms_customers (id, name, phone_number, company),
      drivers (id, name, phone, current_lat, current_lng),
      package_types (id, name)
    `)
    .in('status', ['pending', 'confirmed', 'assigned', 'picked_up', 'in_transit'])
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('[trips] Error fetching active trips:', error)
    return []
  }
  
  return data
}
