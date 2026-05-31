import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const originLat = searchParams.get('originLat')
  const originLng = searchParams.get('originLng')
  const destLat = searchParams.get('destLat')
  const destLng = searchParams.get('destLng')
  
  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: 'Origin and destination coordinates are required' }, { status: 400 })
  }
  
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API not configured' }, { status: 500 })
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${originLat},${originLng}` +
      `&destinations=${destLat},${destLng}` +
      `&units=imperial` +
      `&key=${GOOGLE_MAPS_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status !== 'OK') {
      console.error('[Distance Matrix] Error:', data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || 'API error' }, { status: 500 })
    }
    
    const element = data.rows?.[0]?.elements?.[0]
    
    if (!element || element.status !== 'OK') {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }
    
    // Distance is in meters, convert to miles
    const distanceMeters = element.distance?.value || 0
    const distanceMiles = distanceMeters / 1609.34
    
    // Duration is in seconds, convert to minutes
    const durationSeconds = element.duration?.value || 0
    const durationMinutes = Math.ceil(durationSeconds / 60)
    
    return NextResponse.json({
      distance: Math.round(distanceMiles * 100) / 100, // Round to 2 decimals
      distanceText: element.distance?.text,
      duration: durationMinutes,
      durationText: element.duration?.text
    })
  } catch (error) {
    console.error('[Distance Matrix] Error:', error)
    return NextResponse.json({ error: 'Failed to calculate distance' }, { status: 500 })
  }
}
