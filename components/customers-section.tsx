import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, MapPin, Wallet, ArrowRight } from "lucide-react"

const customerFeatures = [
  {
    icon: Bell,
    title: "Real-time Updates",
    description: "Know exactly when your package is arriving with instant notifications and updates.",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    description: "Follow your delivery in real-time on the map. See exactly where your package is.",
  },
  {
    icon: Wallet,
    title: "Best Rates",
    description: "Affordable delivery options for everyone. Send packages without breaking the bank.",
  },
]

export function CustomersSection() {
  return (
    <section id="customers" className="py-24 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <p className="text-primary font-semibold uppercase tracking-wide mb-4">For Customers</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
                Delivery Made Simple
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Need to send a package to a friend? Return an online purchase? Sendy makes it easy with our 
                local messenger service designed for individuals.
              </p>
            </div>

            <div className="space-y-6">
              {customerFeatures.map((feature) => (
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
                Send a Package
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Image */}
          <div className="relative">
            <Image
              src="/images/returns-ad.jpg"
              alt="Sendy makes returns easy - Customer delivery services"
              width={600}
              height={800}
              className="rounded-2xl shadow-xl w-full max-h-[600px] object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
