"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Clock,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  DollarSign,
  Bot,
  UserCog,
  AlertCircle,
  Bell,
  BellOff,
  Timer,
} from "lucide-react"
import { useAgentNotifications } from "@/hooks/use-agent-notifications"

interface CustomerLevel {
  id: string
  name: string
  discount_percentage: number
}

interface Customer {
  id: string
  phone_number: string
  name: string | null
  email: string | null
  company: string | null
  customer_level_id: string | null
  sms_approved: boolean
  notes: string | null
  created_at: string
  customer_levels?: CustomerLevel
}

interface Message {
  id: string
  conversation_id: string
  direction: "inbound" | "outbound"
  message: string
  sender_type: "customer" | "system" | "admin"
  created_at: string
}

interface Conversation {
  id: string
  customer_id: string | null
  phone_number: string
  status: string
  current_flow: string
  flow_data: Record<string, unknown>
  last_message_at: string
  created_at: string
  sms_customers?: Customer
  agent_mode?: boolean
  agent_mode_enabled_at?: string
  agent_mode_timeout_at?: string
  agent_requested_at?: string
}

interface TripRequest {
  id: string
  pickup_address: string
  delivery_address: string
  distance_miles: number
  total_price: number
  status: string
  created_at: string
}

interface ChatDashboardProps {
  initialConversations: Conversation[]
  customers: Customer[]
  customerLevels: CustomerLevel[]
}

