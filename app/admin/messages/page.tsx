import { createClient } from "@/lib/supabase/server"
import { MessagesList } from "@/components/admin/messages-list"

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Manage contact form submissions</p>
      </div>

      <MessagesList initialMessages={messages || []} />
    </div>
  )
}
