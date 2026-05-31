const WOODELIVERY_API_BASE = 'https://api.woodelivery.com/v2'

interface WooDeliveryConfig {
  apiKey: string
}

interface Task {
  id: string
  taskId: string
  status: string
  statusText?: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  pickupAddress?: string
  scheduledTime?: string
  completedTime?: string
  driverName?: string
  driverPhone?: string
  trackingUrl?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface TaskEvent {
  id: string
  taskId: string
  status: string
  description: string
  timestamp: string
  location?: string
}

interface CreateTaskParams {
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  pickupAddress?: string
  scheduledTime?: string
  notes?: string
  externalId?: string
}

interface TaskListParams {
  page?: number
  limit?: number
  status?: string
  fromDate?: string
  toDate?: string
}

class WooDeliveryClient {
  private apiKey: string

  constructor(config: WooDeliveryConfig) {
    this.apiKey = config.apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${WOODELIVERY_API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.apiKey}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WooDelivery API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Test authentication
  async testAuth(): Promise<{ success: boolean; message?: string }> {
    try {
      await this.request('/auth/test')
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      }
    }
  }

  // Get a single task by ID
  async getTask(taskId: string): Promise<Task | null> {
    try {
      const response = await this.request<{ data: Task }>(`/tasks/${taskId}`)
      return response.data
    } catch (error) {
      console.error('[WooDelivery] Error fetching task:', error)
      return null
    }
  }

  // Get task by external/tracking reference
  async getTaskByTrackingNumber(trackingNumber: string): Promise<Task | null> {
    try {
      // WooDelivery requires date range for search
      const now = new Date()
      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days ahead
      
      const response = await this.request<{ data: Task[] }>('/tasks/search', {
        method: 'POST',
        body: JSON.stringify({
          ExternalId: trackingNumber,
          Limit: 1,
          StartDateTime: startDate.toISOString(),
          EndDateTime: endDate.toISOString(),
        }),
      })
      return response.data?.[0] || null
    } catch (error) {
      console.error('[WooDelivery] Error fetching task by tracking:', error)
      return null
    }
  }

  // List tasks with pagination and filters (WooDelivery uses POST for search/list)
  async listTasks(params: TaskListParams = {}): Promise<{ tasks: Task[]; total: number }> {
    try {
      // WooDelivery requires StartDateTime and EndDateTime
      const now = new Date()
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      const defaultEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days ahead
      
      const response = await this.request<{ data: Task[]; total: number }>('/tasks/search', {
        method: 'POST',
        body: JSON.stringify({
          Page: params.page || 1,
          Limit: params.limit || 50,
          Status: params.status,
          StartDateTime: params.fromDate || defaultStartDate.toISOString(),
          EndDateTime: params.toDate || defaultEndDate.toISOString(),
        }),
      })
      return { tasks: response.data || [], total: response.total || 0 }
    } catch (error) {
      console.error('[WooDelivery] Error listing tasks:', error)
      return { tasks: [], total: 0 }
    }
  }

