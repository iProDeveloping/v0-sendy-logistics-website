import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Allow login page without auth
  // The middleware handles redirect to login
  
  if (!user) {
    return <>{children}</>
  }

  // Check if user is admin
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!adminProfile) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar user={user} adminProfile={adminProfile} />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
