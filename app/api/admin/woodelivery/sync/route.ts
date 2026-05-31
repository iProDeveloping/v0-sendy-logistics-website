import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getWooDeliveryClient, type Task, type Customer, type Invoice } from "@/lib/woodelivery"

type SyncType = 'all' | 'tasks' | 'customers' | 'drivers' | 'invoices'

export async function POST(request: NextRequest) {
  const client = getWooDeliveryClient()

  if (!client) {
    return NextResponse.json({
      success: false,
      error: "WooDelivery not configured. Please add your WOODELIVERY_API_KEY.",
    })
  }

  // Get sync type from request body
  let syncType: SyncType = 'all'
  let fullSync = false
  try {
    const body = await request.json()
    syncType = body.type || 'all'
    fullSync = body.fullSync || false
  } catch {
    // Default to all
  }

  const supabase = await createClient()
  const results: Record<string, { synced: number; errors: string[] }> = {}

  // Create sync log entry
  const { data: syncLog } = await supabase
    .from("woo_sync_log")
    .insert({
      sync_type: syncType,
      status: "running",
    })
    .select()
    .single()

  try {
    // Sync Tasks/Trips
    if (syncType === 'all' || syncType === 'tasks') {
      results.tasks = await syncTasks(client, supabase, fullSync)
    }

    // Sync Customers
    if (syncType === 'all' || syncType === 'customers') {
      results.customers = await syncCustomers(client, supabase)
    }

    // Sync Drivers
    if (syncType === 'all' || syncType === 'drivers') {
      results.drivers = await syncDrivers(client, supabase)
    }

    // Sync Invoices
    if (syncType === 'all' || syncType === 'invoices') {
      results.invoices = await syncInvoices(client, supabase)
    }

    // Update sync log
    const totalSynced = Object.values(results).reduce((sum, r) => sum + r.synced, 0)
    const allErrors = Object.entries(results).flatMap(([type, r]) => 
      r.errors.map(e => `${type}: ${e}`)
    )

    if (syncLog) {
      await supabase
        .from("woo_sync_log")
        .update({
          status: allErrors.length > 0 ? "completed_with_errors" : "completed",
          records_synced: totalSynced,
          errors: allErrors,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id)
    }

    return NextResponse.json({
      success: true,
      results,
      totalSynced,
      errors: allErrors,
    })
  } catch (error) {
    console.error("[WooDelivery Sync] Error:", error)

    if (syncLog) {
      await supabase
        .from("woo_sync_log")
        .update({
          status: "failed",
          errors: [error instanceof Error ? error.message : "Unknown error"],
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    })
  }
}

async function syncTasks(
  client: ReturnType<typeof getWooDeliveryClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  fullSync: boolean
): Promise<{ synced: number; errors: string[] }> {
  if (!client) return { synced: 0, errors: ["Client not available"] }
  
  const errors: string[] = []
  let synced = 0

  try {
    // Get tasks - all for full sync, recent 30 days otherwise
    let tasks: Task[]
    if (fullSync) {
      tasks = await client.getAllTasks()
    } else {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      tasks = await client.getAllTasks(thirtyDaysAgo.toISOString())
    }

    for (const task of tasks) {
      try {
        const { error } = await supabase
          .from("woo_tasks")
          .upsert(
            {
              woo_id: task.id,
              tracking_number: task.taskId || task.id,
              external_id: task.taskId,
              status: task.status,
              recipient_name: task.recipientName,
              recipient_phone: task.recipientPhone,
              recipient_address: task.recipientAddress,
              sender_address: task.pickupAddress,
              driver_name: task.driverName,
              driver_phone: task.driverPhone,
              scheduled_time: task.scheduledTime,
              completed_time: task.completedTime,
              notes: task.notes,
              raw_data: task as unknown as Record<string, unknown>,
              synced_at: new Date().toISOString(),
              created_at: task.createdAt,
              updated_at: task.updatedAt,
            },
            { onConflict: "woo_id" }
          )

        if (!error) {
          synced++
        } else {
          errors.push(`Task ${task.id}: ${error.message}`)
        }
      } catch (e) {
        errors.push(`Task ${task.id}: ${e instanceof Error ? e.message : "Unknown error"}`)
      }
    }
  } catch (e) {
    errors.push(`Failed to fetch tasks: ${e instanceof Error ? e.message : "Unknown error"}`)
  }

  return { synced, errors }
}

async function syncCustomers(
  _client: ReturnType<typeof getWooDeliveryClient>,
  _supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ synced: number; errors: string[] }> {
  // WooDelivery API v2 doesn't have a customers endpoint
  // Customer data is derived from task data instead
  return { 
    synced: 0, 
    errors: [] 
  }
}

async function syncDrivers(
  client: ReturnType<typeof getWooDeliveryClient>,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ synced: number; errors: string[] }> {
  if (!client) return { synced: 0, errors: ["Client not available"] }
  
  const errors: string[] = []
  let synced = 0

  try {
    const drivers = await client.getDrivers()

    for (const driver of drivers) {
      // Skip drivers without required fields
      if (!driver.id || !driver.name) {
        console.log('[WooDelivery] Skipping driver with missing id or name:', driver)
        continue
      }
      
      try {
        const { error } = await supabase
          .from("woo_drivers")
          .upsert(
            {
              woo_id: driver.id,
              name: driver.name || `Driver ${driver.id}`,
              email: driver.email || null,
              phone: driver.phone || null,
              vehicle_type: driver.vehicleType || null,
              license_plate: driver.licensePlate || null,
              status: driver.status || 'unknown',
              team_id: driver.teamId || null,
              team_name: driver.teamName || null,
              raw_data: driver as unknown as Record<string, unknown>,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "woo_id" }
          )

        if (!error) {
          synced++
        } else {
          errors.push(`Driver ${driver.id}: ${error.message}`)
        }
      } catch (e) {
        errors.push(`Driver ${driver.id}: ${e instanceof Error ? e.message : "Unknown error"}`)
      }
    }
  } catch (e) {
    errors.push(`Failed to fetch drivers: ${e instanceof Error ? e.message : "Unknown error"}`)
  }

  return { synced, errors }
}

async function syncInvoices(
  _client: ReturnType<typeof getWooDeliveryClient>,
  _supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ synced: number; errors: string[] }> {
  // WooDelivery API v2 doesn't have an invoices endpoint
  return { 
    synced: 0, 
    errors: [] 
  }
}
