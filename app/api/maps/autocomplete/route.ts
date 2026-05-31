import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const input = searchParams.get('input')
  
  if (!input) {
    return NextResponse.json({ error: 'Input is required' }, { status: 400 })
  }
  
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(input)}` +
      `&components=country:us` +
      `&types=address` +
      `&key=${GOOGLE_MAPS_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Maps Autocomplete] Error:', data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || 'API error' }, { status: 500 })
    }
    
    const suggestions = (data.predictions || []).map((prediction: {
      description: string
      place_id: string
      structured_formatting?: {
        main_text: string
        secondary_text: string
      }
    }) => ({
      description: prediction.description,
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting?.main_text,
      secondaryText: prediction.structured_formatting?.secondary_text
    }))
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[Maps Autocomplete] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
