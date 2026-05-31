"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline, TrafficLayer } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Truck,
  RefreshCw,
  List,
  Map as MapIcon,
  DollarSign,
  AlertTriangle,
  Timer,
  Car,
  Wifi,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Trip {
  id: string
  customer_name: string | null
  customer_phone: string
  pickup_address: string
  pickup_lat: number | null
  pickup_lng: number | null
  pickup_notes: string | null
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  delivery_notes: string | null
  status: string
  driver_id: string | null
  scheduled_pickup_at: string | null
  total_price: number | null
  created_at: string
  drivers?: { id: string; name: string; phone: string } | null
  // WooDelivery tracking data
  woo_task_id?: string | null
  driver_location?: { lat: number; lng: number } | null
  eta_minutes?: number | null
}

interface Driver {
  id: string
  name: string
  phone: string
  status: string
  // Real-time location from WooDelivery
  current_lat?: number
  current_lng?: number
  last_location_update?: string
}

interface TripMapProps {
  initialTrips: Trip[]
  drivers: Driver[]
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

// Default to NYC area
const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
}

// Sendy-themed map styles
const sendyMapStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f0" }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }]
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a4a4a" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c5d4c0" }]
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b6b6b" }]
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#d8e6d3" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#c5d4c0" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5a5a5a" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#bdd5b5" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c5d4c0" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f5efe6" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d96727", lightness: 40 }]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e8d5b7" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d96727" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#a8c5d8" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5a8aa8" }]
  }
]

const statusColors: Record<string, string> = {
  pending: "#f59e0b",      // amber
  confirmed: "#3b82f6",    // blue
  assigned: "#8b5cf6",     // purple
  picked_up: "#10b981",    // green
  in_transit: "#d96727",   // sendy orange
  delivered: "#22c55e",    // green
  cancelled: "#ef4444",    // red
  failed: "#dc2626",       // red
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
}

