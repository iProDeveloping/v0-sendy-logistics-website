import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us - Get a Quote | Sendy Logistics NYC & NJ",
  description: "Contact Sendy Logistics for same-day delivery services in NYC & NJ. Call 845-SENDY-GO, text us, or fill out our form for a free quote. Response within 1 hour.",
  alternates: {
    canonical: 'https://sendylogistics.com/contact',
  },
  openGraph: {
    title: "Contact Sendy Logistics - Get a Free Quote",
    description: "Contact us for same-day delivery services. Call 845-SENDY-GO or fill out our form. Free quotes, fast response.",
    url: 'https://sendylogistics.com/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
