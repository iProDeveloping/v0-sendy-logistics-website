import { createClient } from "@/lib/supabase/server"
import { PricingDashboard } from "@/components/admin/pricing-dashboard"

export default async function PricingPage() {
  const supabase = await createClient()

  // Fetch pricing settings
  const { data: settings } = await supabase
    .from("pricing_settings")
    .select("*")
    .order("key")

  // Fetch package types
  const { data: packageTypes } = await supabase
    .from("package_types")
    .select("*")
    .order("sort_order")

  // Fetch customer pricing overrides with customer info
  const { data: customerPricing } = await supabase
    .from("customer_pricing")
    .select(`
      *,
      sms_customers (
        id,
        name,
        phone_number,
        company
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch customers for dropdown
  const { data: customers } = await supabase
    .from("sms_customers")
    .select("id, name, phone_number, company")
    .order("name")

  return (
    <PricingDashboard
      initialSettings={settings || []}
      initialPackageTypes={packageTypes || []}
      initialCustomerPricing={customerPricing || []}
      customers={customers || []}
    />
  )
}