export function TripMap({ initialTrips, drivers: initialDrivers }: TripMapProps) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<{ trip: Trip; type: "pickup" | "delivery" | "driver" } | null>(null)
  const [showList, setShowList] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [driverFilter, setDriverFilter] = useState<string>("all")
  const [showPickups, setShowPickups] = useState(true)
  const [showDeliveries, setShowDeliveries] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showTraffic, setShowTraffic] = useState(true)
  const [showDrivers, setShowDrivers] = useState(true)
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [mapsApiKey, setMapsApiKey] = useState<string>("")
  const [routeDetails, setRouteDetails] = useState<{
    routes: Array<{
      summary: string
      distance: { miles: number; text: string }
      duration: { minutes: number; text: string }
      trafficDelay: number
      hasTolls: boolean
      estimatedTolls: number
      gasCost: number
      totalTripCost: number
      polyline: string
    }>
    bestRoute: any
  } | null>(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [decodedPath, setDecodedPath] = useState<Array<{ lat: number; lng: number }>>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  
  // Fetch API key from server
  useEffect(() => {
    fetch("/api/maps/config")
      .then(res => res.json())
      .then(data => setMapsApiKey(data.apiKey || ""))
      .catch(() => setMapsApiKey(""))
  }, [])
  
  // Decode Google polyline
  const decodePolyline = (encoded: string): Array<{ lat: number; lng: number }> => {
    const points: Array<{ lat: number; lng: number }> = []
    let index = 0
    let lat = 0
    let lng = 0
    
    while (index < encoded.length) {
      let b: number
      let shift = 0
      let result = 0
      
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lat += dlat
      
      shift = 0
      result = 0
      
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lng += dlng
      
      points.push({ lat: lat / 1e5, lng: lng / 1e5 })
    }
    
    return points
  }
  
  // Fetch route details when a trip is selected
  useEffect(() => {
    if (!selectedTrip || !selectedTrip.pickup_address || !selectedTrip.delivery_address) {
      setRouteDetails(null)
      setDecodedPath([])
      return
    }
    
    const fetchRoute = async () => {
      setLoadingRoute(true)
      try {
        const res = await fetch(
          `/api/maps/route?origin=${encodeURIComponent(selectedTrip.pickup_address)}&destination=${encodeURIComponent(selectedTrip.delivery_address)}`
        )
        const data = await res.json()
        
        if (data.routes?.length > 0) {
          setRouteDetails(data)
          // Decode the best route polyline
          if (data.bestRoute?.polyline) {
            const path = decodePolyline(data.bestRoute.polyline)
            setDecodedPath(path)
          }
        }
      } catch (err) {
        console.error("Failed to fetch route:", err)
      } finally {
        setLoadingRoute(false)
      }
    }
    
    fetchRoute()
  }, [selectedTrip])
  
  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (statusFilter !== "all" && trip.status !== statusFilter) return false
      if (driverFilter !== "all") {
        if (driverFilter === "unassigned" && trip.driver_id) return false
        if (driverFilter !== "unassigned" && trip.driver_id !== driverFilter) return false
      }
      return true
    })
  }, [trips, statusFilter, driverFilter])
  
  // Get trips with valid coordinates
  const tripsWithCoords = useMemo(() => {
    return filteredTrips.filter(trip => 
      (trip.pickup_lat && trip.pickup_lng) || (trip.delivery_lat && trip.delivery_lng)
    )
  }, [filteredTrips])
  
  // Get active drivers with locations
  const activeDriversWithLocation = useMemo(() => {
    return drivers.filter(d => d.current_lat && d.current_lng && d.status !== 'inactive')
  }, [drivers])
  
  // Calculate map bounds to fit all markers
  const bounds = useMemo(() => {
    if (typeof window === "undefined" || !window.google || (tripsWithCoords.length === 0 && activeDriversWithLocation.length === 0)) return null
    
    const bounds = new window.google.maps.LatLngBounds()
    tripsWithCoords.forEach(trip => {
      if (showPickups && trip.pickup_lat && trip.pickup_lng) {
        bounds.extend({ lat: trip.pickup_lat, lng: trip.pickup_lng })
      }
      if (showDeliveries && trip.delivery_lat && trip.delivery_lng) {
        bounds.extend({ lat: trip.delivery_lat, lng: trip.delivery_lng })
      }
    })
    if (showDrivers) {
      activeDriversWithLocation.forEach(driver => {
        if (driver.current_lat && driver.current_lng) {
          bounds.extend({ lat: driver.current_lat, lng: driver.current_lng })
        }
      })
    }
    return bounds
  }, [tripsWithCoords, activeDriversWithLocation, showPickups, showDeliveries, showDrivers])
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map
    if (bounds) {
      map.fitBounds(bounds, { padding: 50 })
    }
  }, [bounds])
  
  // Fit bounds when filter changes
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: 50 })
    }
  }, [bounds])
  
  // Real-time polling for trip updates and driver locations
  useEffect(() => {
    if (!isLive) return
    
    const pollInterval = setInterval(async () => {
      await refreshData()
    }, 15000) // Poll every 15 seconds
    
    return () => clearInterval(pollInterval)
  }, [isLive])
  
  const refreshData = async () => {
    try {
      // Fetch trips
      const tripsResponse = await fetch("/api/admin/trips")
      const tripsData = await tripsResponse.json()
      if (tripsData.trips) {
        const activeTrips = tripsData.trips.filter((t: Trip) => 
          ["pending", "confirmed", "assigned", "picked_up", "in_transit"].includes(t.status)
        )
        setTrips(activeTrips)
      }
      
      // Fetch driver locations from WooDelivery
      const driversResponse = await fetch("/api/admin/drivers/locations")
      const driversData = await driversResponse.json()
      if (driversData.drivers) {
        setDrivers(driversData.drivers)
      }
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }
  
  const focusTrip = (trip: Trip) => {
    setSelectedTrip(trip)
    if (mapRef.current && window.google) {
      const bounds = new window.google.maps.LatLngBounds()
      if (trip.pickup_lat && trip.pickup_lng) {
        bounds.extend({ lat: trip.pickup_lat, lng: trip.pickup_lng })
      }
      if (trip.delivery_lat && trip.delivery_lng) {
        bounds.extend({ lat: trip.delivery_lat, lng: trip.delivery_lng })
      }
      // Include driver location if assigned
      if (trip.driver_id) {
        const driver = drivers.find(d => d.id === trip.driver_id)
        if (driver?.current_lat && driver?.current_lng) {
          bounds.extend({ lat: driver.current_lat, lng: driver.current_lng })
        }
      }
      mapRef.current.fitBounds(bounds, { padding: 100 })
    }
  }
  
  // Create custom marker icons
  const createMarkerIcon = (color: string, type: "pickup" | "delivery" | "driver") => {
    if (typeof window === "undefined" || !window.google) return undefined
    
    let svg: string
    if (type === "pickup") {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><circle cx="12" cy="12" r="10" fill="${color}" stroke="white" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="white"/></svg>`
    } else if (type === "delivery") {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" strokeWidth="1.5"/><circle cx="12" cy="9" r="3" fill="white"/></svg>`
    } else {
      // Driver icon - truck/car
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" strokeWidth="2"/>
        <path d="M12 16h10l4 4v4h-2a2 2 0 01-4 0h-4a2 2 0 01-4 0h-2v-6l2-2z" fill="white"/>
        <circle cx="14" cy="24" r="1.5" fill="${color}"/>
        <circle cx="22" cy="24" r="1.5" fill="${color}"/>
      </svg>`
    }
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(type === "driver" ? 40 : 36, type === "driver" ? 40 : 36),
      anchor: new window.google.maps.Point(type === "driver" ? 20 : 18, type === "delivery" ? 36 : type === "driver" ? 20 : 18),
    }
  }
  
  // Format ETA display
  const formatEta = (minutes: number | null | undefined) => {
    if (!minutes) return null
    if (minutes < 1) return "< 1 min"
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }
  
  // Calculate time since last update
  const getTimeSinceUpdate = (updateTime: string | undefined) => {
    if (!updateTime) return "Unknown"
    const diff = Date.now() - new Date(updateTime).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }
  
  // Show loading state while fetching API key
  if (!mapsApiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-secondary/30">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading map configuration...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r flex flex-col transition-all duration-300 shadow-lg",
        showList ? "w-96" : "w-0 overflow-hidden"
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Live Tracking</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {isLive ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isLive}
                  onCheckedChange={setIsLive}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Driver</Label>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Layer toggles */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id="show-pickups" 
                checked={showPickups} 
                onCheckedChange={(c) => setShowPickups(!!c)} 
              />
              <Label htmlFor="show-pickups" className="text-xs flex items-center gap-1 cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Pickups
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id="show-deliveries" 
                checked={showDeliveries} 
                onCheckedChange={(c) => setShowDeliveries(!!c)} 
              />
              <Label htmlFor="show-deliveries" className="text-xs flex items-center gap-1 cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                Deliveries
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id="show-drivers" 
                checked={showDrivers} 
                onCheckedChange={(c) => setShowDrivers(!!c)} 
              />
              <Label htmlFor="show-drivers" className="text-xs flex items-center gap-1 cursor-pointer">
                <Car className="h-3 w-3 text-blue-500" />
                Drivers
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id="show-traffic" 
                checked={showTraffic} 
                onCheckedChange={(c) => setShowTraffic(!!c)} 
              />
              <Label htmlFor="show-traffic" className="text-xs cursor-pointer">Traffic</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox 
                id="show-routes" 
                checked={showRoutes} 
                onCheckedChange={(c) => setShowRoutes(!!c)} 
              />
              <Label htmlFor="show-routes" className="text-xs cursor-pointer">Routes</Label>
            </div>
          </div>
        </div>
        
        {/* Active Drivers Section */}
        {showDrivers && activeDriversWithLocation.length > 0 && (
          <div className="p-3 border-b bg-blue-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Drivers ({activeDriversWithLocation.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeDriversWithLocation.map(driver => (
                <Badge 
                  key={driver.id} 
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {driver.name}
                  <span className="text-muted-foreground">
                    ({getTimeSinceUpdate(driver.last_location_update)})
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Trip List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {filteredTrips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active trips</p>
            ) : (
              filteredTrips.map(trip => {
                const assignedDriver = trip.driver_id ? drivers.find(d => d.id === trip.driver_id) : null
                return (
                  <Card 
                    key={trip.id}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-accent hover:shadow-md",
                      selectedTrip?.id === trip.id && "ring-2 ring-primary shadow-md"
                    )}
                    onClick={() => focusTrip(trip)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {trip.customer_name || trip.customer_phone}
                            </span>
                            <Badge 
                              style={{ backgroundColor: statusColors[trip.status] }}
                              className="text-white text-xs"
                            >
                              {statusLabels[trip.status]}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-500" />
                              <span className="truncate text-xs">{trip.pickup_address}</span>
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Navigation className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                              <span className="truncate text-xs">{trip.delivery_address}</span>
                            </div>
                          </div>
                          
                          {/* Driver & ETA info */}
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            {assignedDriver ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Truck className="h-3 w-3" />
                                <span>{assignedDriver.name}</span>
                                {assignedDriver.current_lat && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Unassigned</span>
                              </div>
                            )}
                            
                            {trip.eta_minutes && (
                              <div className="flex items-center gap-1 text-primary font-medium">
                                <Timer className="h-3 w-3" />
                                <span>ETA: {formatEta(trip.eta_minutes)}</span>
                              </div>
                            )}
                            
                            {trip.total_price && (
                              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                                <DollarSign className="h-3 w-3" />
                                <span>${trip.total_price.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
        
        {/* Route Details Panel - Shows when trip is selected */}
        {selectedTrip && (
          <div className="border-t bg-card">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Route Details</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setSelectedTrip(null)}
              >
                <span className="sr-only">Close</span>
                <span className="text-muted-foreground">&times;</span>
              </Button>
            </div>
            
            {loadingRoute ? (
              <div className="p-4 flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <span className="ml-2 text-sm text-muted-foreground">Loading route...</span>
              </div>
            ) : routeDetails?.bestRoute ? (
              <div className="p-3 space-y-3">
                {/* Route summary */}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{routeDetails.bestRoute.summary}</Badge>
                  {routeDetails.bestRoute.trafficDelay > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      +{routeDetails.bestRoute.trafficDelay} min traffic
                    </Badge>
                  )}
                </div>
                
                {/* Route metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" />
                      Distance
                    </div>
                    <p className="font-semibold">{routeDetails.bestRoute.distance.text}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      Duration
                    </div>
                    <p className="font-semibold">{routeDetails.bestRoute.duration.text}</p>
                  </div>
                </div>
                
                {/* Cost breakdown */}
                <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-primary">Trip Cost Estimates</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">${routeDetails.bestRoute.gasCost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Gas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {routeDetails.bestRoute.hasTolls ? `$${routeDetails.bestRoute.estimatedTolls.toFixed(2)}` : '$0'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tolls{routeDetails.bestRoute.hasTolls ? '' : ' (none)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">${routeDetails.bestRoute.totalTripCost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                
                {/* Alternative routes */}
                {routeDetails.routes.length > 1 && (
                  <div className="text-xs text-muted-foreground">
                    {routeDetails.routes.length - 1} alternative route{routeDetails.routes.length > 2 ? 's' : ''} available
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                Could not load route details
              </div>
            )}
          </div>
        )}
        
        {/* Stats Footer */}
        <div className="p-3 border-t bg-muted/30 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{filteredTrips.filter(t => t.status === 'in_transit').length}</p>
            <p className="text-xs text-muted-foreground">In Transit</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-500">{filteredTrips.filter(t => t.status === 'pending').length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-500">{activeDriversWithLocation.length}</p>
            <p className="text-xs text-muted-foreground">Active Drivers</p>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Toggle sidebar button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-10 shadow-lg"
          onClick={() => setShowList(!showList)}
        >
          {showList ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </Button>
        
        {/* Map legend */}
        <div className="absolute top-4 right-4 z-10 bg-card/95 backdrop-blur rounded-lg shadow-lg p-3">
          <p className="text-xs font-medium mb-2">Legend</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span>Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Driver</span>
            </div>
            {showTraffic && (
              <div className="flex items-center gap-2 pt-1 border-t">
                <div className="flex gap-0.5">
                  <span className="w-2 h-2 bg-green-400" />
                  <span className="w-2 h-2 bg-yellow-400" />
                  <span className="w-2 h-2 bg-red-400" />
                </div>
                <span>Traffic</span>
              </div>
            )}
          </div>
        </div>
        
        <LoadScript 
          googleMapsApiKey={mapsApiKey}
          libraries={["places"]}
          loadingElement={
            <div className="flex items-center justify-center h-full bg-secondary/30">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-muted-foreground">Loading Google Maps...</p>
              </div>
            </div>
          }
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onMapLoad}
            options={{
              styles: sendyMapStyles,
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
          {/* Traffic Layer */}
          {showTraffic && <TrafficLayer />}
          
          {/* Pickup Markers */}
          {showPickups && tripsWithCoords.map(trip => {
            if (!trip.pickup_lat || !trip.pickup_lng) return null
            return (
              <Marker
                key={`pickup-${trip.id}`}
                position={{ lat: trip.pickup_lat, lng: trip.pickup_lng }}
                icon={createMarkerIcon(statusColors[trip.status] || "#10b981", "pickup")}
                onClick={() => setSelectedMarker({ trip, type: "pickup" })}
              />
            )
          })}
          
          {/* Delivery Markers */}
          {showDeliveries && tripsWithCoords.map(trip => {
            if (!trip.delivery_lat || !trip.delivery_lng) return null
            return (
              <Marker
                key={`delivery-${trip.id}`}
                position={{ lat: trip.delivery_lat, lng: trip.delivery_lng }}
                icon={createMarkerIcon(statusColors[trip.status] || "#d96727", "delivery")}
                onClick={() => setSelectedMarker({ trip, type: "delivery" })}
              />
            )
          })}
          
          {/* Driver Markers */}
          {showDrivers && activeDriversWithLocation.map(driver => {
            if (!driver.current_lat || !driver.current_lng) return null
            return (
              <Marker
                key={`driver-${driver.id}`}
                position={{ lat: driver.current_lat, lng: driver.current_lng }}
                icon={createMarkerIcon("#3b82f6", "driver")}
                onClick={() => {
                  // Find trip assigned to this driver
                  const assignedTrip = trips.find(t => t.driver_id === driver.id)
                  if (assignedTrip) {
                    setSelectedMarker({ trip: assignedTrip, type: "driver" })
                  }
                }}
              />
            )
          })}
          
          {/* Route lines for all trips (simple straight lines) */}
          {showRoutes && tripsWithCoords.map(trip => {
            // Skip the selected trip - we'll draw its detailed route separately
            if (selectedTrip?.id === trip.id) return null
            if (!trip.pickup_lat || !trip.pickup_lng || !trip.delivery_lat || !trip.delivery_lng) return null
            
            const pathCoords = [
              { lat: trip.pickup_lat, lng: trip.pickup_lng },
              { lat: trip.delivery_lat, lng: trip.delivery_lng }
            ]
            
            // If driver is assigned and has location, show driver to next stop
            const assignedDriver = trip.driver_id ? drivers.find(d => d.id === trip.driver_id) : null
            if (assignedDriver?.current_lat && assignedDriver?.current_lng) {
              const nextStop = trip.status === 'assigned' || trip.status === 'confirmed'
                ? { lat: trip.pickup_lat, lng: trip.pickup_lng }
                : { lat: trip.delivery_lat, lng: trip.delivery_lng }
              
              return (
                <div key={`route-${trip.id}`}>
                  {/* Driver to next stop (dashed) */}
                  <Polyline
                    path={[
                      { lat: assignedDriver.current_lat, lng: assignedDriver.current_lng },
                      nextStop
                    ]}
                    options={{
                      strokeColor: "#3b82f6",
                      strokeOpacity: 0.8,
                      strokeWeight: 3,
                      icons: [{
                        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                        offset: '0',
                        repeat: '15px'
                      }],
                    }}
                  />
                  {/* Pickup to delivery (solid) */}
                  <Polyline
                    path={pathCoords}
                    options={{
                      strokeColor: statusColors[trip.status] || "#d96727",
                      strokeOpacity: 0.4,
                      strokeWeight: 2,
                    }}
                  />
                </div>
              )
            }
            
            return (
              <Polyline
                key={`route-${trip.id}`}
                path={pathCoords}
                options={{
                  strokeColor: statusColors[trip.status] || "#d96727",
                  strokeOpacity: 0.4,
                  strokeWeight: 2,
                }}
              />
            )
          })}
          
          {/* Selected trip's detailed route from Google Directions */}
          {selectedTrip && decodedPath.length > 0 && (
            <Polyline
              path={decodedPath}
              options={{
                strokeColor: "#d96727",
                strokeOpacity: 1,
                strokeWeight: 5,
                zIndex: 100,
              }}
            />
          )}
          
          {/* Simple fallback line for selected trip if no route loaded yet */}
          {selectedTrip && decodedPath.length === 0 && selectedTrip.pickup_lat && selectedTrip.delivery_lat && (
            <Polyline
              path={[
                { lat: selectedTrip.pickup_lat, lng: selectedTrip.pickup_lng! },
                { lat: selectedTrip.delivery_lat, lng: selectedTrip.delivery_lng! }
              ]}
              options={{
                strokeColor: "#d96727",
                strokeOpacity: 0.8,
                strokeWeight: 4,
                zIndex: 100,
              }}
            />
          )}
          
          {/* Info Window */}
          {selectedMarker && (
            <InfoWindow
              position={
                selectedMarker.type === "pickup" 
                  ? { lat: selectedMarker.trip.pickup_lat!, lng: selectedMarker.trip.pickup_lng! }
                  : selectedMarker.type === "delivery"
                  ? { lat: selectedMarker.trip.delivery_lat!, lng: selectedMarker.trip.delivery_lng! }
                  : (() => {
                      const driver = drivers.find(d => d.id === selectedMarker.trip.driver_id)
                      return { lat: driver?.current_lat || 0, lng: driver?.current_lng || 0 }
                    })()
              }
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    style={{ backgroundColor: statusColors[selectedMarker.trip.status] }}
                    className="text-white text-xs"
                  >
                    {statusLabels[selectedMarker.trip.status]}
                  </Badge>
                  <span className="text-xs text-gray-500 capitalize">{selectedMarker.type}</span>
                </div>
                
                <p className="font-medium text-sm mb-1">
                  {selectedMarker.trip.customer_name || selectedMarker.trip.customer_phone}
                </p>
                
                <p className="text-xs text-gray-600 mb-2">
                  {selectedMarker.type === "pickup" 
                    ? selectedMarker.trip.pickup_address 
                    : selectedMarker.type === "delivery"
                    ? selectedMarker.trip.delivery_address
                    : `Driver: ${drivers.find(d => d.id === selectedMarker.trip.driver_id)?.name}`
                  }
                </p>
                
                {selectedMarker.trip.eta_minutes && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mb-2">
                    <Timer className="h-3 w-3" />
                    <span>ETA: {formatEta(selectedMarker.trip.eta_minutes)}</span>
                  </div>
                )}
                
                {selectedMarker.trip.drivers && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <Truck className="h-3 w-3" />
                    <span>{selectedMarker.trip.drivers.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <a 
                    href={`tel:${selectedMarker.trip.customer_phone}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    Call
                  </a>
                  {selectedMarker.trip.total_price && (
                    <span className="text-xs text-gray-500 ml-auto">
                      ${selectedMarker.trip.total_price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  )
}
