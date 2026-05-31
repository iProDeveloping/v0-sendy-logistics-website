import { createClient } from "@/lib/supabase/server"
import { PagesList } from "@/components/admin/pages-list"

export default async function PagesAdminPage() {
  const supabase = await createClient()

  const { data: pages } = await supabase
    .from("cms_content")
    .select("*")
    .order("title", { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Pages</h1>
        <p className="text-muted-foreground mt-1">Manage website content</p>
      </div>

      <PagesList initialPages={pages || []} />
    </div>
  )
}
