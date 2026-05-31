'use client';

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Monitor, DollarSign, Shield, ArrowRight } from "lucide-react"

const businessFeatures = [
  {
    icon: Monitor,
    title: "Online Portal",
    description: "Manage all your deliveries from our easy-to-use business portal. Schedule, track, and analyze your logistics.",
  },
  {
    icon: DollarSign,
    title: "Unbeatable Pricing",
    description: "Competitive rates with volume discounts. No hidden fees, just transparent pricing that works for your business.",
  },
  {
    icon: Shield,
    title: "Reliable Solutions",
    description: "Consistent, dependable delivery service you can count on. Your packages arrive on time, every time.",
  },
]

export function BusinessSection() {
  return (
    <section id="business" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <style jsx>{`
              @keyframes swing {
                0%, 100% { transform: rotate(-3deg); }
                50% { transform: rotate(3deg); }
              }
            `}</style>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sandy_-_Container_Mockup-removebg-preview-f7DxNpd6ceonZ3ZHOuBuZs5PX3V7ce.png"
              alt="Sendy Logistics Container - Corporate Delivery Solutions"
              width={600}
              height={400}
              className="rounded-2xl w-full origin-top"
              style={{ animation: 'swing 3s ease-in-out infinite' }}
            />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <p className="text-primary font-semibold uppercase tracking-wide mb-4">For Businesses</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
                Scale Your Delivery Operations
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're a small bakery or a large grocery chain, Sendy provides the logistics infrastructure 
                you need to keep your customers happy.
              </p>
            </div>

            <div className="space-y-6">
              {businessFeatures.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
            >
              <Link href="/contact">
                Partner With Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
