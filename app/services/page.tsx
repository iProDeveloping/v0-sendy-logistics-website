import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Building2, ShoppingCart, Pill, Cake, CalendarDays, Bike, RotateCcw, Package } from "lucide-react"

export const metadata = {
  title: "Delivery Services NYC & NJ - Corporate, Pharmacy, Retail",
  description: "Same-day delivery services in NYC & NJ. Corporate delivery solutions, pharmacy logistics, retail last-mile, grocery delivery, and returns management. Save 40% on delivery costs.",
  alternates: {
    canonical: 'https://sendylogistics.com/services',
  },
  openGraph: {
    title: "Delivery Services - Sendy Logistics NYC & NJ",
    description: "Corporate delivery, pharmacy logistics, retail last-mile, and more. Same-day service, real-time tracking.",
    url: 'https://sendylogistics.com/services',
  },
}

const serviceIcons: Record<string, typeof Building2> = {
  corporate: Building2,
  grocery: ShoppingCart,
  pharmacy: Pill,
  bakery: Cake,
  seasonal: CalendarDays,
  messenger: Bike,
  returns: RotateCcw,
}

const services = [
  {
    id: "corporate",
    title: "Corporate Delivery",
    description: "Reliable delivery solutions for businesses of all sizes. We partner with groceries, pharmacies, bakeries, and more to handle their last-mile logistics.",
    features: ["Dedicated account manager", "Custom delivery schedules", "Real-time tracking portal", "Volume discounts"],
    icon: Building2,
  },
  {
    id: "grocery",
    title: "Grocery Delivery",
    description: "Temperature-controlled delivery for grocery stores. We ensure fresh products reach customers in perfect condition.",
    features: ["Temperature monitoring", "Same-day delivery", "Careful handling", "Flexible scheduling"],
    icon: ShoppingCart,
  },
  {
    id: "pharmacy",
    title: "Pharmacy Logistics",
    description: "Secure and compliant delivery for pharmacies. HIPAA-compliant processes ensure patient privacy and medication safety.",
    features: ["Secure handling", "Privacy compliant", "Timely delivery", "Signature confirmation"],
    icon: Pill,
  },
  {
    id: "bakery",
    title: "Bakery Delivery",
    description: "Gentle handling for delicate baked goods. We treat every cake and pastry with the care it deserves.",
    features: ["Gentle handling", "Temperature control", "On-time delivery", "Special occasions"],
    icon: Cake,
  },
  {
    id: "seasonal",
    title: "Seasonal Deliveries",
    description: "Scale up during peak seasons with our flexible delivery network. Perfect for holiday rushes and special events.",
    features: ["Flexible capacity", "Holiday coverage", "Event logistics", "Surge support"],
    icon: CalendarDays,
  },
  {
    id: "messenger",
    title: "Local Messenger",
    description: "Same-day person-to-person delivery for urgent packages within your city. Fast, reliable, and affordable.",
    features: ["Same-day delivery", "Real-time tracking", "Proof of delivery", "Affordable rates"],
    icon: Bike,
  },
  {
    id: "returns",
    title: "Returns Management",
    description: "Easy returns with multiple options. We pick up from your location, accept drop-offs, and handle label printing.",
    features: ["Home pickup", "Drop-off centers", "Free label printing", "Easy scheduling"],
    icon: RotateCcw,
  },
]

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: pageContent } = await supabase
    .from("cms_content")
    .select("*")
    .eq("page_slug", "services")
    .single()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Our Services
          </h1>
          <p className="text-xl text-primary font-semibold mb-4">
            Comprehensive Delivery Solutions
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From corporate logistics to local messenger services, we have the perfect delivery solution for your needs.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-16">
            {services.map((service, index) => {
              const Icon = service.icon
              const isEven = index % 2 === 0
              
              return (
                <div
                  key={service.id}
                  id={service.id}
                  className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center scroll-mt-24`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                        {service.title}
                      </h2>
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="grid grid-cols-2 gap-3">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                          <Package className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`flex-1 w-full max-w-md ${isEven ? 'md:order-last' : 'md:order-first'}`}>
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                      <Icon className="w-24 h-24 text-primary/60" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Need a Custom Solution?</h2>
          <p className="text-muted-foreground mb-8">Contact us to discuss your specific delivery requirements.</p>
          <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors">
            Get a Quote
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
