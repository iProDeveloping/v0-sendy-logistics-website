import { createClient } from "@/lib/supabase/server"
import { FaqsList } from "@/components/admin/faqs-list"

export default async function FaqsAdminPage() {
  const supabase = await createClient()

  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">FAQs</h1>
        <p className="text-muted-foreground mt-1">Manage frequently asked questions</p>
      </div>

      <FaqsList initialFaqs={faqs || []} />
    </div>
  )
}
