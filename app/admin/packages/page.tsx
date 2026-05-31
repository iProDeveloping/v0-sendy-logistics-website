import { createClient } from "@/lib/supabase/server"
import { PackagesList } from "@/components/admin/packages-list"

export default async function PackagesAdminPage() {
  const supabase = await createClient()

  const { data: packages } = await supabase
    .from("packages")
    .select("*, package_events(*)")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Packages</h1>
        <p className="text-muted-foreground mt-1">Manage package tracking</p>
      </div>

      <PackagesList initialPackages={packages || []} />
    </div>
  )
}
