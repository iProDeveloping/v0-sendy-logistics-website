"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, Plus, Pencil, Trash2, Save, Loader2, MapPin, Clock } from "lucide-react"

interface PackageEvent {
  id: string
  status: string
  location: string | null
  description: string | null
  event_time: string
}

interface PackageData {
  id: string
  tracking_number: string
  sender_name: string | null
  recipient_name: string
  recipient_address: string
  status: string
  estimated_delivery: string | null
  notes: string | null
  created_at: string
  package_events: PackageEvent[]
}

const statuses = [
  { value: "pending", label: "Pending Pickup", color: "bg-yellow-100 text-yellow-800" },
  { value: "picked_up", label: "Picked Up", color: "bg-blue-100 text-blue-800" },
  { value: "in_transit", label: "In Transit", color: "bg-primary/20 text-primary" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-green-100 text-green-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-600 text-white" },
  { value: "returned", label: "Returned", color: "bg-red-100 text-red-800" },
]

function generateTrackingNumber() {
  const prefix = "SNDY"
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `${prefix}${random}`
}

export function PackagesList({ initialPackages }: { initialPackages: PackageData[] }) {
  const [packages, setPackages] = useState(initialPackages)
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    tracking_number: "",
    sender_name: "",
    recipient_name: "",
    recipient_address: "",
    status: "pending",
    estimated_delivery: "",
    notes: "",
  })
  const [newEvent, setNewEvent] = useState({
    status: "",
    location: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const openEditor = (pkg?: PackageData) => {
    if (pkg) {
      setEditingPackage(pkg)
      setIsNew(false)
      setForm({
        tracking_number: pkg.tracking_number,
        sender_name: pkg.sender_name || "",
        recipient_name: pkg.recipient_name,
        recipient_address: pkg.recipient_address,
        status: pkg.status,
        estimated_delivery: pkg.estimated_delivery ? pkg.estimated_delivery.split("T")[0] : "",
        notes: pkg.notes || "",
      })
    } else {
      setEditingPackage(null)
      setIsNew(true)
      setForm({
        tracking_number: generateTrackingNumber(),
        sender_name: "",
        recipient_name: "",
        recipient_address: "",
        status: "pending",
        estimated_delivery: "",
        notes: "",
      })
    }
    setNewEvent({ status: "", location: "", description: "" })
  }

  const savePackage = async () => {
    setSaving(true)
    const supabase = createClient()

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("packages")
          .insert({
            tracking_number: form.tracking_number,
            sender_name: form.sender_name || null,
            recipient_name: form.recipient_name,
            recipient_address: form.recipient_address,
            status: form.status,
            estimated_delivery: form.estimated_delivery || null,
            notes: form.notes || null,
          })
          .select()
          .single()

        if (error) throw error

        // Add initial event
        await supabase.from("package_events").insert({
          package_id: data.id,
          status: form.status,
          description: "Package created",
        })

        setPackages([{ ...data, package_events: [] }, ...packages])
      } else if (editingPackage) {
        const { error } = await supabase
          .from("packages")
          .update({
            sender_name: form.sender_name || null,
            recipient_name: form.recipient_name,
            recipient_address: form.recipient_address,
            status: form.status,
            estimated_delivery: form.estimated_delivery || null,
            notes: form.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPackage.id)

        if (error) throw error

        // Add status change event if status changed
        if (form.status !== editingPackage.status) {
          await supabase.from("package_events").insert({
            package_id: editingPackage.id,
            status: form.status,
            description: `Status updated to ${statuses.find(s => s.value === form.status)?.label}`,
          })
        }

        setPackages(packages.map(p => p.id === editingPackage.id ? { ...p, ...form, sender_name: form.sender_name || null, estimated_delivery: form.estimated_delivery || null, notes: form.notes || null } : p))
      }

      setEditingPackage(null)
      setIsNew(false)
      router.refresh()
    } catch (error) {
      alert("Failed to save package")
    } finally {
      setSaving(false)
    }
  }

  const addEvent = async () => {
    if (!editingPackage || !newEvent.status) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from("package_events")
      .insert({
        package_id: editingPackage.id,
        status: newEvent.status,
        location: newEvent.location || null,
        description: newEvent.description || null,
      })
      .select()
      .single()

    if (!error && data) {
      // Update package status
      await supabase
        .from("packages")
        .update({ status: newEvent.status, updated_at: new Date().toISOString() })
        .eq("id", editingPackage.id)

      setEditingPackage({
        ...editingPackage,
        status: newEvent.status,
        package_events: [data, ...editingPackage.package_events],
      })
      setForm({ ...form, status: newEvent.status })
      setNewEvent({ status: "", location: "", description: "" })
    }
  }

  const deletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return

    const supabase = createClient()
    const { error } = await supabase.from("packages").delete().eq("id", id)

    if (!error) {
      setPackages(packages.filter(p => p.id !== id))
    }
  }

  const getStatusBadge = (status: string) => {
    const s = statuses.find(st => st.value === status)
    return <Badge className={s?.color}>{s?.label || status}</Badge>
  }

  return (
    <>
      <div className="mb-6">
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {packages.length > 0 ? (
            <div className="divide-y divide-border">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="font-mono font-semibold text-foreground">{pkg.tracking_number}</p>
                        {getStatusBadge(pkg.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">To: {pkg.recipient_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{pkg.recipient_address}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditor(pkg)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePackage(pkg.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No packages yet</p>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Modal */}
      <Dialog open={editingPackage !== null || isNew} onOpenChange={() => { setEditingPackage(null); setIsNew(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create Package" : `Package: ${form.tracking_number}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input value={form.tracking_number} disabled className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input
                  value={form.sender_name}
                  onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Recipient Name *</Label>
                <Input
                  value={form.recipient_name}
                  onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recipient Address *</Label>
              <Input
                value={form.recipient_address}
                onChange={(e) => setForm({ ...form, recipient_address: e.target.value })}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Delivery</Label>
                <Input
                  type="date"
                  value={form.estimated_delivery}
                  onChange={(e) => setForm({ ...form, estimated_delivery: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>

            {/* Add Event (only for existing packages) */}
            {!isNew && editingPackage && (
              <div className="border-t border-border pt-6">
                <h4 className="font-semibold text-foreground mb-4">Add Tracking Event</h4>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <Select value={newEvent.status} onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={addEvent} disabled={!newEvent.status}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>

                {/* Event History */}
                {editingPackage.package_events.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-foreground mb-4">Tracking History</h4>
                    <div className="space-y-3">
                      {editingPackage.package_events.map((event) => (
                        <div key={event.id} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{statuses.find(s => s.value === event.status)?.label}</p>
                            {event.description && <p className="text-muted-foreground">{event.description}</p>}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.event_time).toLocaleString()}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={savePackage} disabled={saving || !form.recipient_name || !form.recipient_address}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isNew ? "Create Package" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
