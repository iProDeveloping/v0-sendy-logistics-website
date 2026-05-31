import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, FileText, HelpCircle, Package, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch counts for dashboard
  const [
    { count: messagesCount },
    { count: newMessagesCount },
    { count: pagesCount },
    { count: faqsCount },
    { count: packagesCount },
  ] = await Promise.all([
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("cms_content").select("*", { count: "exact", head: true }),
    supabase.from("faqs").select("*", { count: "exact", head: true }),
    supabase.from("packages").select("*", { count: "exact", head: true }),
  ])

  // Fetch recent messages
  const { data: recentMessages } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      title: "Total Messages",
      value: messagesCount || 0,
      subtitle: `${newMessagesCount || 0} new`,
      icon: MessageSquare,
      href: "/admin/messages",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "CMS Pages",
      value: pagesCount || 0,
      subtitle: "Managed",
      icon: FileText,
      href: "/admin/pages",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "FAQs",
      value: faqsCount || 0,
      subtitle: "Published",
      icon: HelpCircle,
      href: "/admin/faqs",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Packages",
      value: packagesCount || 0,
      subtitle: "Tracked",
      icon: Package,
      href: "/admin/packages",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the Sendy Logistics admin portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Messages</CardTitle>
          <Link href="/admin/messages" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentMessages && recentMessages.length > 0 ? (
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">{message.name}</p>
                      {message.status === "new" && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{message.email}</p>
                    <p className="text-sm text-foreground mt-1 line-clamp-1">{message.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No messages yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
