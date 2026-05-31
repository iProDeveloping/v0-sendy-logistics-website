"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Plus,
  MoreHorizontal,
  MapPin,
  Phone,
  User,
  Truck,
  Clock,
  DollarSign,
  Package,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Navigation,
  Calendar,
  Building2,
  FileText,
} from "lucide-react"

interface Trip {
  id: string
  customer_id: string | null
  customer_name: string | null
  customer_phone: string
  customer_email: string | null
  pickup_address: string
  pickup_notes: string | null
  delivery_address: string
  delivery_notes: string | null
  package_type_id: string | null
  package_description: string | null
  special_instructions: string | null
  scheduled_pickup_at: string | null
  distance_miles: number | null
  total_price: number | null
  status: string
  driver_id: string | null
  source: string
  notes: string | null
  created_at: string
  sms_customers?: { id: string; name: string; phone_number: string; company: string | null } | null
  drivers?: { id: string; name: string; phone: string } | null
  package_types?: { id: string; name: string } | null
}

interface Driver {
  id: string
  name: string
  phone: string
  status: string
}

interface Customer {
  id: string
  name: string
  phone_number: string
  company: string | null
}

interface PackageType {
  id: string
  name: string
  description: string | null
  base_multiplier: number
  per_mile_multiplier: number
  min_price: number
}