  // Create a new delivery task
  async createTask(params: CreateTaskParams): Promise<Task | null> {
    try {
      const response = await this.request<{ data: Task }>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          recipient_name: params.recipientName,
          recipient_phone: params.recipientPhone,
          recipient_address: params.recipientAddress,
          pickup_address: params.pickupAddress,
          scheduled_time: params.scheduledTime,
          notes: params.notes,
          external_id: params.externalId,
        }),
      })
      return response.data
    } catch (error) {
      console.error('[WooDelivery] Error creating task:', error)
      return null
    }
  }

  // Create multiple tasks in batch
  async createTasksBatch(tasks: CreateTaskParams[]): Promise<Task[]> {
    try {
      const response = await this.request<{ data: Task[] }>('/tasks/batch', {
        method: 'POST',
        body: JSON.stringify({
          tasks: tasks.map(t => ({
            recipient_name: t.recipientName,
            recipient_phone: t.recipientPhone,
            recipient_address: t.recipientAddress,
            pickup_address: t.pickupAddress,
            scheduled_time: t.scheduledTime,
            notes: t.notes,
            external_id: t.externalId,
          })),
        }),
      })
      return response.data || []
    } catch (error) {
      console.error('[WooDelivery] Error creating batch tasks:', error)
      return []
    }
  }

  // Update task status
  async updateTaskStatus(taskId: string, status: string, notes?: string): Promise<Task | null> {
    try {
      const response = await this.request<{ data: Task }>(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      })
      return response.data
    } catch (error) {
      console.error('[WooDelivery] Error updating task status:', error)
      return null
    }
  }

  // Cancel a task
  async cancelTask(taskId: string, reason?: string): Promise<boolean> {
    try {
      await this.request(`/tasks/${taskId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      return true
    } catch (error) {
      console.error('[WooDelivery] Error canceling task:', error)
      return false
    }
  }

  // Get task history/events
  async getTaskEvents(taskId: string): Promise<TaskEvent[]> {
    try {
      const response = await this.request<{ data: TaskEvent[] }>(`/tasks/${taskId}/events`)
      return response.data || []
    } catch (error) {
      console.error('[WooDelivery] Error fetching task events:', error)
      return []
    }
  }

  // Get drivers list
  async getDrivers(): Promise<Array<{ id: string; name: string; phone?: string; email?: string; status: string; vehicleType?: string; licensePlate?: string; teamId?: string; teamName?: string }>> {
    try {
      const response = await this.request<{ data: Array<{ id: string; name: string; phone?: string; email?: string; status: string; vehicleType?: string; licensePlate?: string; teamId?: string; teamName?: string }> }>('/drivers')
      return response.data || []
    } catch (error) {
      console.error('[WooDelivery] Error fetching drivers:', error)
      return []
    }
  }

  // Assign driver to task
  async assignDriver(taskId: string, driverId: string): Promise<boolean> {
    try {
      await this.request(`/tasks/${taskId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ driver_id: driverId }),
      })
      return true
    } catch (error) {
      console.error('[WooDelivery] Error assigning driver:', error)
      return false
    }
  }

  // Note: WooDelivery API v2 doesn't have a direct customers endpoint
  // Customer data is extracted from tasks instead
  async getCustomers(_params: { page?: number; limit?: number } = {}): Promise<{ customers: Customer[]; total: number }> {
    // Return empty - customers are derived from task data
    console.log('[WooDelivery] Customers endpoint not available in API v2 - use task data instead')
    return { customers: [], total: 0 }
  }

  // Note: WooDelivery API v2 doesn't have a direct invoices endpoint
  async getInvoices(_params: { page?: number; limit?: number; status?: string; customerId?: string } = {}): Promise<{ invoices: Invoice[]; total: number }> {
    console.log('[WooDelivery] Invoices endpoint not available in API v2')
    return { invoices: [], total: 0 }
  }

  // Get all tasks for full sync (paginated)
  async getAllTasks(fromDate?: string): Promise<Task[]> {
    const allTasks: Task[] = []
    let page = 1
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const { tasks, total } = await this.listTasks({ 
        page, 
        limit,
        fromDate 
      })
      allTasks.push(...tasks)
      hasMore = allTasks.length < total
      page++
      
      // Safety limit to prevent infinite loops
      if (page > 100) break
    }

    return allTasks
  }

  // Get all customers for full sync
  async getAllCustomers(): Promise<Customer[]> {
    const allCustomers: Customer[] = []
    let page = 1
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const { customers, total } = await this.getCustomers({ page, limit })
      allCustomers.push(...customers)
      hasMore = allCustomers.length < total
      page++
      
      if (page > 100) break
    }

    return allCustomers
  }

  // Get all invoices for full sync
  async getAllInvoices(): Promise<Invoice[]> {
    const allInvoices: Invoice[] = []
    let page = 1
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const { invoices, total } = await this.getInvoices({ page, limit })
      allInvoices.push(...invoices)
      hasMore = allInvoices.length < total
      page++
      
      if (page > 100) break
    }

    return allInvoices
  }
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  lat?: number
  lng?: number
  notes?: string
  tags?: string[]
  totalOrders?: number
  totalSpent?: number
  createdAt?: string
  updatedAt?: string
}

interface Invoice {
  id: string
  invoiceNumber?: string
  customerId?: string
  customerName?: string
  status: string
  subtotal?: number
  tax?: number
  discount?: number
  total: number
  paidAmount?: number
  dueDate?: string
  paidDate?: string
  notes?: string
  lineItems?: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  createdAt?: string
  updatedAt?: string
}

// Create singleton instance
let wooDeliveryClient: WooDeliveryClient | null = null

export function getWooDeliveryClient(): WooDeliveryClient | null {
  const apiKey = process.env.WOODELIVERY_API_KEY
  
  if (!apiKey) {
    console.warn('[WooDelivery] API key not configured')
    return null
  }

  if (!wooDeliveryClient) {
    wooDeliveryClient = new WooDeliveryClient({ apiKey })
  }

  return wooDeliveryClient
}

export { WooDeliveryClient, type Task, type TaskEvent, type CreateTaskParams, type TaskListParams, type Customer, type Invoice }
