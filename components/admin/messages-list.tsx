"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Phone, Building2, Calendar, Trash2, Eye, Archive, Check } from "lucide-react"

interface Message {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  service_type: string | null
  message: string
  status: string
  created_at: string
}

const statusColors: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  read: "bg-blue-100 text-blue-800",
  responded: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
}

export function MessagesList({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [filter, setFilter] = useState<string>("all")

  const filteredMessages = filter === "all" 
    ? messages 
    : messages.filter(m => m.status === filter)

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setMessages(messages.map(m => m.id === id ? { ...m, status } : m))
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status })
      }
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("contact_submissions")
      .delete()
      .eq("id", id)

    if (!error) {
      setMessages(messages.filter(m => m.id !== id))
      setSelectedMessage(null)
    }
  }

  const openMessage = (message: Message) => {
    setSelectedMessage(message)
    if (message.status === "new") {
      updateStatus(message.id, "read")
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "new", "read", "responded", "archived"].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status}
            {status !== "all" && (
              <span className="ml-2 text-xs">
                ({messages.filter(m => m.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Messages List */}
      <Card>
        <CardContent className="p-0">
          {filteredMessages.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => openMessage(message)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{message.name}</p>
                        <Badge className={statusColors[message.status]}>
                          {message.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.email}</p>
                      {message.service_type && (
                        <p className="text-xs text-primary mt-1 capitalize">
                          {message.service_type.replace("_", " ")}
                        </p>
                      )}
                      <p className="text-sm text-foreground mt-2 line-clamp-2">{message.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No messages found</p>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedMessage.name}
                  <Badge className={statusColors[selectedMessage.status]}>
                    {selectedMessage.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedMessage.phone}`} className="text-primary hover:underline">
                        {selectedMessage.phone}
                      </a>
                    </div>
                  )}
                  {selectedMessage.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {selectedMessage.company}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </div>
                </div>

                {selectedMessage.service_type && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Service Interest</p>
                    <p className="text-sm font-medium capitalize">{selectedMessage.service_type.replace("_", " ")}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(selectedMessage.id, "responded")}
                    disabled={selectedMessage.status === "responded"}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Responded
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(selectedMessage.id, "archived")}
                    disabled={selectedMessage.status === "archived"}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMessage(selectedMessage.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
