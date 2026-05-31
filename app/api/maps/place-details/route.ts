import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const placeId = searchParams.get('placeId')
  
  if (!placeId) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
  }
  
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${encodeURIComponent(placeId)}` +
      `&fields=formatted_address,geometry,address_components` +
      `&key=${GOOGLE_MAPS_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK') {
      console.error('[Place Details] Error:', data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || 'API error' }, { status: 500 })
    }
    
    const result = data.result
    
    return NextResponse.json({
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng
      },
      addressComponents: result.address_components
    })
  } catch (error) {
    console.error('[Place Details] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 })
  }
}
