"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogDescription,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DollarSign,
  Package,
  Users,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react"

interface PricingSetting {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

interface PackageType {
  id: string
  name: string
  description: string | null
  base_multiplier: number
  per_mile_multiplier: number
  min_price: number
  max_weight_lbs: number | null
  max_dimensions: string | null
  is_active: boolean
  sort_order: number
}

interface CustomerPricing {
  id: string
  customer_id: string
  custom_base_price: number | null
  custom_per_mile_rate: number | null
  custom_discount_percentage: number | null
  custom_minimum_charge: number | null
  flat_rate_enabled: boolean
  flat_rate_amount: number | null
  flat_rate_max_miles: number | null
  notes: string | null
  sms_customers?: {
    id: string
    name: string | null
    phone_number: string
    company: string | null
  }
}

interface Customer {
  id: string
  name: string | null
  phone_number: string
  company: string | null
}

interface PricingDashboardProps {
  initialSettings: PricingSetting[]
  initialPackageTypes: PackageType[]
  initialCustomerPricing: CustomerPricing[]
  customers: Customer[]
}

export function PricingDashboard({
  initialSettings,
  initialPackageTypes,
  initialCustomerPricing,
  customers,
}: PricingDashboardProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [packageTypes, setPackageTypes] = useState(initialPackageTypes)
  const [customerPricing, setCustomerPricing] = useState(initialCustomerPricing)
  const [editingSetting, setEditingSetting] = useState<PricingSetting | null>(null)
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
  const [editingCustomerPricing, setEditingCustomerPricing] = useState<CustomerPricing | null>(null)
  const [isAddingPackage, setIsAddingPackage] = useState(false)
  const [isAddingCustomerPricing, setIsAddingCustomerPricing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Save global setting
  const saveSetting = async (setting: PricingSetting) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/pricing/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setting.id, value: setting.value }),
      })
      if (response.ok) {
        setSettings(settings.map(s => s.id === setting.id ? setting : s))
        setEditingSetting(null)
      }
    } catch (error) {
      console.error("Error saving setting:", error)
    }
    setSaving(false)
  }

  // Save package type
  const savePackageType = async (pkg: PackageType) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/pricing/package-types", {
        method: pkg.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkg),
      })
      if (response.ok) {
        const data = await response.json()
        if (pkg.id) {
          setPackageTypes(packageTypes.map(p => p.id === pkg.id ? pkg : p))
        } else {
          setPackageTypes([...packageTypes, data.packageType])
        }
        setEditingPackage(null)
        setIsAddingPackage(false)
      }
    } catch (error) {
      console.error("Error saving package type:", error)
    }
    setSaving(false)
  }

  // Delete package type
  const deletePackageType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package type?")) return
    try {
      const response = await fetch(`/api/admin/pricing/package-types?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setPackageTypes(packageTypes.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error("Error deleting package type:", error)
    }
  }

  // Save customer pricing
  const saveCustomerPricing = async (pricing: CustomerPricing) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/pricing/customer", {
        method: pricing.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      })
      if (response.ok) {
        const data = await response.json()
        if (pricing.id) {
          setCustomerPricing(customerPricing.map(p => p.id === pricing.id ? { ...pricing, sms_customers: p.sms_customers } : p))
        } else {
          // Find customer info for the new entry
          const customer = customers.find(c => c.id === pricing.customer_id)
          setCustomerPricing([...customerPricing, { ...data.customerPricing, sms_customers: customer }])
        }
        setEditingCustomerPricing(null)
        setIsAddingCustomerPricing(false)
      }
    } catch (error) {
      console.error("Error saving customer pricing:", error)
    }
    setSaving(false)
  }

  // Delete customer pricing
  const deleteCustomerPricing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer pricing override?")) return
    try {
      const response = await fetch(`/api/admin/pricing/customer?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setCustomerPricing(customerPricing.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error("Error deleting customer pricing:", error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure global pricing, package types, and customer-specific rates
          </p>
        </div>
      </div>

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global" className="gap-2">
            <Settings className="h-4 w-4" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-2">
            <Package className="h-4 w-4" />
            Package Types
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" />
            Customer Pricing
          </TabsTrigger>
        </TabsList>

        {/* Global Settings Tab */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Global Pricing Settings
              </CardTitle>
              <CardDescription>
                Default pricing values used when no specific rules apply
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex flex-col gap-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium capitalize">
                        {setting.key.replace(/_/g, " ")}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSetting(setting)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold">
                      {setting.key.includes("price") || setting.key.includes("rate") || setting.key.includes("charge")
                        ? `$${setting.value}`
                        : setting.key.includes("percentage")
                        ? `${setting.value}%`
                        : setting.key.includes("miles") || setting.key.includes("minutes")
                        ? setting.value
                        : setting.value}
                    </p>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Setting Dialog */}
          <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Setting</DialogTitle>
                <DialogDescription>
                  Update the value for {editingSetting?.key.replace(/_/g, " ")}
                </DialogDescription>
              </DialogHeader>
              {editingSetting && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="text"
                      value={editingSetting.value}
                      onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingSetting(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => saveSetting(editingSetting)} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Package Types Tab */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package Types
                  </CardTitle>
                  <CardDescription>
                    Define different package types with pricing multipliers
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingPackage(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Base Multiplier</TableHead>
                    <TableHead className="text-right">Per-Mile Multiplier</TableHead>
                    <TableHead className="text-right">Min Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packageTypes.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {pkg.description}
                      </TableCell>
                      <TableCell className="text-right">{pkg.base_multiplier}x</TableCell>
                      <TableCell className="text-right">{pkg.per_mile_multiplier}x</TableCell>
                      <TableCell className="text-right">${pkg.min_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.is_active ? "default" : "secondary"}>
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPackage(pkg)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePackageType(pkg.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add/Edit Package Dialog */}
          <Dialog open={isAddingPackage || !!editingPackage} onOpenChange={() => { setIsAddingPackage(false); setEditingPackage(null) }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPackage ? "Edit" : "Add"} Package Type</DialogTitle>
              </DialogHeader>
              <PackageTypeForm
                packageType={editingPackage || undefined}
                onSave={savePackageType}
                onCancel={() => { setIsAddingPackage(false); setEditingPackage(null) }}
                saving={saving}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Customer Pricing Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer-Specific Pricing
                  </CardTitle>
                  <CardDescription>
                    Override default pricing for specific customers
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingCustomerPricing(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer Pricing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customerPricing.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customer-specific pricing configured yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Base Price</TableHead>
                      <TableHead className="text-right">Per-Mile Rate</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead>Flat Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerPricing.map((pricing) => (
                      <TableRow key={pricing.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pricing.sms_customers?.name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{pricing.sms_customers?.company}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {pricing.custom_base_price ? `$${pricing.custom_base_price}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {pricing.custom_per_mile_rate ? `$${pricing.custom_per_mile_rate}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {pricing.custom_discount_percentage ? `${pricing.custom_discount_percentage}%` : "-"}
                        </TableCell>
                        <TableCell>
                          {pricing.flat_rate_enabled ? (
                            <Badge variant="secondary">
                              ${pricing.flat_rate_amount} / {pricing.flat_rate_max_miles}mi
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCustomerPricing(pricing)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomerPricing(pricing.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Customer Pricing Dialog */}
          <Dialog open={isAddingCustomerPricing || !!editingCustomerPricing} onOpenChange={() => { setIsAddingCustomerPricing(false); setEditingCustomerPricing(null) }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCustomerPricing ? "Edit" : "Add"} Customer Pricing</DialogTitle>
              </DialogHeader>
              <CustomerPricingForm
                customerPricing={editingCustomerPricing || undefined}
                customers={customers}
                existingCustomerIds={customerPricing.map(p => p.customer_id)}
                onSave={saveCustomerPricing}
                onCancel={() => { setIsAddingCustomerPricing(false); setEditingCustomerPricing(null) }}
                saving={saving}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Package Type Form Component
function PackageTypeForm({
  packageType,
  onSave,
  onCancel,
  saving,
}: {
  packageType?: PackageType
  onSave: (pkg: PackageType) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<PackageType>>(
    packageType || {
      name: "",
      description: "",
      base_multiplier: 1.0,
      per_mile_multiplier: 1.0,
      min_price: 0,
      is_active: true,
      sort_order: 0,
    }
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Express Delivery"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of this package type"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Base Multiplier</Label>
          <Input
            type="number"
            step="0.1"
            value={form.base_multiplier || 1}
            onChange={(e) => setForm({ ...form, base_multiplier: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Per-Mile Multiplier</Label>
          <Input
            type="number"
            step="0.1"
            value={form.per_mile_multiplier || 1}
            onChange={(e) => setForm({ ...form, per_mile_multiplier: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minimum Price ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.min_price || 0}
            onChange={(e) => setForm({ ...form, min_price: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={form.sort_order || 0}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.is_active}
          onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
        />
        <Label>Active</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form as PackageType)} disabled={saving || !form.name}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </DialogFooter>
    </div>
  )
}

// Customer Pricing Form Component
function CustomerPricingForm({
  customerPricing,
  customers,
  existingCustomerIds,
  onSave,
  onCancel,
  saving,
}: {
  customerPricing?: CustomerPricing
  customers: Customer[]
  existingCustomerIds: string[]
  onSave: (pricing: CustomerPricing) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Partial<CustomerPricing>>(
    customerPricing || {
      customer_id: "",
      custom_base_price: null,
      custom_per_mile_rate: null,
      custom_discount_percentage: null,
      custom_minimum_charge: null,
      flat_rate_enabled: false,
      flat_rate_amount: null,
      flat_rate_max_miles: null,
      notes: "",
    }
  )

  // Filter out customers who already have pricing (unless editing)
  const availableCustomers = customers.filter(
    c => !existingCustomerIds.includes(c.id) || c.id === customerPricing?.customer_id
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Customer</Label>
        <Select
          value={form.customer_id || ""}
          onValueChange={(value) => setForm({ ...form, customer_id: value })}
          disabled={!!customerPricing}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {availableCustomers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name || customer.phone_number}
                {customer.company && ` (${customer.company})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Custom Base Price ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.custom_base_price || ""}
            onChange={(e) => setForm({ ...form, custom_base_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Use default"
          />
        </div>
        <div className="space-y-2">
          <Label>Custom Per-Mile Rate ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.custom_per_mile_rate || ""}
            onChange={(e) => setForm({ ...form, custom_per_mile_rate: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Use default"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount Percentage (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.custom_discount_percentage || ""}
            onChange={(e) => setForm({ ...form, custom_discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="No discount"
          />
        </div>
        <div className="space-y-2">
          <Label>Minimum Charge ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.custom_minimum_charge || ""}
            onChange={(e) => setForm({ ...form, custom_minimum_charge: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Use default"
          />
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.flat_rate_enabled || false}
            onCheckedChange={(checked) => setForm({ ...form, flat_rate_enabled: checked })}
          />
          <Label>Enable Flat Rate Pricing</Label>
        </div>
        {form.flat_rate_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Flat Rate Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.flat_rate_amount || ""}
                onChange={(e) => setForm({ ...form, flat_rate_amount: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Miles for Flat Rate</Label>
              <Input
                type="number"
                step="0.1"
                value={form.flat_rate_max_miles || ""}
                onChange={(e) => setForm({ ...form, flat_rate_max_miles: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Internal notes about this customer's pricing"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form as CustomerPricing)} disabled={saving || !form.customer_id}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </DialogFooter>
    </div>
  )
}