interface TripsDashboardProps {
  initialTrips: Trip[]
  drivers: Driver[]
  customers: Customer[]
  packageTypes: PackageType[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  confirmed: { label: "Confirmed", color: "bg-blue-500" },
  assigned: { label: "Assigned", color: "bg-purple-500" },
  picked_up: { label: "Picked Up", color: "bg-indigo-500" },
  in_transit: { label: "In Transit", color: "bg-cyan-500" },
  delivered: { label: "Delivered", color: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-500" },
  failed: { label: "Failed", color: "bg-red-500" },
}

export function TripsDashboard({ initialTrips, drivers, customers, packageTypes }: TripsDashboardProps) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // New trip form state
  const [newTrip, setNewTrip] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    pickup_address: "",
    pickup_notes: "",
    delivery_address: "",
    delivery_notes: "",
    package_type_id: "",
    package_description: "",
    special_instructions: "",
    scheduled_pickup_at: "",
    notes: "",
  })

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.customer_phone.includes(searchQuery) ||
      trip.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.sms_customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.sms_customers?.company?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Group trips by status for tabs
  const tripsByStatus = {
    all: filteredTrips,
    active: filteredTrips.filter(t => ['pending', 'confirmed', 'assigned', 'picked_up', 'in_transit'].includes(t.status)),
    completed: filteredTrips.filter(t => t.status === 'delivered'),
    cancelled: filteredTrips.filter(t => ['cancelled', 'failed'].includes(t.status)),
  }

  // Create new trip
  const handleCreateTrip = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrip),
      })
      
      if (response.ok) {
        const { trip } = await response.json()
        setTrips([trip, ...trips])
        setIsNewOpen(false)
        setNewTrip({
          customer_id: "",
          customer_name: "",
          customer_phone: "",
          pickup_address: "",
          pickup_notes: "",
          delivery_address: "",
          delivery_notes: "",
          package_type_id: "",
          package_description: "",
          special_instructions: "",
          scheduled_pickup_at: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error creating trip:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update trip status
  const updateTripStatus = async (tripId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        setTrips(trips.map(t => t.id === tripId ? { ...t, status: newStatus } : t))
      }
    } catch (error) {
      console.error("Error updating trip:", error)
    }
  }

  // Assign driver
  const assignDriver = async (tripId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          driver_id: driverId,
          status: "assigned",
          assigned_at: new Date().toISOString()
        }),
      })
      
      if (response.ok) {
        const driver = drivers.find(d => d.id === driverId)
        setTrips(trips.map(t => t.id === tripId ? { 
          ...t, 
          driver_id: driverId, 
          status: "assigned",
          drivers: driver ? { id: driver.id, name: driver.name, phone: driver.phone } : null
        } : t))
      }
    } catch (error) {
      console.error("Error assigning driver:", error)
    }
  }

  // Delete trip
  const deleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return
    
    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setTrips(trips.filter(t => t.id !== tripId))
      }
    } catch (error) {
      console.error("Error deleting trip:", error)
    }
  }

  // Customer selection handler
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setNewTrip({
        ...newTrip,
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone_number,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trips</h1>
          <p className="text-muted-foreground">Manage all delivery trips</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Customer Selection */}
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select onValueChange={handleCustomerSelect} value={newTrip.customer_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing customer or enter manually" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Enter Manually</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} - {c.phone_number} {c.company && `(${c.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Customer Info */}
              {(!newTrip.customer_id || newTrip.customer_id === "manual") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={newTrip.customer_name}
                      onChange={(e) => setNewTrip({ ...newTrip, customer_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone *</Label>
                    <Input
                      value={newTrip.customer_phone}
                      onChange={(e) => setNewTrip({ ...newTrip, customer_phone: e.target.value })}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Pickup Address */}
              <div className="grid gap-2">
                <Label>Pickup Address *</Label>
                <Input
                  value={newTrip.pickup_address}
                  onChange={(e) => setNewTrip({ ...newTrip, pickup_address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Pickup Notes</Label>
                <Input
                  value={newTrip.pickup_notes}
                  onChange={(e) => setNewTrip({ ...newTrip, pickup_notes: e.target.value })}
                  placeholder="Apt #, gate code, etc."
                />
              </div>

              {/* Delivery Address */}
              <div className="grid gap-2">
                <Label>Delivery Address *</Label>
                <Input
                  value={newTrip.delivery_address}
                  onChange={(e) => setNewTrip({ ...newTrip, delivery_address: e.target.value })}
                  placeholder="456 Oak Ave, City, State ZIP"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Delivery Notes</Label>
                <Input
                  value={newTrip.delivery_notes}
                  onChange={(e) => setNewTrip({ ...newTrip, delivery_notes: e.target.value })}
                  placeholder="Leave at door, etc."
                />
              </div>

              {/* Package Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Package Type</Label>
                  <Select 
                    onValueChange={(v) => setNewTrip({ ...newTrip, package_type_id: v })} 
                    value={newTrip.package_type_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {packageTypes.map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Scheduled Pickup</Label>
                  <Input
                    type="datetime-local"
                    value={newTrip.scheduled_pickup_at}
                    onChange={(e) => setNewTrip({ ...newTrip, scheduled_pickup_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Package Description</Label>
                <Input
                  value={newTrip.package_description}
                  onChange={(e) => setNewTrip({ ...newTrip, package_description: e.target.value })}
                  placeholder="Documents, small box, etc."
                />
              </div>

              <div className="grid gap-2">
                <Label>Special Instructions</Label>
                <Textarea
                  value={newTrip.special_instructions}
                  onChange={(e) => setNewTrip({ ...newTrip, special_instructions: e.target.value })}
                  placeholder="Fragile, time-sensitive, etc."
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label>Internal Notes</Label>
                <Textarea
                  value={newTrip.notes}
                  onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
                  placeholder="Admin notes..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTrip} disabled={isLoading || !newTrip.customer_phone || !newTrip.pickup_address || !newTrip.delivery_address}>
                {isLoading ? "Creating..." : "Create Trip"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trips.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripsByStatus.active.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripsByStatus.completed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${trips.reduce((sum, t) => sum + (t.total_price || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trips Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({tripsByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({tripsByStatus.active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tripsByStatus.completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({tripsByStatus.cancelled.length})</TabsTrigger>
        </TabsList>

        {Object.entries(tripsByStatus).map(([key, tripList]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No trips found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tripList.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {trip.sms_customers?.name || trip.customer_name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {trip.customer_phone}
                              </span>
                              {trip.sms_customers?.company && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {trip.sms_customers.company}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              <span className="text-xs flex items-start gap-1">
                                <MapPin className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                <span className="truncate">{trip.pickup_address}</span>
                              </span>
                              <span className="text-xs flex items-start gap-1">
                                <MapPin className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                                <span className="truncate">{trip.delivery_address}</span>
                              </span>
                              {trip.distance_miles && (
                                <span className="text-xs text-muted-foreground">
                                  {trip.distance_miles} miles
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {trip.package_types?.name && (
                                <Badge variant="outline" className="w-fit text-xs">
                                  {trip.package_types.name}
                                </Badge>
                              )}
                              {trip.package_description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                  {trip.package_description}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig[trip.status]?.color || 'bg-gray-500'} text-white`}>
                              {statusConfig[trip.status]?.label || trip.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trip.drivers ? (
                              <div className="flex flex-col">
                                <span className="text-sm">{trip.drivers.name}</span>
                                <span className="text-xs text-muted-foreground">{trip.drivers.phone}</span>
                              </div>
                            ) : (
                              <Select onValueChange={(v) => assignDriver(trip.id, v)}>
                                <SelectTrigger className="h-8 w-[130px]">
                                  <SelectValue placeholder="Assign" />
                                </SelectTrigger>
                                <SelectContent>
                                  {drivers.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {trip.total_price ? (
                              <span className="font-medium">${trip.total_price.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(trip.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(trip.created_at).toLocaleTimeString()}
                              </span>
                              <Badge variant="outline" className="w-fit text-xs mt-1">
                                {trip.source}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedTrip(trip); setIsViewOpen(true); }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedTrip(trip); setIsEditOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateTripStatus(trip.id, 'confirmed')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                                  Confirm
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTripStatus(trip.id, 'picked_up')}>
                                  <Package className="mr-2 h-4 w-4 text-indigo-500" />
                                  Mark Picked Up
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTripStatus(trip.id, 'in_transit')}>
                                  <Navigation className="mr-2 h-4 w-4 text-cyan-500" />
                                  Mark In Transit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTripStatus(trip.id, 'delivered')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Mark Delivered
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateTripStatus(trip.id, 'cancelled')} className="text-orange-500">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Trip
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteTrip(trip.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* View Trip Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <ScrollArea className="max-h-[70vh]">
              <div className="grid gap-6 py-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge className={`${statusConfig[selectedTrip.status]?.color || 'bg-gray-500'} text-white text-sm px-3 py-1`}>
                    {statusConfig[selectedTrip.status]?.label || selectedTrip.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Source: {selectedTrip.source.toUpperCase()}
                  </span>
                </div>

                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div><strong>Name:</strong> {selectedTrip.sms_customers?.name || selectedTrip.customer_name || "N/A"}</div>
                    <div><strong>Phone:</strong> {selectedTrip.customer_phone}</div>
                    {selectedTrip.customer_email && <div><strong>Email:</strong> {selectedTrip.customer_email}</div>}
                    {selectedTrip.sms_customers?.company && <div><strong>Company:</strong> {selectedTrip.sms_customers.company}</div>}
                  </CardContent>
                </Card>

                {/* Route */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Pickup
                      </div>
                      <p className="ml-4 text-muted-foreground">{selectedTrip.pickup_address}</p>
                      {selectedTrip.pickup_notes && <p className="ml-4 text-xs italic">{selectedTrip.pickup_notes}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Delivery
                      </div>
                      <p className="ml-4 text-muted-foreground">{selectedTrip.delivery_address}</p>
                      {selectedTrip.delivery_notes && <p className="ml-4 text-xs italic">{selectedTrip.delivery_notes}</p>}
                    </div>
                    {selectedTrip.distance_miles && (
                      <div className="text-muted-foreground">
                        Distance: {selectedTrip.distance_miles} miles
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Package & Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Package
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {selectedTrip.package_types?.name && <div><strong>Type:</strong> {selectedTrip.package_types.name}</div>}
                      {selectedTrip.package_description && <div><strong>Description:</strong> {selectedTrip.package_description}</div>}
                      {selectedTrip.special_instructions && <div><strong>Instructions:</strong> {selectedTrip.special_instructions}</div>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {selectedTrip.total_price ? (
                        <div className="text-2xl font-bold">${selectedTrip.total_price.toFixed(2)}</div>
                      ) : (
                        <div className="text-muted-foreground">Not calculated</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Driver */}
                {selectedTrip.drivers && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Assigned Driver
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div><strong>Name:</strong> {selectedTrip.drivers.name}</div>
                      <div><strong>Phone:</strong> {selectedTrip.drivers.phone}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {selectedTrip.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {selectedTrip.notes}
                    </CardContent>
                  </Card>
                )}

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground">
                  <div>Created: {new Date(selectedTrip.created_at).toLocaleString()}</div>
                  {selectedTrip.scheduled_pickup_at && (
                    <div>Scheduled: {new Date(selectedTrip.scheduled_pickup_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
