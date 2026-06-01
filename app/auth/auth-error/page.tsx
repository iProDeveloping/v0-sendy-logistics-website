import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Verification Problem',
  robots: { index: false, follow: false },
}

function friendlyReason(reason?: string): string {
  if (!reason) return 'This verification link is invalid or has already been used.'
  const r = reason.toLowerCase()
  if (r.includes('expired')) return 'This verification link has expired. Links are valid for a limited time.'
  if (r.includes('missing')) return 'This link is missing its verification token.'
  if (r.includes('used') || r.includes('already')) return 'This link has already been used.'
  return 'We couldn’t verify this link. It may have expired or already been used.'
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] bg-card shadow-xl p-8 sm:p-10 text-center">
        <div className="relative mx-auto mb-6 h-32 w-32">
          <div className="h-32 w-32 overflow-hidden rounded-full bg-secondary ring-4 ring-secondary">
            <Image
              src="/images/sendy-mascot.jpg"
              alt="Sendy mascot"
              width={128}
              height={128}
              className="h-full w-full object-cover opacity-90"
              priority
            />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-md">
            <AlertTriangle className="h-7 w-7 text-destructive" strokeWidth={2.25} />
          </div>
        </div>

        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground">
          Link didn’t work
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{friendlyReason(reason)}</p>

        <div className="mt-8 space-y-3">
          <Button asChild size="lg" className="w-full rounded-full text-base font-semibold">
            <a href="sendy://">
              <RefreshCw className="mr-1 h-4 w-4" />
              Open the app & resend
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-full text-base font-semibold">
            <Link href="/contact">Contact support</Link>
          </Button>
          <Link
            href="/"
            className="inline-block pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Back to homepage
          </Link>
        </div>

        <p className="mt-8 font-serif text-lg font-extrabold text-primary">Sendy</p>
        <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70">Logistics</p>
      </div>
    </main>
  )
}
