import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Your Delivery - Real-Time GPS Tracking",
  description: "Track your Sendy delivery in real-time. Live GPS driver location, estimated arrival time, delivery status updates. Enter your order number to track.",
  alternates: {
    canonical: 'https://sendylogistics.com/track',
  },
  openGraph: {
    title: "Track Your Delivery - Sendy Logistics",
    description: "Track your Sendy delivery in real-time with live GPS driver location and status updates.",
    url: "https://sendylogistics.com/track",
    siteName: "Sendy Logistics",
    images: [
      {
        url: "/og-track.jpg",
        width: 1200,
        height: 630,
        alt: "Sendy Logistics - Real-Time Package Tracking",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Delivery - Sendy Logistics",
    description: "Track your Sendy delivery in real-time with live GPS driver location and status updates.",
    images: ["/og-track.jpg"],
  },
}

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
