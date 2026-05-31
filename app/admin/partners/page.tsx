import { PartnersManager } from "@/components/admin/partners-manager"

export const metadata = {
  title: "Partners - Admin | Sendy Logistics",
  description: "Manage partner logos and banner"
}

export default function AdminPartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partner Logos</h1>
        <p className="text-muted-foreground">
          Manage partner logos displayed in the scrolling banner on the website
        </p>
      </div>
      <PartnersManager />
    </div>
  )
}
