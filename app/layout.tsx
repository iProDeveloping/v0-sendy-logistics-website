import React from "react"
import type { Metadata } from 'next'
import { Nunito, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { OrganizationJsonLd, WebsiteJsonLd, FAQJsonLd } from '@/components/seo/json-ld'
import { SitePopup } from '@/components/site-popup'
import './globals.css'

// Using Nunito as a similar alternative to Gliker (rounded, friendly display font)
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-gliker',
  display: 'swap',
})

// Using DM Sans as a similar alternative to GT Walsheim Pro (clean, geometric sans)
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-gt-walsheim',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Sendy Logistics - Same Day Delivery NYC & NJ | The Company That Delivers',
    template: '%s | Sendy Logistics'
  },
  description: 'Same-day delivery services in NYC, New Jersey & surrounding areas. Corporate deliveries, pharmacy delivery, retail logistics, and local messenger services. Text to ship. Track in real-time. Save 40% vs in-house delivery.',
  metadataBase: new URL('https://sendylogistics.com'),
  applicationName: 'Sendy Logistics',
  authors: [{ name: 'Sendy Logistics', url: 'https://sendylogistics.com' }],
  creator: 'Sendy Logistics',
  publisher: 'Sendy Logistics',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  keywords: [
    'same day delivery NYC',
    'delivery service New York',
    'courier service NYC',
    'local delivery NJ',
    'pharmacy delivery service',
    'business delivery solutions',
    'corporate courier NYC',
    'last mile delivery',
    'on demand delivery',
    'package delivery Brooklyn',
    'delivery service Manhattan',
    'Queens delivery service',
    'Jersey City courier',
    'Hoboken delivery',
    'retail delivery partner',
    'medical delivery service',
    'text to ship',
    'real time tracking delivery'
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Sendy Logistics - Same Day Delivery NYC & NJ',
    description: 'Professional same-day delivery services. Text to ship, real-time tracking, 40% cost savings. Serving NYC, Brooklyn, Queens, Manhattan, Jersey City & more.',
    url: 'https://sendylogistics.com',
    siteName: 'Sendy Logistics',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Sendy Logistics - Same Day Delivery Services NYC & NJ',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sendy Logistics - Same Day Delivery NYC & NJ',
    description: 'Same-day delivery services. Text to ship, real-time tracking. Serving NYC & NJ.',
    images: ['/og-default.jpg'],
    site: '@sendylogistics',
    creator: '@sendylogistics',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://sendylogistics.com',
  },
  category: 'business',
  verification: {
    google: 'your-google-verification-code',
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <FAQJsonLd />
      </head>
      <body className={`${nunito.variable} ${dmSans.variable} font-sans antialiased`}>
        {children}
        <SitePopup />
        <Analytics />
      </body>
    </html>
  )
}
