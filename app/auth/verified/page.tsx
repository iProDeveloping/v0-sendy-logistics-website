import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { CheckCircle2, ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Email Verified',
  robots: { index: false, follow: false },
}

const COPY: Record<string, { title: string; body: string }> = {
  signup: { title: 'Email verified!', body: "Your Sendy account is confirmed — you're all set to start sending." },
  email: { title: 'Email verified!', body: "Your Sendy account is confirmed — you're all set to start sending." },
  email_change: { title: 'Email updated!', body: 'Your new email address has been confirmed.' },
  recovery: { title: 'Identity confirmed', body: 'You can now set a new password in the Sendy app.' },
  default: { title: "You're verified!", body: 'Your email has been confirmed. Welcome to Sendy.' },
}

export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const copy = COPY[type ?? 'default'] ?? COPY.default

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] bg-card shadow-xl p-8 sm:p-10 text-center">
        {/* Mascot in a sage circle (the mascot art is already on a sage background) */}
        <div className="relative mx-auto mb-6 h-32 w-32">
          <div className="h-32 w-32 overflow-hidden rounded-full bg-secondary ring-4 ring-secondary">
            <Image
              src="/images/sendy-mascot.jpg"
              alt="Sendy mascot"
              width={128}
              height={128}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-md">
            <CheckCircle2 className="h-9 w-9 text-primary" strokeWidth={2.25} />
          </div>
        </div>

        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground">{copy.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{copy.body}</p>

        <div className="mt-8 space-y-3">
          <Button asChild size="lg" className="w-full rounded-full text-base font-semibold">
            <a href="sendy://">
              Open the Sendy app
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-full text-base font-semibold">
            <Link href="/track">
              <Package className="mr-1 h-4 w-4" />
              Track a package
            </Link>
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