export function ChatDashboard({ 
  initialConversations, 
  customers: initialCustomers,
  customerLevels 
}: ChatDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Agent notifications
  const { 
    notificationsEnabled, 
    requestPermission, 
    notifyAgentRequest 
  } = useAgentNotifications()
  
  // Count conversations needing agent
  const agentRequestCount = conversations.filter(
    c => c.agent_requested_at && !c.agent_mode
  ).length
  
  // Sort conversations: agent requested first, then by last message
  const sortedConversations = [...conversations].sort((a, b) => {
    // Agent requested conversations come first
    const aRequested = a.agent_requested_at && !a.agent_mode
    const bRequested = b.agent_requested_at && !b.agent_mode
    if (aRequested && !bRequested) return -1
    if (!aRequested && bRequested) return 1
    
    // Then sort by last message time
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })
  
  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    phone_number: "",
    name: "",
    email: "",
    company: "",
    customer_level_id: "",
    sms_approved: true,
  })

  // Fetch messages when conversation is selected
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/chat/messages?conversationId=${conversationId}`)
      const data = await response.json()
      setMessages(data.messages || [])
      setTripRequests(data.tripRequests || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Check for agent mode timeouts every minute
  useEffect(() => {
    const checkTimeouts = async () => {
      try {
        await fetch('/api/admin/chat/agent-timeout', { method: 'POST' })
        fetchConversations()
      } catch (error) {
        // Silently fail - timeout check is not critical
      }
    }
    
    // Check immediately on mount
    checkTimeouts()
    
    // Then check every minute
    const interval = setInterval(checkTimeouts, 60000)
    return () => clearInterval(interval)
  }, [])

  // Real-time subscriptions
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as Message
          // If this message belongs to the selected conversation, add it
          if (selectedConversation && newMsg.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMsg])
          }
          // Refresh conversations to update last_message_at
          fetchConversations()
        }
      )
      .subscribe()
    
    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel('chat-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        (payload) => {
          // Check if agent was just requested
          const updated = payload.new as Conversation
          const old = payload.old as Conversation | undefined
          
          if (updated.agent_requested_at && !old?.agent_requested_at) {
            // New agent request - trigger notification
            const customerName = conversations.find(c => c.id === updated.id)?.sms_customers?.name
            notifyAgentRequest(customerName || updated.phone_number)
          }
          
          fetchConversations()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(conversationsChannel)
    }
  }, [selectedConversation, conversations, notifyAgentRequest])
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/admin/chat/conversations")
      const data = await response.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return
    
    setIsSending(true)
    try {
      const response = await fetch("/api/admin/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          message: newMessage.trim(),
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setNewMessage("")
        fetchMessages(selectedConversation.id)
      } else {
        alert("Failed to send message: " + data.error)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    }
    setIsSending(false)
  }

  // Add new customer
  const handleAddCustomer = async () => {
    try {
      const response = await fetch("/api/admin/chat/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCustomers([data.customer, ...customers])
        setShowAddCustomer(false)
        setNewCustomer({
          phone_number: "",
          name: "",
          email: "",
          company: "",
          customer_level_id: "",
          sms_approved: true,
        })
      } else {
        alert("Failed to add customer: " + data.error)
      }
    } catch (error) {
      console.error("Error adding customer:", error)
      alert("Failed to add customer")
    }
  }

  // Toggle SMS approval
  const toggleSmsApproval = async (customerId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/admin/chat/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sms_approved: approved }),
      })
      
      if (response.ok) {
        setCustomers(customers.map(c => 
          c.id === customerId ? { ...c, sms_approved: approved } : c
        ))
      }
    } catch (error) {
      console.error("Error updating customer:", error)
    }
  }
  
  // Toggle agent mode for a conversation
  const toggleAgentMode = async (conversationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}/agent-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_mode: enabled }),
      })
      
      if (response.ok) {
        // Update local state
        setConversations(conversations.map(c => 
          c.id === conversationId ? { ...c, agent_mode: enabled } : c
        ))
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation({ ...selectedConversation, agent_mode: enabled })
        }
      }
    } catch (error) {
      console.error("Error toggling agent mode:", error)
    }
  }

  // Filter conversations by search (using sorted list)
  const filteredConversations = sortedConversations.filter(conv => {
    const customer = conv.sms_customers
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.phone_number.includes(searchQuery) ||
      customer?.name?.toLowerCase().includes(searchLower) ||
      customer?.company?.toLowerCase().includes(searchLower)
    )
  })
  
  // Helper to format timeout remaining
  const formatTimeRemaining = (timeoutAt: string) => {
    const remaining = new Date(timeoutAt).getTime() - Date.now()
    if (remaining <= 0) return "Expired"
    const minutes = Math.floor(remaining / 60000)
    if (minutes < 1) return "< 1 min"
    return `${minutes} min`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "pending_response": return "bg-yellow-500"
      case "trip_in_progress": return "bg-blue-500"
      case "completed": return "bg-gray-500"
      default: return "bg-gray-400"
    }
  }

  return (
    <Tabs defaultValue="conversations" className="space-y-4">
      <TabsList>
        <TabsTrigger value="conversations" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Conversations
        </TabsTrigger>
        <TabsTrigger value="customers" className="gap-2">
          <User className="h-4 w-4" />
          SMS Customers
        </TabsTrigger>
        <TabsTrigger value="trips" className="gap-2">
          <MapPin className="h-4 w-4" />
          Trip Requests
        </TabsTrigger>
      </TabsList>

      {/* Conversations Tab */}
      <TabsContent value="conversations" className="space-y-4">
        {/* Notification controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {agentRequestCount > 0 && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <AlertCircle className="h-3 w-3" />
                {agentRequestCount} waiting for agent
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={requestPermission}
            className="gap-2 bg-transparent"
          >
            {notificationsEnabled ? (
              <>
                <Bell className="h-4 w-4 text-green-500" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 text-muted-foreground" />
                Enable Notifications
              </>
            )}
          </Button>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-320px)]">
          {/* Conversation List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations found
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left border-b hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {conv.sms_customers?.name || conv.phone_number}
                            </span>
                            <Badge className={`${getStatusColor(conv.status)} text-white text-xs`}>
                              {conv.status.replace(/_/g, " ")}
                            </Badge>
                            {conv.agent_mode && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <UserCog className="h-3 w-3" />
                                Agent
                              </Badge>
                            )}
                            {conv.agent_requested_at && !conv.agent_mode && (
                              <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
                                <AlertCircle className="h-3 w-3" />
                                Needs Agent
                              </Badge>
                            )}
                          </div>
                          {conv.sms_customers?.company && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.sms_customers.company}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(conv.last_message_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedConversation.sms_customers?.name || selectedConversation.phone_number}
                        {selectedConversation.agent_requested_at && !selectedConversation.agent_mode && (
                          <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            Agent Requested
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedConversation.phone_number}
                        </span>
                        {selectedConversation.sms_customers?.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {selectedConversation.sms_customers.company}
                          </span>
                        )}
                        {selectedConversation.sms_customers?.customer_levels && (
                          <Badge variant="outline">
                            {selectedConversation.sms_customers.customer_levels.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
{/* Agent Mode Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="agent-mode" className="text-sm flex items-center gap-1">
                        {selectedConversation.agent_mode ? (
                          <UserCog className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        )}
                        {selectedConversation.agent_mode ? "Agent Mode" : "AI Mode"}
                      </Label>
                      <Switch
                        id="agent-mode"
                        checked={selectedConversation.agent_mode || false}
                        onCheckedChange={(checked) => toggleAgentMode(selectedConversation.id, checked)}
                      />
                    </div>
                    {/* Timeout indicator */}
                    {selectedConversation.agent_mode && selectedConversation.agent_mode_timeout_at && (
                      <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        Auto-off in {formatTimeRemaining(selectedConversation.agent_mode_timeout_at)}
                      </Badge>
                    )}
                  </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchMessages(selectedConversation.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-[calc(100vh-520px)] p-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No messages yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.direction === "outbound"
                                  ? msg.sender_type === "admin"
                                    ? "bg-blue-500 text-white"
                                    : "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.direction === "outbound" ? "text-white/70" : "text-muted-foreground"
                              }`}>
                                {msg.sender_type === "admin" && "Admin - "}
                                {msg.sender_type === "system" && "Auto - "}
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isSending}
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim()}>
                      {isSending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Trip Requests for Selected Conversation */}
        {selectedConversation && tripRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trip Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tripRequests.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{trip.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{trip.delivery_address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">
                        {trip.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        ${trip.total_price?.toFixed(2)} ({trip.distance_miles?.toFixed(1)} mi)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Customers Tab */}
      <TabsContent value="customers" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">SMS Approved Customers</h2>
          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add SMS Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="1234567890"
                    value={newCustomer.phone_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Customer Level</Label>
                  <Select
                    value={newCustomer.customer_level_id}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, customer_level_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name} ({level.discount_percentage}% off)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="sms-approved"
                    checked={newCustomer.sms_approved}
                    onCheckedChange={(checked) => setNewCustomer({ ...newCustomer, sms_approved: checked })}
                  />
                  <Label htmlFor="sms-approved">SMS Approved</Label>
                </div>
                <Button onClick={handleAddCustomer} className="w-full">
                  Add Customer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Phone</th>
                  <th className="text-left p-4 font-medium">Company</th>
                  <th className="text-left p-4 font-medium">Level</th>
                  <th className="text-center p-4 font-medium">SMS Approved</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{customer.name || "-"}</p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{customer.phone_number}</td>
                    <td className="p-4">{customer.company || "-"}</td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {customer.customer_levels?.name || "Standard"}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Switch
                        checked={customer.sms_approved}
                        onCheckedChange={(checked) => toggleSmsApproval(customer.id, checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Trip Requests Tab */}
      <TabsContent value="trips">
        <TripRequestsTable />
      </TabsContent>
    </Tabs>
  )
}

// Trip Requests Table Component
function TripRequestsTable() {
  const [trips, setTrips] = useState<TripRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch("/api/admin/chat/trips")
        const data = await response.json()
        setTrips(data.trips || [])
      } catch (error) {
        console.error("Error fetching trips:", error)
      }
      setIsLoading(false)
    }
    fetchTrips()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All SMS Trip Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-medium">ID</th>
              <th className="text-left p-4 font-medium">Pickup</th>
              <th className="text-left p-4 font-medium">Delivery</th>
              <th className="text-left p-4 font-medium">Distance</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t">
                <td className="p-4 font-mono text-sm">
                  {trip.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="p-4 text-sm max-w-[200px] truncate">
                  {trip.pickup_address}
                </td>
                <td className="p-4 text-sm max-w-[200px] truncate">
                  {trip.delivery_address}
                </td>
                <td className="p-4">{trip.distance_miles?.toFixed(1)} mi</td>
                <td className="p-4 font-medium">${trip.total_price?.toFixed(2)}</td>
                <td className="p-4">
                  <Badge
                    variant={trip.status === "confirmed" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {trip.status}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(trip.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
