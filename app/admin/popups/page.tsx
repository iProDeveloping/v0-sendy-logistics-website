"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"

interface SitePopup {
  id: string
  name: string
  title: string
  subtitle: string | null
  description: string | null
  cta_text: string | null
  cta_url: string | null
  secondary_cta_text: string | null
  secondary_cta_url: string | null
  badge_text: string | null
  features: Array<{ icon: string; text: string }>
  display_pages: string[]
  is_active: boolean
  delay_seconds: number
  show_once_per_session: boolean
  created_at: string
}

const defaultPopup: Partial<SitePopup> = {
  name: "",
  title: "",
  subtitle: "",
  description: "",
  cta_text: "",
  cta_url: "",
  secondary_cta_text: "",
  secondary_cta_url: "",
  badge_text: "",
  features: [],
  display_pages: ["home"],
  is_active: true,
  delay_seconds: 3,
  show_once_per_session: true,
}

export default function PopupsAdminPage() {
  const [popups, setPopups] = useState<SitePopup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPopup, setEditingPopup] = useState<Partial<SitePopup> | null>(null)
  const [featuresText, setFeaturesText] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchPopups()
  }, [])

  const fetchPopups = async () => {
    const { data } = await supabase
      .from("site_popups")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setPopups(data)
    }
    setIsLoading(false)
  }

  const handleEdit = (popup: SitePopup) => {
    setEditingPopup(popup)
    setFeaturesText(
      popup.features
        ?.map((f) => `${f.icon}:${f.text}`)
        .join("\n") || ""
    )
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingPopup(defaultPopup)
    setFeaturesText("")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingPopup) return

    // Parse features from text
    const features = featuresText
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [icon, ...textParts] = line.split(":")
        return { icon: icon.trim(), text: textParts.join(":").trim() }
      })

    const popupData = {
      ...editingPopup,
      features,
    }

    if (editingPopup.id) {
      // Update
      await supabase
        .from("site_popups")
        .update(popupData)
        .eq("id", editingPopup.id)
    } else {
      // Create
      await supabase.from("site_popups").insert(popupData)
    }

    setIsDialogOpen(false)
    setEditingPopup(null)
    fetchPopups()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this popup?")) return

    await supabase.from("site_popups").delete().eq("id", id)
    fetchPopups()
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await supabase
      .from("site_popups")
      .update({ is_active: isActive })
      .eq("id", id)
    fetchPopups()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Site Popups</h1>
              <p className="text-muted-foreground">
                Manage promotional popups and announcements
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Popup
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPopup?.id ? "Edit Popup" : "Create Popup"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure your promotional popup settings
                  </DialogDescription>
                </DialogHeader>

                {editingPopup && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Internal Name</Label>
                        <Input
                          id="name"
                          value={editingPopup.name || ""}
                          onChange={(e) =>
                            setEditingPopup({ ...editingPopup, name: e.target.value })
                          }
                          placeholder="e.g., fulfillr-launch"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="badge">Badge Text</Label>
                        <Input
                          id="badge"
                          value={editingPopup.badge_text || ""}
                          onChange={(e) =>
                            setEditingPopup({ ...editingPopup, badge_text: e.target.value })
                          }
                          placeholder="e.g., NEW"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editingPopup.title || ""}
                        onChange={(e) =>
                          setEditingPopup({ ...editingPopup, title: e.target.value })
                        }
                        placeholder="Popup headline"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={editingPopup.subtitle || ""}
                        onChange={(e) =>
                          setEditingPopup({ ...editingPopup, subtitle: e.target.value })
                        }
                        placeholder="Secondary headline"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editingPopup.description || ""}
                        onChange={(e) =>
                          setEditingPopup({ ...editingPopup, description: e.target.value })
                        }
                        placeholder="Main body text"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cta_text">Primary CTA Text</Label>
                        <Input
                          id="cta_text"
                          value={editingPopup.cta_text || ""}
                          onChange={(e) =>
                            setEditingPopup({ ...editingPopup, cta_text: e.target.value })
                          }
                          placeholder="e.g., Get Started"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cta_url">Primary CTA URL</Label>
                        <Input
                          id="cta_url"
                          value={editingPopup.cta_url || ""}
                          onChange={(e) =>
                            setEditingPopup({ ...editingPopup, cta_url: e.target.value })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="secondary_cta_text">Secondary CTA Text</Label>
                        <Input
                          id="secondary_cta_text"
                          value={editingPopup.secondary_cta_text || ""}
                          onChange={(e) =>
                            setEditingPopup({
                              ...editingPopup,
                              secondary_cta_text: e.target.value,
                            })
                          }
                          placeholder="e.g., Learn More"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_cta_url">Secondary CTA URL</Label>
                        <Input
                          id="secondary_cta_url"
                          value={editingPopup.secondary_cta_url || ""}
                          onChange={(e) =>
                            setEditingPopup({
                              ...editingPopup,
                              secondary_cta_url: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="features">
                        Features (one per line, format: icon:text)
                      </Label>
                      <Textarea
                        id="features"
                        value={featuresText}
                        onChange={(e) => setFeaturesText(e.target.value)}
                        placeholder="package:Same-day processing&#10;check:99.8% accuracy&#10;truck:2-day delivery"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available icons: package, sync, check, truck, sparkles
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_pages">
                        Display Pages (comma-separated)
                      </Label>
                      <Input
                        id="display_pages"
                        value={editingPopup.display_pages?.join(", ") || ""}
                        onChange={(e) =>
                          setEditingPopup({
                            ...editingPopup,
                            display_pages: e.target.value.split(",").map((s) => s.trim()),
                          })
                        }
                        placeholder="home, services, pricing"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delay">Delay (seconds)</Label>
                        <Input
                          id="delay"
                          type="number"
                          value={editingPopup.delay_seconds || 3}
                          onChange={(e) =>
                            setEditingPopup({
                              ...editingPopup,
                              delay_seconds: parseInt(e.target.value) || 3,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          id="show_once"
                          checked={editingPopup.show_once_per_session ?? true}
                          onCheckedChange={(checked) =>
                            setEditingPopup({
                              ...editingPopup,
                              show_once_per_session: checked,
                            })
                          }
                        />
                        <Label htmlFor="show_once">Show once per session</Label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={editingPopup.is_active ?? true}
                        onCheckedChange={(checked) =>
                          setEditingPopup({ ...editingPopup, is_active: checked })
                        }
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>Save Popup</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Popups</CardTitle>
              <CardDescription>
                Click on a popup to edit or toggle its active status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : popups.length === 0 ? (
                <p className="text-muted-foreground">No popups created yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popups.map((popup) => (
                      <TableRow key={popup.id}>
                        <TableCell className="font-medium">{popup.name}</TableCell>
                        <TableCell>{popup.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {popup.display_pages.map((page) => (
                              <Badge key={page} variant="outline" className="text-xs">
                                {page}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={popup.is_active ? "default" : "secondary"}
                          >
                            {popup.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleToggleActive(popup.id, !popup.is_active)
                              }
                            >
                              {popup.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(popup)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(popup.id)}
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
    </div>
  )
}
