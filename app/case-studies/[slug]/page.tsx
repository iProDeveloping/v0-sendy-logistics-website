import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, TrendingDown, CheckCircle2, DollarSign, Clock, Truck, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

// Generate dynamic metadata for social sharing
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: caseStudy } = await supabase
    .from("case_studies")
    .select("title, subtitle, description, meta_title, meta_description, hero_image_url")
    .eq("slug", slug)
    .eq("published", true)
    .single()
  
  if (!caseStudy) {
    return {
      title: "Case Study Not Found - Sendy Logistics",
    }
  }
  
  const title = caseStudy.meta_title || `${caseStudy.title} - Sendy Logistics Case Study`
  const description = caseStudy.meta_description || caseStudy.description
  const imageUrl = caseStudy.hero_image_url || "https://sendylogistics.com/og-case-study.jpg"
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://sendylogistics.com/case-studies/${slug}`,
      siteName: "Sendy Logistics",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${caseStudy.title} - Sendy Logistics Case Study`,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

interface CaseStudy {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string
  category: string
  featured: boolean
  published: boolean
  stats: Array<{ value: string; label: string }>
  content: string | null
  created_at: string
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: caseStudy, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (error || !caseStudy) {
    notFound()
  }

  // Get next/prev case studies for navigation
  const { data: allCaseStudies } = await supabase
    .from("case_studies")
    .select("slug, title")
    .eq("published", true)
    .order("sort_order")

  const currentIndex = allCaseStudies?.findIndex(cs => cs.slug === slug) ?? -1
  const prevStudy = currentIndex > 0 ? allCaseStudies?.[currentIndex - 1] : null
  const nextStudy = currentIndex < (allCaseStudies?.length ?? 0) - 1 ? allCaseStudies?.[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#1a1a1a] text-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <Link 
            href="/case-studies"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Case Studies
          </Link>
          
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">
            {caseStudy.category}
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance">
            {caseStudy.title}
          </h1>
          
          {caseStudy.subtitle && (
            <p className="text-xl md:text-2xl text-white/70 mb-8">
              {caseStudy.subtitle}
            </p>
          )}
          
          <p className="text-lg text-white/80 max-w-3xl">
            {caseStudy.description}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      {caseStudy.stats && caseStudy.stats.length > 0 && (
        <section className="py-12 bg-primary/5 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {caseStudy.stats.map((stat: { value: string; label: string }, index: number) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {caseStudy.content ? (
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: caseStudy.content }}
              />
            ) : (
              // Default content for case studies without custom content
              <CaseStudyDefaultContent caseStudy={caseStudy} />
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1a1a1a] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Delivery Operations?
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Join businesses across industries that have achieved significant cost savings and improved customer satisfaction with Sendy Logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/contact">Get a Custom Quote</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {prevStudy ? (
              <Link 
                href={`/case-studies/${prevStudy.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{prevStudy.title}</span>
                <span className="sm:hidden">Previous</span>
              </Link>
            ) : (
              <div />
            )}
            
            {nextStudy ? (
              <Link 
                href={`/case-studies/${nextStudy.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="hidden sm:inline">{nextStudy.title}</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function CaseStudyDefaultContent({ caseStudy }: { caseStudy: CaseStudy }) {
  // Generate default content based on the case study type
  if (caseStudy.slug === 'fleet-ownership-costs') {
    return <FleetOwnershipContent />
  }
  
  if (caseStudy.slug === 'pharmacy-chain-success') {
    return <PharmacyChainContent />
  }
  
  if (caseStudy.slug === 'grocery-delivery-transformation') {
    return <GroceryDeliveryContent />
  }
  
  // Generic fallback content
  return (
    <div className="space-y-8">
      <div className="bg-muted/50 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">The Challenge</h2>
        <p className="text-muted-foreground">
          {caseStudy.description}
        </p>
      </div>
      
      <div className="bg-primary/5 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">The Solution</h2>
        <p className="text-muted-foreground">
          By partnering with Sendy Logistics, this organization was able to transform their delivery operations
          and achieve significant improvements in efficiency and cost savings.
        </p>
      </div>
      
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground mb-4">
          Want to learn more about how we achieved these results?
        </p>
        <Button asChild>
          <Link href="/contact">Contact Us for Details</Link>
        </Button>
      </div>
    </div>
  )
}

function FleetOwnershipContent() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">The Hidden Costs of Fleet Ownership</h2>
        <p className="text-muted-foreground mb-6">
          Many retailers underestimate the true cost of maintaining an in-house delivery fleet. 
          Our comprehensive analysis reveals that the total cost of ownership extends far beyond 
          vehicle purchases and fuel expenses.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: DollarSign, title: "Vehicle Depreciation", value: "$12,000-18,000/year", desc: "New vehicles lose 15-25% value annually" },
            { icon: Truck, title: "Maintenance & Repairs", value: "$8,000-15,000/year", desc: "Routine maintenance plus unexpected repairs" },
            { icon: Users, title: "Driver Costs", value: "$45,000-65,000/year", desc: "Salary, benefits, training, and turnover" },
            { icon: Clock, title: "Downtime Losses", value: "$5,000-10,000/year", desc: "Lost revenue during vehicle repairs" },
          ].map((item, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-6">
              <item.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-2xl font-bold text-primary mb-2">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] text-white rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <TrendingDown className="h-8 w-8 text-primary" />
          The Sendy Advantage
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">$53.08</p>
            <p className="text-white/70">Avg. Cost Per Delivery (In-House)</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-400 mb-2">$28.00</p>
            <p className="text-white/70">Avg. Cost Per Delivery (Sendy)</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary mb-2">47%</p>
            <p className="text-white/70">Average Savings</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Key Findings</h2>
        <ul className="space-y-4">
          {[
            "Total cost per vehicle averages $138,000 annually when all factors are considered",
            "Driver turnover in delivery roles exceeds 50% annually, creating constant training costs",
            "Vehicle downtime results in 8-12% lost delivery capacity on average",
            "Insurance costs for commercial fleets have increased 15% year-over-year",
            "Fuel price volatility creates unpredictable budget impacts",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function PharmacyChainContent() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Background</h2>
        <p className="text-muted-foreground">
          A regional pharmacy chain with 45 locations across the Hudson Valley was struggling 
          with their 12-vehicle delivery fleet. Rising costs, driver shortages, and increasing 
          customer expectations for same-day delivery were straining their operations.
        </p>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4 text-destructive">The Challenge</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="text-destructive font-bold">1.</span>
            Annual fleet costs exceeding $1.6M with unpredictable maintenance expenses
          </li>
          <li className="flex items-start gap-3">
            <span className="text-destructive font-bold">2.</span>
            45% driver turnover rate requiring constant recruitment and training
          </li>
          <li className="flex items-start gap-3">
            <span className="text-destructive font-bold">3.</span>
            Customer complaints about missed delivery windows and lack of tracking
          </li>
          <li className="flex items-start gap-3">
            <span className="text-destructive font-bold">4.</span>
            Management time diverted from core pharmacy operations to logistics issues
          </li>
        </ul>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4 text-green-600">The Solution</h2>
        <p className="text-muted-foreground mb-6">
          After a 30-day pilot program, the pharmacy chain transitioned 100% of their deliveries to Sendy Logistics.
        </p>
        <ul className="space-y-3">
          {[
            "Seamless integration with their pharmacy management system",
            "Real-time tracking for customers and staff",
            "HIPAA-compliant handling procedures for all medications",
            "Flexible capacity that scales with seasonal demand",
            "Dedicated account management and 24/7 support",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-primary/5 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Results After 12 Months</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: "$2.1M", label: "Annual Savings" },
            { value: "98.7%", label: "Customer Satisfaction" },
            { value: "99.2%", label: "On-Time Delivery" },
            { value: "0", label: "Fleet Management Headaches" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GroceryDeliveryContent() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">The Growth Challenge</h2>
        <p className="text-muted-foreground">
          A regional grocery chain saw demand for home delivery surge 10x during the pandemic. 
          Building an in-house fleet to meet this demand would have required millions in capital 
          investment and months of ramp-up time they didn't have.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-muted/50 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Before Sendy</h3>
          <ul className="space-y-3 text-muted-foreground">
            <li>50 deliveries per day capacity</li>
            <li>Next-day delivery only</li>
            <li>Limited delivery radius (10 miles)</li>
            <li>No real-time tracking for customers</li>
            <li>High cart abandonment at checkout</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4 text-primary">After Sendy</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              500+ deliveries per day capacity
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Same-day and 2-hour express options
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              30-mile delivery radius
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Real-time GPS tracking
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              35% increase in delivery orders
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-[#1a1a1a] text-white rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6">The Numbers Tell the Story</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary mb-2">10x</p>
            <p className="text-white/70">Delivery Volume Increase</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold text-green-400 mb-2">$0</p>
            <p className="text-white/70">Fleet Investment Required</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold text-primary mb-2">2hrs</p>
            <p className="text-white/70">Fastest Delivery Option</p>
          </div>
        </div>
      </div>

      <blockquote className="border-l-4 border-primary pl-6 italic text-lg text-muted-foreground">
        "Sendy allowed us to scale our delivery operations overnight without any capital investment. 
        We went from struggling to meet demand to being the fastest grocery delivery option in our market."
        <footer className="mt-2 text-sm font-semibold text-foreground">
          — Operations Director, Regional Grocery Chain
        </footer>
      </blockquote>
    </div>
  )
}
