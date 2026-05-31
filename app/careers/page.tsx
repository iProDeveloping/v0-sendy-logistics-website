import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Check, Briefcase, Clock, TrendingUp, Heart, MapPin } from "lucide-react"
import Image from "next/image"

export const metadata = {
  title: "Delivery Driver Jobs NYC & NJ - Join Sendy Logistics",
  description: "Join Sendy Logistics! We're hiring delivery drivers, operations coordinators, and customer service reps in NYC and NJ. Flexible hours, competitive pay, growth opportunities.",
  alternates: {
    canonical: 'https://sendylogistics.com/careers',
  },
  openGraph: {
    title: "Careers at Sendy Logistics - Join Our Team",
    description: "We're hiring! Delivery drivers, operations coordinators, and more. Flexible hours and competitive pay.",
    url: 'https://sendylogistics.com/careers',
  },
}

const positions = [
  {
    title: "Delivery Driver",
    type: "Full-time / Part-time",
    location: "Various Locations",
    description: "Join our fleet of professional drivers. Flexible hours, competitive pay, and growth opportunities.",
  },
  {
    title: "Operations Coordinator",
    type: "Full-time",
    location: "Main Office",
    description: "Help manage our logistics network. Coordinate deliveries, optimize routes, and ensure smooth operations.",
  },
  {
    title: "Customer Service Representative",
    type: "Full-time",
    location: "Main Office / Remote",
    description: "Be the voice of Sendy for our customers. Handle inquiries, resolve issues, and deliver excellent service.",
  },
  {
    title: "Warehouse Associate",
    type: "Full-time",
    location: "Distribution Center",
    description: "Sort, organize, and prepare packages for delivery. Physical role with opportunities for advancement.",
  },
]

const benefits = [
  { icon: TrendingUp, title: "Competitive Pay", description: "Above-market wages with performance bonuses" },
  { icon: Clock, title: "Flexible Hours", description: "Choose schedules that work for your life" },
  { icon: Heart, title: "Health Benefits", description: "Medical, dental, and vision coverage" },
  { icon: Briefcase, title: "Growth Opportunities", description: "Clear paths for career advancement" },
]

export default async function CareersPage() {
  const supabase = await createClient()
  const { data: pageContent } = await supabase
    .from("cms_content")
    .select("*")
    .eq("page_slug", "careers")
    .single()

  const content = pageContent?.content || {}

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {content.hero_title || "Join Our Team"}
          </h1>
          <p className="text-xl text-primary font-semibold mb-4">
            {content.hero_subtitle || "Build Your Career with Sendy"}
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.intro || "We're always looking for dedicated individuals to join our growing team."}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">Why Work at Sendy?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="text-center p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((position) => (
              <div key={position.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{position.description}</p>
                  </div>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Culture</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                At Sendy, we believe in creating a workplace where everyone can thrive. Our team is diverse, supportive, and passionate about delivering excellence.
              </p>
              <ul className="space-y-3">
                {(content.benefits || [
                  "Competitive pay",
                  "Flexible hours",
                  "Growth opportunities",
                  "Great team culture"
                ]).map((benefit: string) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Image
                src="/images/sendy-mascot.jpg"
                alt="Sendy Team"
                width={400}
                height={400}
                className="rounded-2xl mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Don't See the Right Fit?</h2>
          <p className="text-muted-foreground mb-8">
            We're always interested in hearing from talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors">
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
