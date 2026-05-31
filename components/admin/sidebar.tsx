"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  Package, 
  LogOut,
  Menu,
  X,
  Truck,
  Users,
  DollarSign,
  MessagesSquare,
  Receipt,
  Settings,
  Map as MapIcon,
  BookOpen,
  Handshake,
  Megaphone
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { User } from "@supabase/supabase-js"

interface AdminProfile {
  id: string
  full_name: string | null
  role: string
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/trips", label: "Trips", icon: Package },
  { href: "/admin/map", label: "Live Map", icon: MapIcon },
  { href: "/admin/chat", label: "SMS Chat", icon: MessagesSquare },
  { href: "/admin/messages", label: "Contact Forms", icon: MessageSquare },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/case-studies", label: "Case Studies", icon: BookOpen },
  { href: "/admin/partners", label: "Partners", icon: Handshake },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/popups", label: "Popups", icon: Megaphone },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/drivers", label: "Drivers", icon: Truck },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/woodelivery", label: "WooDelivery", icon: Truck },
]

export function AdminSidebar({ user, adminProfile }: { user: User; adminProfile: AdminProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <Image
          src="/images/sendy-logo.jpg"
          alt="Sendy Logistics"
          width={120}
          height={48}
          className="h-10 w-auto"
        />
        <p className="text-xs text-muted-foreground mt-2">Admin Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-4 py-2 mb-2">
          <p className="font-medium text-foreground text-sm truncate">{adminProfile.full_name || user.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{adminProfile.role}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-transparent"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transform transition-transform lg:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <NavContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-card border-r border-border">
        <NavContent />
      </aside>
    </>
  )
}
