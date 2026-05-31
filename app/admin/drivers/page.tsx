"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Truck, Phone, Mail, Car } from "lucide-react"

interface Driver {
  id: string
  woo_id: string
  name: string
  email?: string
  phone?: string
  vehicle_type?: string
  license_plate?: string
  status: string
  team_name?: string
  total_deliveries: number
  rating?: number
  synced_at: string
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("woo_drivers")
      .select("*")
      .order("name", { ascending: true })

    if (!error && data) {
      setDrivers(data)
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Drivers</h1>
        <p className="text-muted-foreground">
          View drivers and team members synced from WooDelivery
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {drivers.filter((d) => d.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Truck className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {drivers.filter((d) => d.status === "offline").length}
                </p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Driver List
          </CardTitle>
          <CardDescription>
            All drivers synced from your WooDelivery account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading drivers...</div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No drivers synced yet. Run a sync from the WooDelivery settings page.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <p className="font-medium">{driver.name}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {driver.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {driver.email}
                          </div>
                        )}
                        {driver.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {driver.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.vehicle_type || driver.license_plate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Car className="h-3 w-3" />
                          {[driver.vehicle_type, driver.license_plate]
                            .filter(Boolean)
                            .join(" - ")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.team_name || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={driver.status === "active" ? "default" : "secondary"}
                        className={driver.status === "active" ? "bg-green-500" : ""}
                      >
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{driver.total_deliveries || 0}</TableCell>
                    <TableCell>
                      {driver.rating ? `${driver.rating.toFixed(1)}/5` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
