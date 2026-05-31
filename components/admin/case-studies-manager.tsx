"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Star } from "lucide-react"
import { useRouter } from "next/navigation"

interface CaseStudy {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string
  category: string
  featured: boolean
  published: boolean
  stats: Array<{ value: string; label: string }>
  content: string | null
  sort_order: number
  created_at: string
}

interface CaseStudiesManagerProps {
  initialData: CaseStudy[]
}

const defaultStats = [
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
]

export function CaseStudiesManager({ initialData }: CaseStudiesManagerProps) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudy, setEditingStudy] = useState<CaseStudy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    category: "",
    featured: false,
    published: true,
    stats: defaultStats,
    content: "",
  })
  
  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      category: "",
      featured: false,
      published: true,
      stats: defaultStats,
      content: "",
    })
    setEditingStudy(null)
  }
  
  const openEditDialog = (study: CaseStudy) => {
    setEditingStudy(study)
    setFormData({
      title: study.title,
      slug: study.slug,
      subtitle: study.subtitle || "",
      description: study.description,
      category: study.category,
      featured: study.featured,
      published: study.published,
      stats: study.stats?.length ? study.stats : defaultStats,
      content: study.content || "",
    })
    setIsDialogOpen(true)
  }
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingStudy ? prev.slug : generateSlug(title),
    }))
  }
  
  const handleStatChange = (index: number, field: 'value' | 'label', value: string) => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      ),
    }))
  }
  
  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      const endpoint = editingStudy 
        ? `/api/admin/case-studies/${editingStudy.id}`
        : '/api/admin/case-studies'
      
      const method = editingStudy ? 'PUT' : 'POST'
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stats: formData.stats.filter(s => s.value && s.label),
        }),
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      const savedStudy = await res.json()
      
      if (editingStudy) {
        setCaseStudies(prev => 
          prev.map(s => s.id === savedStudy.id ? savedStudy : s)
        )
      } else {
        setCaseStudies(prev => [...prev, savedStudy])
      }
      
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error('Failed to save case study:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case study?')) return
    
    try {
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete')
      
      setCaseStudies(prev => prev.filter(s => s.id !== id))
      router.refresh()
    } catch (error) {
      console.error('Failed to delete case study:', error)
    }
  }
  
  const togglePublished = async (study: CaseStudy) => {
    try {
      const res = await fetch(`/api/admin/case-studies/${study.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !study.published }),
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      setCaseStudies(prev => 
        prev.map(s => s.id === study.id ? { ...s, published: !s.published } : s)
      )
    } catch (error) {
      console.error('Failed to toggle published:', error)
    }
  }
  
  const toggleFeatured = async (study: CaseStudy) => {
    try {
      const res = await fetch(`/api/admin/case-studies/${study.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !study.featured }),
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      setCaseStudies(prev => 
        prev.map(s => s.id === study.id ? { ...s, featured: !s.featured } : s)
      )
    } catch (error) {
      console.error('Failed to toggle featured:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {caseStudies.length} case {caseStudies.length === 1 ? 'study' : 'studies'}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Case Study
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStudy ? 'Edit Case Study' : 'New Case Study'}
              </DialogTitle>
              <DialogDescription>
                {editingStudy ? 'Update the case study details' : 'Add a new case study to showcase your success stories'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="The True Cost of Fleet Ownership"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="fleet-ownership-costs"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Why Major Retailers Choose Outsourced Delivery"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Cost Analysis, Healthcare, Retail, etc."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A brief summary of the case study..."
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Stats */}
              <div className="space-y-3">
                <Label>Key Statistics (up to 3)</Label>
                {formData.stats.map((stat, index) => (
                  <div key={index} className="grid grid-cols-2 gap-3">
                    <Input
                      value={stat.value}
                      onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                      placeholder="47%"
                    />
                    <Input
                      value={stat.label}
                      onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                      placeholder="Cost Savings"
                    />
                  </div>
                ))}
              </div>
              
              {/* Full Content */}
              <div className="grid gap-2">
                <Label htmlFor="content">Full Content (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write the full case study content here..."
                  rows={8}
                />
              </div>
              
              {/* Toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !formData.title || !formData.description || !formData.category}>
                {isLoading ? 'Saving...' : editingStudy ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Case Studies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Case Studies</CardTitle>
          <CardDescription>
            Manage your case studies. Featured studies appear prominently on the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {caseStudies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No case studies yet.</p>
              <p className="text-sm mt-1">Click "Add Case Study" to create your first one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Featured</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caseStudies.map((study) => (
                  <TableRow key={study.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{study.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {study.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{study.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(study)}
                        className={study.published ? 'text-green-600' : 'text-muted-foreground'}
                      >
                        {study.published ? (
                          <><Eye className="h-4 w-4 mr-1" /> Live</>
                        ) : (
                          <><EyeOff className="h-4 w-4 mr-1" /> Draft</>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(study)}
                        className={study.featured ? 'text-amber-500' : 'text-muted-foreground'}
                      >
                        <Star className={`h-4 w-4 ${study.featured ? 'fill-current' : ''}`} />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(study)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(study.id)}
                          className="text-destructive hover:text-destructive"
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
    </div>
  )
}
