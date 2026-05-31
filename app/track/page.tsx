"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  RotateCcw,
  Navigation,
  Phone,
  RefreshCw
} from "lucide-react"
import { LoadScript, GoogleMap, Marker, Polyline } from "@react-google-maps/api"

const statusConfig: Record<string, { icon: typeof Package; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100", label: "Pending Pickup" },
  confirmed: { icon: CheckCircle, color: "text-blue-600", bgColor: "bg-blue-100", label: "Confirmed" },
  assigned: { icon: Truck, color: "text-blue-600", bgColor: "bg-blue-100", label: "Driver Assigned" },
  picked_up: { icon: Package, color: "text-indigo-600", bgColor: "bg-indigo-100", label: "Picked Up" },
  in_transit: { icon: Truck, color: "text-primary", bgColor: "bg-primary/10", label: "In Transit" },
  out_for_delivery: { icon: Navigation, color: "text-green-600", bgColor: "bg-green-100", label: "Out for Delivery" },
  delivered: { icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-100", label: "Delivered" },
  returned: { icon: RotateCcw, color: "text-red-600", bgColor: "bg-red-100", label: "Returned" },
  cancelled: { icon: RotateCcw, color: "text-red-600", bgColor: "bg-red-100", label: "Cancelled" },
}

interface PackageEvent {
  id: string
  status: string
  location: string | null
  description: string | null
  event_time: string
}

interface DriverInfo {
  id: string
  name: string
  phone: string
  current_lat: number | null
  current_lng: number | null
  last_update: string | null
}

interface PackageData {
  id: string
  tracking_number: string
  recipient_name: string
  recipient_address: string
  pickup_address?: string
  pickup_lat?: number
  pickup_lng?: number
  delivery_lat?: number
  delivery_lng?: number
  status: string
  estimated_delivery: string | null
  distance_miles?: number
  total_price?: number
  driver?: DriverInfo | null
  events: PackageEvent[]
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const defaultCenter = { lat: 40.7128, lng: -74.006 } // NYC

export default function TrackPage() {
  const searchParams = useSearchParams()
  const [trackingNumber, setTrackingNumber] = useState("")
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [mapsApiKey, setMapsApiKey] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const mapRef = useRef<any>(null)

  // Fetch maps API key
  useEffect(() => {
    fetch("/api/maps/config")
      .then(res => res.json())
      .then(data => setMapsApiKey(data.apiKey || ""))
      .catch(() => setMapsApiKey(""))
  }, [])

  // Auto-track if ID is provided in URL
  useEffect(() => {
    const idFromUrl = searchParams.get("id")
    if (idFromUrl) {
      setTrackingNumber(idFromUrl.toUpperCase())
      trackPackage(idFromUrl)
    }
  }, [searchParams])

  // Auto-refresh driver location every 30 seconds if in transit
  useEffect(() => {
    if (!packageData || !["in_transit", "out_for_delivery", "assigned", "picked_up"].includes(packageData.status)) {
      return
    }

    const interval = setInterval(() => {
      if (trackingNumber) {
        refreshDriverLocation()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [packageData, trackingNumber])

  const trackPackage = async (number: string) => {
    if (!number.trim()) return

    setLoading(true)
    setError(null)
    setSuggestion(null)
    setSearched(true)

    try {
      const response = await fetch(`/api/track?number=${encodeURIComponent(number)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Package not found")
        setSuggestion(data.suggestion || null)
        setPackageData(null)
      } else {
        setPackageData(data)
        setError(null)
      }
    } catch {
      setError("Failed to track package. Please try again.")
      setPackageData(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshDriverLocation = async () => {
    if (!trackingNumber) return
    setRefreshing(true)
    try {
      const response = await fetch(`/api/track?number=${encodeURIComponent(trackingNumber)}`)
      const data = await response.json()
      if (response.ok && data.driver) {
        setPackageData(prev => prev ? { ...prev, driver: data.driver, status: data.status } : null)
      }
    } catch {
      // Silent fail for refresh
    } finally {
      setRefreshing(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    trackPackage(trackingNumber)
  }

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map
  }, [])

  // Fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || !packageData || typeof window === 'undefined' || !window.google) return
    
    const bounds = new window.google.maps.LatLngBounds()
    let hasPoints = false

    if (packageData.pickup_lat && packageData.pickup_lng) {
      bounds.extend({ lat: packageData.pickup_lat, lng: packageData.pickup_lng })
      hasPoints = true
    }
    if (packageData.delivery_lat && packageData.delivery_lng) {
      bounds.extend({ lat: packageData.delivery_lat, lng: packageData.delivery_lng })
      hasPoints = true
    }
    if (packageData.driver?.current_lat && packageData.driver?.current_lng) {
      bounds.extend({ lat: packageData.driver.current_lat, lng: packageData.driver.current_lng })
      hasPoints = true
    }

    if (hasPoints) {
      mapRef.current.fitBounds(bounds, { padding: 60 })
    }
  }, [packageData])

  const currentStatus = packageData ? statusConfig[packageData.status] || statusConfig.pending : null

  // Calculate route path for polyline
  const routePath = packageData && packageData.pickup_lat && packageData.delivery_lat
    ? [
        { lat: packageData.pickup_lat, lng: packageData.pickup_lng! },
        { lat: packageData.delivery_lat, lng: packageData.delivery_lng! }
      ]
    : []

  const hasMapData = packageData && (
    (packageData.pickup_lat && packageData.pickup_lng) ||
    (packageData.delivery_lat && packageData.delivery_lng) ||
    (packageData.driver?.current_lat && packageData.driver?.current_lng)
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-8 px-4 sm:px-6 lg:px-8 bg-[#e8e4dd]">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Track Your Package
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Enter your tracking number to see the current status of your delivery.
          </p>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter order number (e.g., 1001)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="pl-12 h-14 text-lg rounded-full bg-white uppercase"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !trackingNumber.trim()}
              className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? "Tracking..." : "Track"}
            </Button>
          </form>
        </div>
      </section>

      {/* Results Section */}
      {searched && (
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <Package className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="font-semibold text-red-800 mb-2">Package Not Found</h2>
                <p className="text-red-600">{error}</p>
                {suggestion && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 font-medium">{suggestion}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                      onClick={() => {
                        const suggestedId = suggestion.replace('Did you mean: ', '').replace('?', '')
                        setTrackingNumber(suggestedId)
                        trackPackage(suggestedId)
                      }}
                    >
                      Track {suggestion.replace('Did you mean: ', '').replace('?', '')}
                    </Button>
                  </div>
                )}
                <p className="text-sm text-red-500 mt-4">
                  Enter your order number (e.g., 1001, 1002) to track your delivery
                </p>
              </div>
            ) : packageData && currentStatus ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column - Status & Details */}
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className={`bg-card border border-border rounded-2xl overflow-hidden`}>
                    <div className={`p-6 ${currentStatus.bgColor}`}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                          <p className="font-mono text-xl font-bold text-foreground">{packageData.tracking_number}</p>
                        </div>
                        <Badge className={`${currentStatus.color} ${currentStatus.bgColor} px-4 py-2 text-sm font-semibold`}>
                          <currentStatus.icon className="w-4 h-4 mr-2" />
                          {currentStatus.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Package Details */}
                    <div className="p-6 space-y-4">
                      {packageData.pickup_address && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pickup From</p>
                            <p className="font-medium text-foreground">{packageData.pickup_address}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Navigation className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Deliver To</p>
                          <p className="font-medium text-foreground">{packageData.recipient_address}</p>
                          {packageData.recipient_name && (
                            <p className="text-sm text-muted-foreground">{packageData.recipient_name}</p>
                          )}
                        </div>
                      </div>

                      {packageData.distance_miles && (
                        <div className="flex items-center gap-4 pt-2 border-t border-border text-sm text-muted-foreground">
                          <span>Distance: {packageData.distance_miles} mi</span>
                          {packageData.total_price && (
                            <span>Total: ${packageData.total_price}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver Card */}
                  {packageData.driver && (
                    <div className="bg-card border border-border rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Your Driver</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refreshDriverLocation}
                          disabled={refreshing}
                          className="text-xs"
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{packageData.driver.name}</p>
                          {packageData.driver.last_update && (
                            <p className="text-xs text-muted-foreground">
                              Last update: {new Date(packageData.driver.last_update).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        {packageData.driver.phone && (
                          <a 
                            href={`tel:${packageData.driver.phone}`}
                            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <Phone className="w-5 h-5 text-green-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {packageData.events && packageData.events.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6">
                      <h3 className="font-semibold text-foreground mb-4">Tracking History</h3>
                      <div className="space-y-4">
                        {packageData.events.map((event, index) => {
                          const eventStatus = statusConfig[event.status] || statusConfig.pending
                          const EventIcon = eventStatus.icon
                          return (
                            <div key={event.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? "bg-primary" : "bg-muted"}`}>
                                  <EventIcon className={`w-4 h-4 ${index === 0 ? "text-primary-foreground" : "text-muted-foreground"}`} />
                                </div>
                                {index < packageData.events.length - 1 && (
                                  <div className="w-0.5 h-full bg-border flex-1 my-1" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className={`font-semibold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                  {eventStatus.label}
                                </p>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground">{event.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(event.event_time).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Map */}
                <div className="lg:sticky lg:top-24 h-fit">
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Live Tracking
                      </h3>
                    </div>
                    <div className="h-[400px] lg:h-[500px]">
                      {mapsApiKey && hasMapData ? (
                        <LoadScript googleMapsApiKey={mapsApiKey}>
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={
                              packageData.driver?.current_lat && packageData.driver?.current_lng
                                ? { lat: packageData.driver.current_lat, lng: packageData.driver.current_lng }
                                : packageData.pickup_lat && packageData.pickup_lng
                                  ? { lat: packageData.pickup_lat, lng: packageData.pickup_lng }
                                  : defaultCenter
                            }
                            zoom={13}
                            onLoad={onMapLoad}
                            options={{
                              disableDefaultUI: true,
                              zoomControl: true,
                              mapTypeControl: false,
                              streetViewControl: false,
                            }}
                          >
                            {/* Pickup Marker */}
                            {packageData.pickup_lat && packageData.pickup_lng && (
                              <Marker
                                position={{ lat: packageData.pickup_lat, lng: packageData.pickup_lng }}
                                icon={{
                                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6">
                                      <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
                                      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
                                    </svg>
                                  `)}`,
                                  scaledSize: window.google ? new window.google.maps.Size(32, 32) : undefined,
                                }}
                                title="Pickup Location"
                              />
                            )}

                            {/* Delivery Marker */}
                            {packageData.delivery_lat && packageData.delivery_lng && (
                              <Marker
                                position={{ lat: packageData.delivery_lat, lng: packageData.delivery_lng }}
                                icon={{
                                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#16a34a">
                                      <circle cx="12" cy="12" r="10" fill="#16a34a"/>
                                      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
                                    </svg>
                                  `)}`,
                                  scaledSize: window.google ? new window.google.maps.Size(32, 32) : undefined,
                                }}
                                title="Delivery Location"
                              />
                            )}

                            {/* Driver Marker */}
                            {packageData.driver?.current_lat && packageData.driver?.current_lng && (
                              <Marker
                                position={{ lat: packageData.driver.current_lat, lng: packageData.driver.current_lng }}
                                icon={{
                                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="11" fill="#d96727" stroke="white" strokeWidth="2"/>
                                      <path d="M7 13L10 10L14 14L17 11" stroke="white" strokeWidth="2" fill="none"/>
                                    </svg>
                                  `)}`,
                                  scaledSize: window.google ? new window.google.maps.Size(40, 40) : undefined,
                                }}
                                title={`Driver: ${packageData.driver.name}`}
                              />
                            )}

                            {/* Route Line */}
                            {routePath.length === 2 && (
                              <Polyline
                                path={routePath}
                                options={{
                                  strokeColor: "#d96727",
                                  strokeOpacity: 0.8,
                                  strokeWeight: 4,
                                }}
                              />
                            )}
                          </GoogleMap>
                        </LoadScript>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-muted/30">
                          <div className="text-center text-muted-foreground">
                            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Map data not available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Map Legend */}
                    <div className="p-4 border-t border-border bg-muted/30">
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span>Pickup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-600"></div>
                          <span>Delivery</span>
                        </div>
                        {packageData.driver && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-primary"></div>
                            <span>Driver</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Help Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-8">
            Can&apos;t find your tracking number? Contact our support team for assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors">
              Contact Support
            </a>
            <a href="/faq" className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary/10 transition-colors">
              View FAQs
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
