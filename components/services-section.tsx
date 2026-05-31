import { Building2, ShoppingCart, Pill, Cake, Users, Calendar } from "lucide-react"

const services = [
  {
    icon: Building2,
    title: "Corporate Deliveries",
    description: "Reliable logistics solutions for large corporations. We handle your distribution needs with precision and care.",
    features: ["Scheduled routes", "Volume discounts", "Dedicated account manager"],
  },
  {
    icon: ShoppingCart,
    title: "Grocery Delivery",
    description: "Partner with supermarkets and grocery chains to deliver fresh products directly to customers' doors.",
    features: ["Temperature controlled", "Same-day delivery", "Real-time tracking"],
  },
  {
    icon: Pill,
    title: "Pharmacy Logistics",
    description: "Secure and compliant delivery services for pharmacies, ensuring medications reach patients safely.",
    features: ["HIPAA compliant", "Secure handling", "Priority delivery"],
  },
  {
    icon: Cake,
    title: "Bakery & Food Service",
    description: "Specialized delivery for bakeries and food businesses with time-sensitive products.",
    features: ["Early morning delivery", "Careful handling", "Flexible scheduling"],
  },
  {
    icon: Calendar,
    title: "Seasonal Deliveries",
    description: "Scale up for the holidays and peak seasons. We handle the rush so you can focus on your business.",
    features: ["Holiday capacity", "Flexible staffing", "Surge support"],
  },
  {
    icon: Users,
    title: "Local Messenger",
    description: "Person-to-person delivery service for individuals. Send packages locally with ease and speed.",
    features: ["On-demand pickup", "Door-to-door", "Affordable rates"],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary font-semibold uppercase tracking-wide mb-4">Our Services</p>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            Unboxing a New Era of Delivery
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We handle deliveries, distribution, logistics, special items—and everything in between. 
            Whatever your business needs, Sendy delivers.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 rounded-2xl bg-background border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
