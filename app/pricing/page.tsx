import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Check, Building2, Users, Zap } from "lucide-react"

export const metadata = {
  title: "Delivery Pricing NYC & NJ - Transparent Rates Starting at $8",
  description: "Affordable same-day delivery pricing. Local messenger from $8, business packages from $6/delivery, enterprise custom rates. No hidden fees, volume discounts up to 40%.",
  alternates: {
    canonical: 'https://sendylogistics.com/pricing',
  },
  openGraph: {
    title: "Delivery Pricing - Sendy Logistics NYC & NJ",
    description: "Transparent pricing starting at $8. Volume discounts available for businesses. No hidden fees.",
    url: 'https://sendylogistics.com/pricing',
  },
}

const pricingTiers = [
  {
    name: "Local Messenger",
    description: "Perfect for individual deliveries",
    priceNote: "Starting at",
    price: "$8",
    unit: "per delivery",
    features: [
      "Same-day delivery",
      "Real-time tracking",
      "Proof of delivery",
      "SMS notifications",
      "Up to 10 lbs",
    ],
    cta: "Get Started",
    popular: false,
    icon: Zap,
  },
  {
    name: "Business",
    description: "For growing businesses",
    priceNote: "Custom pricing",
    price: "Contact Us",
    unit: "for a quote",
    features: [
      "All Local Messenger features",
      "Volume discounts",
      "Dedicated support",
      "Business portal access",
      "Weekly invoicing",
      "Priority scheduling",
    ],
    cta: "Contact Sales",
    popular: true,
    icon: Users,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    priceNote: "Custom pricing",
    price: "Let's Talk",
    unit: "tailored solutions",
    features: [
      "All Business features",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "SLA guarantees",
      "White-label options",
      "24/7 support",
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Building2,
  },
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: pageContent } = await supabase
    .from("cms_content")
    .select("*")
    .eq("page_slug", "pricing")
    .single()

  const content = pageContent?.content || {}

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {content.hero_title || "Simple, Transparent Pricing"}
          </h1>
          <p className="text-xl text-primary font-semibold mb-4">
            {content.hero_subtitle || "No Hidden Fees"}
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.intro || "We believe in honest pricing. Get a quote tailored to your specific needs."}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon
              return (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl p-8 ${
                    tier.popular
                      ? "bg-primary text-primary-foreground ring-2 ring-primary"
                      : "bg-card border border-border"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`w-6 h-6 ${tier.popular ? "text-primary-foreground" : "text-primary"}`} />
                    <h3 className="font-serif text-xl font-bold">{tier.name}</h3>
                  </div>
                  <p className={`text-sm mb-6 ${tier.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {tier.description}
                  </p>
                  <div className="mb-6">
                    <p className={`text-xs ${tier.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {tier.priceNote}
                    </p>
                    <p className="text-3xl font-bold">{tier.price}</p>
                    <p className={`text-sm ${tier.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {tier.unit}
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.popular ? "text-primary-foreground" : "text-primary"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/contact"
                    className={`block w-full text-center py-3 rounded-full font-semibold transition-colors ${
                      tier.popular
                        ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
            Included with Every Delivery
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(content.features || [
              "Volume discounts for businesses",
              "Subscription plans available",
              "No surge pricing",
              "Free tracking on all packages"
            ]).map((feature: string) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Need a Custom Quote?</h2>
          <p className="text-muted-foreground mb-8">
            {content.pricing_note || "Pricing varies based on distance, package size, and delivery speed. Contact us for a custom quote."}
          </p>
          <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors">
            Request a Quote
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
