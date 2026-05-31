"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Truck,
  Users,
  Package,
  FileText,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react"

interface ConnectionStatus {
  connected: boolean
  message?: string
  lastChecked?: string
}

interface WooDeliveryStats {
  totalTasks: number
  pendingTasks: number
  activeDrivers: number
}

interface SyncResult {
  success: boolean
  results?: {
    tasks?: { synced: number; errors: string[] }
    customers?: { synced: number; errors: string[] }
    drivers?: { synced: number; errors: string[] }
    invoices?: { synced: number; errors: string[] }
  }
  totalSynced?: number
  errors?: string[]
  error?: string
}

interface SyncLog {
  id: string
  sync_type: string
  status: string
  records_synced: number
  errors: string[]
  started_at: string
  completed_at?: string
}

export function WooDeliverySettings() {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false })
  const [stats, setStats] = useState<WooDeliveryStats | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncType, setSyncType] = useState<string>("all")
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [webhookUrl, setWebhookUrl] = useState("")

  const checkConnection = useCallback(async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/admin/woodelivery/status")
      const data = await response.json()
      setStatus({
        connected: data.connected,
        message: data.message,
        lastChecked: new Date().toISOString(),
      })
      if (data.stats) {
        setStats(data.stats)
      }
      if (data.syncLogs) {
        setSyncLogs(data.syncLogs)
      }
    } catch {
      setStatus({
        connected: false,
        message: "Failed to check connection",
        lastChecked: new Date().toISOString(),
      })
    }
    setIsChecking(false)
  }, [])

  const syncTasks = async () => {
    await runSync("tasks")
  }

  const runSync = async (type: string, fullSync = false) => {
    setIsSyncing(true)
    setSyncResult(null)
    setSyncProgress(10)
    
    try {
      setSyncProgress(30)
      const response = await fetch("/api/admin/woodelivery/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fullSync }),
      })
      setSyncProgress(80)
      const data: SyncResult = await response.json()
      setSyncResult(data)
      setSyncProgress(100)
      
      if (data.success) {
        checkConnection()
      }
    } catch {
      setSyncResult({
        success: false,
        error: "Sync request failed",
      })
    }
    
    setTimeout(() => {
      setIsSyncing(false)
      setSyncProgress(0)
    }, 1000)
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    alert("Webhook URL copied to clipboard")
  }

  useEffect(() => {
    // Set webhook URL based on current domain
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/woodelivery`)
    }
    checkConnection()
  }, [])

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connection Status
            {status.connected ? (
              <Badge className="bg-green-500 text-white">Connected</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </CardTitle>
          <CardDescription>
            WooDelivery API connection status and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {status.connected ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
            <div>
              <p className="font-medium">
                {status.connected
                  ? "Successfully connected to WooDelivery"
                  : "Not connected to WooDelivery"}
              </p>
              {status.message && (
                <p className="text-sm text-muted-foreground">{status.message}</p>
              )}
              {status.lastChecked && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {new Date(status.lastChecked).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={checkConnection}
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      {status.connected && stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <Truck className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                  <p className="text-sm text-muted-foreground">Pending Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeDrivers}</p>
                  <p className="text-sm text-muted-foreground">Active Drivers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure your WooDelivery API key to enable the integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Environment Variable Required</AlertTitle>
            <AlertDescription>
              Add your WooDelivery API key as an environment variable named{" "}
              <code className="bg-muted px-1 py-0.5 rounded">WOODELIVERY_API_KEY</code>
              {" "}in your project settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>How to get your API key:</Label>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Log in to your WooDelivery Admin Dashboard</li>
              <li>Navigate to Settings → API & Integrations</li>
              <li>Generate or copy your API key</li>
              <li>Add it to your environment variables</li>
            </ol>
          </div>

          <Button variant="outline" asChild>
            <a
              href="https://app.woodelivery.com/settings"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open WooDelivery Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Set up webhooks to receive real-time delivery updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyWebhookUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this URL to your WooDelivery webhook settings to receive status updates
            </p>
          </div>

          <Alert>
            <AlertTitle>Webhook Events</AlertTitle>
            <AlertDescription>
              Configure the following events in WooDelivery:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Task Created</li>
                <li>Task Assigned</li>
                <li>Task Started</li>
                <li>Task Completed</li>
                <li>Task Failed/Cancelled</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Optional: Webhook Secret</Label>
            <p className="text-sm text-muted-foreground">
              Add{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                WOODELIVERY_WEBHOOK_SECRET
              </code>{" "}
              to your environment variables for webhook signature verification.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Actions */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>
              Sync all your WooDelivery data including tasks, customers, drivers, and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sync Type Selection */}
            <Tabs value={syncType} onValueChange={setSyncType}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Data</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="drivers">Drivers</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Full Sync</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync all tasks, customers, drivers, and invoices from WooDelivery
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Package className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium">Tasks / Deliveries</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync all delivery tasks with status, driver info, and tracking details
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <h4 className="font-medium">Customers</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync customer database with contact info, addresses, and order history
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="drivers" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Truck className="h-8 w-8 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-medium">Drivers</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync driver/team member info including vehicle details and status
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="invoices" className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-yellow-500" />
                  <div className="flex-1">
                    <h4 className="font-medium">Invoices</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync all invoices with line items, payment status, and customer details
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Sync Progress */}
            {isSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Syncing {syncType === "all" ? "all data" : syncType}...</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            )}

            {/* Sync Result */}
            {syncResult && (
              <Alert variant={syncResult.success ? "default" : "destructive"}>
                <AlertTitle>
                  {syncResult.success ? "Sync Completed" : "Sync Failed"}
                </AlertTitle>
                <AlertDescription>
                  {syncResult.success ? (
                    <div className="space-y-2">
                      <p>Total records synced: {syncResult.totalSynced}</p>
                      {syncResult.results && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {syncResult.results.tasks && (
                            <div className="text-sm">
                              <span className="font-medium">Tasks:</span> {syncResult.results.tasks.synced}
                            </div>
                          )}
                          {syncResult.results.customers && (
                            <div className="text-sm">
                              <span className="font-medium">Customers:</span> {syncResult.results.customers.synced}
                            </div>
                          )}
                          {syncResult.results.drivers && (
                            <div className="text-sm">
                              <span className="font-medium">Drivers:</span> {syncResult.results.drivers.synced}
                            </div>
                          )}
                          {syncResult.results.invoices && (
                            <div className="text-sm">
                              <span className="font-medium">Invoices:</span> {syncResult.results.invoices.synced}
                            </div>
                          )}
                        </div>
                      )}
                      {syncResult.errors && syncResult.errors.length > 0 && (
                        <div className="mt-2 text-sm text-yellow-600">
                          {syncResult.errors.length} warnings occurred during sync
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{syncResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Sync Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={() => runSync(syncType, false)} 
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Recent (30 Days)
              </Button>
              <Button 
                variant="outline"
                onClick={() => runSync(syncType, true)} 
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Full Sync (All History)
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              This will import your WooDelivery data into your local database for backup,
              reporting, and offline access. Real-time updates are handled via webhooks.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      {status.connected && syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sync History
            </CardTitle>
            <CardDescription>
              Recent synchronization operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="capitalize">{log.sync_type}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          log.status === "completed" ? "default" :
                          log.status === "running" ? "secondary" :
                          log.status === "completed_with_errors" ? "outline" :
                          "destructive"
                        }
                        className={log.status === "completed" ? "bg-green-500" : ""}
                      >
                        {log.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.records_synced}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(log.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.completed_at 
                        ? new Date(log.completed_at).toLocaleString() 
                        : "-"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats from Synced Data */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Synced Data Overview
            </CardTitle>
            <CardDescription>
              Summary of data synced from WooDelivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats?.totalTasks || 0}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">Customers</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Truck className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats?.activeDrivers || 0}</p>
                <p className="text-sm text-muted-foreground">Drivers</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
