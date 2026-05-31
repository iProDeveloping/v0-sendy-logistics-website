import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

export const metadata = {
  title: "About Sendy Logistics - NYC & NJ Delivery Company",
  description: "Sendy Logistics is a same-day delivery company serving NYC and New Jersey. Learn about our mission to provide reliable, affordable last-mile delivery solutions for businesses.",
  alternates: {
    canonical: 'https://sendylogistics.com/about',
  },
  openGraph: {
    title: "About Sendy Logistics - Your Delivery Partner",
    description: "Learn about our mission to provide reliable, affordable delivery solutions for businesses in NYC & NJ.",
    url: 'https://sendylogistics.com/about',
  },
}

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: pageContent } = await supabase
    .from("cms_content")
    .select("*")
    .eq("page_slug", "about")
    .single()

  const content = pageContent?.content || {}

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {content.hero_title || "About Sendy Logistics"}
          </h1>
          <p className="text-xl text-primary font-semibold mb-4">
            {content.hero_subtitle || "The Company That Delivers"}
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.intro || "Sendy Logistics is your trusted partner for all delivery needs."}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {content.mission || "Our mission is to provide reliable, efficient, and affordable delivery solutions for businesses and individuals alike."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {content.team_intro || "Our team of dedicated professionals ensures your packages arrive safely and on time, every time."}
              </p>
            </div>
            <div className="relative">
              <Image
                src="/images/container-mockup.png"
                alt="Sendy Logistics Container"
                width={500}
                height={400}
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(content.values || ["Reliability", "Speed", "Customer Service", "Innovation"]).map((value: string) => (
              <div key={value} className="bg-card p-6 rounded-xl border border-border">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground">{value}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 mb-8">Contact us today and discover how Sendy can transform your delivery operations.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-card text-foreground font-semibold rounded-full hover:bg-card/90 transition-colors">
              Contact Us
            </a>
            <a href="tel:845-736-3946" className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-full hover:bg-primary-foreground/10 transition-colors">
              845.Sendy-Go
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
