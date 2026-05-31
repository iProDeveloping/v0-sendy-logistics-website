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
import { Switch } from "@/components/ui/switch"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, ExternalLink, Pencil, Save, Loader2 } from "lucide-react"

interface Page {
  id: string
  page_slug: string
  title: string
  content: Record<string, unknown>
  meta_description: string | null
  published: boolean
  updated_at: string
}

export function PagesList({ initialPages }: { initialPages: Page[] }) {
  const [pages, setPages] = useState(initialPages)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [editForm, setEditForm] = useState<{
    title: string
    meta_description: string
    content: string
    published: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const openEditor = (page: Page) => {
    setSelectedPage(page)
    setEditForm({
      title: page.title,
      meta_description: page.meta_description || "",
      content: JSON.stringify(page.content, null, 2),
      published: page.published,
    })
  }

  const savePage = async () => {
    if (!selectedPage || !editForm) return

    setSaving(true)

    try {
      const contentJson = JSON.parse(editForm.content)
      const supabase = createClient()
      
      const { error } = await supabase
        .from("cms_content")
        .update({
          title: editForm.title,
          meta_description: editForm.meta_description || null,
          content: contentJson,
          published: editForm.published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPage.id)

      if (error) throw error

      setPages(pages.map(p => 
        p.id === selectedPage.id 
          ? { ...p, title: editForm.title, meta_description: editForm.meta_description, content: contentJson, published: editForm.published, updated_at: new Date().toISOString() } 
          : p
      ))
      setSelectedPage(null)
      setEditForm(null)
      router.refresh()
    } catch (error) {
      alert("Failed to save. Make sure the content is valid JSON.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {pages.map((page) => (
              <div
                key={page.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{page.title}</p>
                      <Badge variant={page.published ? "default" : "secondary"}>
                        {page.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.page_slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={`/${page.page_slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditor(page)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!selectedPage} onOpenChange={() => { setSelectedPage(null); setEditForm(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPage && editForm && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Page: {selectedPage.page_slug}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta">Meta Description (SEO)</Label>
                  <Textarea
                    id="meta"
                    value={editForm.meta_description}
                    onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content (JSON)</Label>
                  <Textarea
                    id="content"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Edit the JSON content for this page. Be careful to maintain valid JSON format.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="published"
                      checked={editForm.published}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, published: checked })}
                    />
                    <Label htmlFor="published">Published</Label>
                  </div>

                  <Button onClick={savePage} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
