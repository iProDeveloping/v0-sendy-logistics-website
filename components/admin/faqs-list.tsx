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
import { HelpCircle, Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  sort_order: number
  published: boolean
}

export function FaqsList({ initialFaqs }: { initialFaqs: FAQ[] }) {
  const [faqs, setFaqs] = useState(initialFaqs)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "",
    sort_order: 0,
    published: true,
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const openEditor = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq)
      setIsNew(false)
      setForm({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "",
        sort_order: faq.sort_order,
        published: faq.published,
      })
    } else {
      setEditingFaq(null)
      setIsNew(true)
      setForm({
        question: "",
        answer: "",
        category: "",
        sort_order: faqs.length,
        published: true,
      })
    }
  }

  const saveFaq = async () => {
    setSaving(true)
    const supabase = createClient()

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("faqs")
          .insert({
            question: form.question,
            answer: form.answer,
            category: form.category || null,
            sort_order: form.sort_order,
            published: form.published,
          })
          .select()
          .single()

        if (error) throw error
        setFaqs([...faqs, data])
      } else if (editingFaq) {
        const { error } = await supabase
          .from("faqs")
          .update({
            question: form.question,
            answer: form.answer,
            category: form.category || null,
            sort_order: form.sort_order,
            published: form.published,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFaq.id)

        if (error) throw error
        setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...form, category: form.category || null } : f))
      }

      setEditingFaq(null)
      setIsNew(false)
      router.refresh()
    } catch (error) {
      alert("Failed to save FAQ")
    } finally {
      setSaving(false)
    }
  }

  const deleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    const supabase = createClient()
    const { error } = await supabase.from("faqs").delete().eq("id", id)

    if (!error) {
      setFaqs(faqs.filter(f => f.id !== id))
    }
  }

  // Group by category
  const categories = [...new Set(faqs.map(f => f.category || "General"))]

  return (
    <>
      <div className="mb-6">
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <Card key={category}>
            <CardContent className="p-0">
              <div className="p-4 bg-muted/50 border-b border-border">
                <h3 className="font-semibold text-foreground">{category}</h3>
              </div>
              <div className="divide-y divide-border">
                {faqs
                  .filter(f => (f.category || "General") === category)
                  .map((faq) => (
                    <div key={faq.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            <p className="font-medium text-foreground">{faq.question}</p>
                            {!faq.published && (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground ml-6 line-clamp-2">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditor(faq)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFaq(faq.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Modal */}
      <Dialog open={editingFaq !== null || isNew} onOpenChange={() => { setEditingFaq(null); setIsNew(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "Add FAQ" : "Edit FAQ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="How do I...?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={4}
                placeholder="You can..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="General"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Sort Order</Label>
                <Input
                  id="sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(checked) => setForm({ ...form, published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <Button onClick={saveFaq} disabled={saving || !form.question || !form.answer}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isNew ? "Add FAQ" : "Save Changes"}
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
