import { createServiceClient } from "@/lib/supabase/server"
import { CaseStudiesManager } from "@/components/admin/case-studies-manager"

export const metadata = {
  title: "Manage Case Studies - Admin",
}

export default async function AdminCaseStudiesPage() {
  const supabase = createServiceClient()
  
  const { data: caseStudies } = await supabase
    .from("case_studies")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Case Studies</h1>
        <p className="text-muted-foreground">
          Manage your case studies and success stories
        </p>
      </div>
      
      <CaseStudiesManager initialData={caseStudies || []} />
    </div>
  )
}
