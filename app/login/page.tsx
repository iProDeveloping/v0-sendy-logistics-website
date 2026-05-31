"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type ViewMode = "login" | "forgot" | "reset-sent"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("login")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if user has admin profile
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", data.user?.id)
      .single()

    if (adminProfile) {
      // Admin user - redirect to admin dashboard
      router.push("/admin")
      router.refresh()
      return
    }

    // Regular user - could redirect to customer portal or home
    // For now, redirect to home since we don't have a customer portal
    router.push("/")
    router.refresh()
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email) {
      setError("Please enter your email address")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Use NEXT_PUBLIC_SITE_URL if set, otherwise fall back to VERCEL_URL or window.location
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null)
      || window.location.origin

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/login/reset`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setViewMode("reset-sent")
    setLoading(false)
  }

  if (viewMode === "reset-sent") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image
              src="/images/sendy-logo.jpg"
              alt="Sendy Logistics"
              width={150}
              height={60}
              className="mx-auto mb-4"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              We sent a password reset link to <strong className="text-foreground">{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
            <Button
              variant="outline"
              onClick={() => setViewMode("login")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/sendy-logo.jpg"
            alt="Sendy Logistics"
            width={150}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {viewMode === "login" ? "Welcome Back" : "Reset Password"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {viewMode === "login" 
              ? "Sign in to your Sendy account" 
              : "Enter your email to receive a reset link"
            }
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {viewMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setViewMode("forgot")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setViewMode("login")
                  setError(null)
                }}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Back to Sendy Logistics
          </Link>
        </p>
      </div>
    </div>
  )
}
