import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Landing route for Supabase auth emails (confirm signup, email change, etc.).
 *
 * Point the Supabase email templates here, e.g. the "Confirm signup" template:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 * (Also supports the PKCE ?code=... flow.) On success the user is sent to the
 * branded /auth/verified screen; on failure to /auth/auth-error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/verified'

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?type=${type}`)
    }
    return NextResponse.redirect(`${origin}/auth/auth-error?reason=${encodeURIComponent(error.message)}`)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/auth/auth-error?reason=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-error?reason=missing_token`)
}
