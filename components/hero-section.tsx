import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Truck, Clock } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-20 overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-balance">
                <span className="text-foreground">Send</span>{" "}
                <span className="text-foreground">everything</span>
                <br />
                <span className="text-foreground">with</span>{" "}
                <span className="text-primary">Sendy.</span>
              </h1>
              <p className="text-lg sm:text-xl text-foreground/80 max-w-xl leading-relaxed">
                For businesses without a delivery system—or those that need a fix—and for customers who expect more,{" "}
                <strong className="text-foreground">Sendy Logistics always delivers.</strong>
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">10K+</p>
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">50+</p>
                  <p className="text-sm text-muted-foreground">Vehicles</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">24/7</p>
                  <p className="text-sm text-muted-foreground">Support</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg"
              >
                <Link href="/contact">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-foreground/20 hover:bg-foreground/5 text-foreground font-semibold px-8 py-6 text-lg bg-transparent"
              >
                <Link href="/services">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <Image
              src="/images/hero-ad.jpg"
              alt="Send everything with Sendy - Delivery services"
              width={600}
              height={800}
              className="rounded-3xl shadow-2xl object-cover max-h-[600px] w-auto"
              priority
            />
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-sendy-green/30 rounded-full blur-3xl" />
    </section>
  )
}
