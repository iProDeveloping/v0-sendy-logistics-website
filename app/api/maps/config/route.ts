import { NextResponse } from "next/server"

export async function GET() {
  // Return the Google Maps API key for client-side use
  // This key should be restricted to specific domains in Google Cloud Console
  return NextResponse.json({
    apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  })
}
