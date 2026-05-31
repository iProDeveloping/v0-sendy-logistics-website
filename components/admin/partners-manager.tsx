"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Upload, GripVertical, ExternalLink, ImageIcon } from "lucide-react"

interface Partner {
  id: string
  name: string
  logo_url: string
  website_url?: string
  active: boolean
  sort_order: number
  created_at: string
}

export function PartnersManager() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    website_url: "",
    active: true,
    sort_order: 0
  })

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/admin/partners")
      const data = await res.json()
      setPartners(data.partners || [])
    } catch (err) {
      console.error("Failed to fetch partners:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "partners")
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({ ...prev, logo_url: data.url }))
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  const openAddDialog = () => {
    setEditingPartner(null)
    setFormData({
      name: "",
      logo_url: "",
      website_url: "",
      active: true,
      sort_order: partners.length
    })
    setDialogOpen(true)
  }

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || "",
      active: partner.active,
      sort_order: partner.sort_order
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingPartner) {
        await fetch(`/api/admin/partners/${editingPartner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })
      } else {
        await fetch("/api/admin/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })
      }
      
      setDialogOpen(false)
      fetchPartners()
    } catch (err) {
      console.error("Save failed:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return
    
    try {
      await fetch(`/api/admin/partners/${id}`, { method: "DELETE" })
      fetchPartners()
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const toggleActive = async (partner: Partner) => {
    try {
      await fetch(`/api/admin/partners/${partner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...partner, active: !partner.active })
      })
      fetchPartners()
    } catch (err) {
      console.error("Toggle failed:", err)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Partners ({partners.length})</CardTitle>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No partners added yet</p>
              <p className="text-sm">Add partner logos to display in the scrolling banner</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-24">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="h-10 w-20 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {partner.logo_url ? (
                          <Image
                            src={partner.logo_url || "/placeholder.svg"}
                            alt={partner.name}
                            width={80}
                            height={40}
                            className="object-contain"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>
                      {partner.website_url ? (
                        <a 
                          href={partner.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="truncate max-w-[200px]">{partner.website_url}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={partner.active ? "default" : "secondary"}>
                        {partner.active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(partner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(partner)}
                        >
                          <Switch checked={partner.active} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(partner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? "Edit Partner" : "Add Partner"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Partner Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., CVS Pharmacy"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Logo *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://... or /partners/logo.svg"
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.logo_url && (
                <div className="mt-2 p-4 bg-muted rounded-lg flex items-center justify-center">
                  <Image
                    src={formData.logo_url || "/placeholder.svg"}
                    alt="Preview"
                    width={120}
                    height={60}
                    className="object-contain max-h-16"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website URL (optional)</Label>
              <Input
                id="website"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://www.example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active (visible on website)</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.logo_url}>
              {editingPartner ? "Save Changes" : "Add Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
