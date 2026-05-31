import { Metadata } from "next"
import { WooDeliverySettings } from "@/components/admin/woodelivery-settings"

export const metadata: Metadata = {
  title: "WooDelivery Integration - Admin",
  description: "Manage WooDelivery dispatch integration",
}

export default function WooDeliveryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          WooDelivery Integration
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect and manage your WooDelivery dispatch system
        </p>
      </div>

      <WooDeliverySettings />
    </div>
  )
}
