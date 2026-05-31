import { NextRequest, NextResponse } from "next/server"

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

// Average gas price per gallon
const AVG_GAS_PRICE = 3.50
// Average MPG for delivery vehicle
const AVG_MPG = 25

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get("origin")
  const destination = searchParams.get("destination")
  
  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination required" }, { status: 400 })
  }
  
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }
  
  try {
    // Get directions with alternatives
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&alternatives=true&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(directionsUrl)
    const data = await response.json()
    
    if (data.status !== "OK" || !data.routes?.length) {
      return NextResponse.json({ error: "Could not find route", details: data.status }, { status: 404 })
    }
    
    // Process routes
    const routes = data.routes.map((route: any, index: number) => {
      const leg = route.legs[0]
      const distanceMeters = leg.distance.value
      const distanceMiles = distanceMeters / 1609.34
      const durationSeconds = leg.duration_in_traffic?.value || leg.duration.value
      const durationMinutes = Math.ceil(durationSeconds / 60)
      
      // Calculate gas cost
      const gallonsNeeded = distanceMiles / AVG_MPG
      const gasCost = gallonsNeeded * AVG_GAS_PRICE
      
      // Check for tolls in the route
      // Google doesn't provide exact toll costs, but we can detect if tolls are present
      const hasTolls = route.warnings?.some((w: string) => 
        w.toLowerCase().includes('toll')
      ) || leg.steps?.some((step: any) => 
        step.html_instructions?.toLowerCase().includes('toll')
      )
      
      // Estimate toll cost based on distance and region (rough estimate)
      // NYC/NJ area has higher tolls
      let estimatedTolls = 0
      if (hasTolls) {
        // Base toll estimate: $0.15-0.25 per mile for toll roads
        estimatedTolls = distanceMiles * 0.20
        // Add bridge/tunnel surcharges if route passes through known toll points
        const routeSummary = route.summary?.toLowerCase() || ''
        if (routeSummary.includes('bridge') || routeSummary.includes('tunnel')) {
          estimatedTolls += 15 // Average bridge toll in NY area
        }
      }
      
      // Decode polyline for map display
      const polyline = route.overview_polyline.points
      
      return {
        index,
        summary: route.summary,
        distance: {
          text: leg.distance.text,
          meters: distanceMeters,
          miles: Math.round(distanceMiles * 10) / 10,
        },
        duration: {
          text: leg.duration_in_traffic?.text || leg.duration.text,
          seconds: durationSeconds,
          minutes: durationMinutes,
        },
        trafficDelay: leg.duration_in_traffic 
          ? Math.max(0, Math.ceil((leg.duration_in_traffic.value - leg.duration.value) / 60))
          : 0,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        polyline,
        hasTolls,
        estimatedTolls: Math.round(estimatedTolls * 100) / 100,
        gasCost: Math.round(gasCost * 100) / 100,
        totalTripCost: Math.round((estimatedTolls + gasCost) * 100) / 100,
        steps: leg.steps?.map((step: any) => ({
          instruction: step.html_instructions?.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver,
        })),
        warnings: route.warnings,
      }
    })
    
    // Sort routes by duration (fastest first)
    routes.sort((a: any, b: any) => a.duration.seconds - b.duration.seconds)
    
    return NextResponse.json({
      routes,
      bestRoute: routes[0],
      origin: data.routes[0].legs[0].start_address,
      destination: data.routes[0].legs[0].end_address,
    })
  } catch (error) {
    console.error("Route API error:", error)
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 })
  }
}
