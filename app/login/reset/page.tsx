"use client"

import React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const supabase = createClient()
      
      // Check for code in URL (PKCE flow)
      const code = searchParams.get("code")
      
      if (code) {
        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          setError("Invalid or expired reset link. Please request a new one.")
          setLoading(false)
          return
        }
        
        setSessionReady(true)
        setLoading(false)
        return
      }
      
      // Check for access_token in hash (implicit flow - legacy)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token")
      
      if (accessToken) {
        setSessionReady(true)
        setLoading(false)
        return
      }
      
      // Check if user already has a session (came from email link)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setSessionReady(true)
        setLoading(false)
        return
      }
      
      setError("Invalid or expired reset link. Please request a new one.")
      setLoading(false)
    }
    
    exchangeCodeForSession()
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/login")
    }, 3000)
  }

  if (success) {
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
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Password Reset!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. You will be redirected to login shortly.
            </p>
            <Link href="/login">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Image
            src="/images/sendy-logo.jpg"
            alt="Sendy Logistics"
            width={150}
            height={60}
            className="mx-auto mb-8"
          />
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Show error if link is invalid
  if (error && !sessionReady) {
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
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Link Expired</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/login">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Request New Link
              </Button>
            </Link>
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
          <h1 className="font-serif text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
