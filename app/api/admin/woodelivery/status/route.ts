import { NextResponse } from "next/server"
import { getWooDeliveryClient } from "@/lib/woodelivery"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const client = getWooDeliveryClient()
  const supabase = await createClient()

  // Get sync logs regardless of connection status
  const { data: syncLogs } = await supabase
    .from("woo_sync_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10)

  // Get synced data counts
  const [tasksCount, customersCount, driversCount, invoicesCount] = await Promise.all([
    supabase.from("woo_tasks").select("*", { count: "exact", head: true }),
    supabase.from("woo_customers").select("*", { count: "exact", head: true }),
    supabase.from("woo_drivers").select("*", { count: "exact", head: true }),
    supabase.from("woo_invoices").select("*", { count: "exact", head: true }),
  ])

  const syncedCounts = {
    tasks: tasksCount.count || 0,
    customers: customersCount.count || 0,
    drivers: driversCount.count || 0,
    invoices: invoicesCount.count || 0,
  }

  if (!client) {
    return NextResponse.json({
      connected: false,
      message: "WOODELIVERY_API_KEY environment variable not configured",
      syncLogs: syncLogs || [],
      syncedCounts,
    })
  }

  try {
    const authResult = await client.testAuth()

    if (!authResult.success) {
      return NextResponse.json({
        connected: false,
        message: authResult.message || "Authentication failed",
        syncLogs: syncLogs || [],
        syncedCounts,
      })
    }

    // Get live stats from WooDelivery
    const { total } = await client.listTasks({ limit: 1 })
    const pendingResult = await client.listTasks({ status: "pending", limit: 1 })
    const drivers = await client.getDrivers()
    const activeDrivers = drivers.filter((d) => d.status === "active").length

    return NextResponse.json({
      connected: true,
      message: "Successfully connected to WooDelivery",
      stats: {
        totalTasks: total,
        pendingTasks: pendingResult.total,
        activeDrivers,
      },
      syncLogs: syncLogs || [],
      syncedCounts,
    })
  } catch (error) {
    console.error("[WooDelivery Status] Error:", error)
    return NextResponse.json({
      connected: false,
      message: error instanceof Error ? error.message : "Connection failed",
      syncLogs: syncLogs || [],
      syncedCounts,
    })
  }
}
