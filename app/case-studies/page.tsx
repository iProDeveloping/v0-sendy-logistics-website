import React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, TrendingDown, BarChart3, Truck, Building2, ShoppingBag, Pill
} from "lucide-react"
import { createServiceClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Delivery Case Studies - How Businesses Save 40-60% on Costs",
  description: "Real results: See how pharmacies, retailers, and businesses save 40-60% on delivery costs by partnering with Sendy Logistics. Detailed ROI breakdowns and success stories from NYC & NJ.",
  alternates: {
    canonical: 'https://sendylogistics.com/case-studies',
  },
  openGraph: {
    title: "Delivery Case Studies - Real Business Results | Sendy Logistics",
    description: "See how businesses save 40-60% on delivery costs. Real ROI data from pharmacies, retailers, and more.",
    url: "https://sendylogistics.com/case-studies",
    siteName: "Sendy Logistics",
    images: [
      {
        url: "/og-case-studies.jpg",
        width: 1200,
        height: 630,
        alt: "Sendy Logistics Case Studies - Real Business Results",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delivery Case Studies - Real Business Results",
    description: "See how businesses save 40-60% on delivery costs by partnering with Sendy Logistics.",
    images: ["/og-case-studies.jpg"],
  },
}

// Fallback data if database is empty
const fallbackCaseStudies = [
  {
    id: "1",
    slug: "fleet-ownership-costs",
    title: "The True Cost of Fleet Ownership",
    subtitle: "Why Major Retailers Choose Outsourced Delivery",
    description: "A comprehensive analysis of why maintaining an in-house delivery fleet costs retailers 40-60% more than partnering with dedicated logistics providers.",
    stats: [
      { value: "47%", label: "Average Cost Savings" },
      { value: "$180K", label: "Annual Savings Per Vehicle" },
      { value: "99.2%", label: "On-Time Delivery Rate" },
    ],
    featured: true,
    category: "Cost Analysis",
  },
  {
    id: "2",
    slug: "pharmacy-chain-success",
    title: "Regional Pharmacy Chain Case Study",
    subtitle: "From 12-Vehicle Fleet to Zero Overhead",
    description: "How a 45-location pharmacy chain eliminated their delivery fleet and improved customer satisfaction while cutting costs by $2.1M annually.",
    stats: [
      { value: "45", label: "Locations Served" },
      { value: "$2.1M", label: "Annual Savings" },
      { value: "98.7%", label: "Customer Satisfaction" },
    ],
    featured: false,
    category: "Healthcare",
  },
  {
    id: "3",
    slug: "grocery-delivery-transformation",
    title: "Grocery Delivery Transformation",
    subtitle: "Scaling Without the Headaches",
    description: "A regional grocery chain scaled from 50 to 500 daily deliveries without hiring a single driver or purchasing a single vehicle.",
    stats: [
      { value: "10x", label: "Delivery Volume Growth" },
      { value: "0", label: "Fleet Investment" },
      { value: "2hrs", label: "Average Delivery Time" },
    ],
    featured: false,
    category: "Retail",
  },
]

const categoryIcons: Record<string, React.ReactNode> = {
  "Cost Analysis": <BarChart3 className="w-5 h-5" />,
  "Healthcare": <Pill className="w-5 h-5" />,
  "Retail": <ShoppingBag className="w-5 h-5" />,
  "Enterprise": <Building2 className="w-5 h-5" />,
}

export default async function CaseStudiesPage() {
  const supabase = createServiceClient()
  
  // Try to fetch from database
  let caseStudies = fallbackCaseStudies
  try {
    const { data } = await supabase
      .from("case_studies")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
    
    if (data && data.length > 0) {
      caseStudies = data.map(study => ({
        ...study,
        stats: study.stats || []
      }))
    }
  } catch {
    // Use fallback data
  }
  
  const featuredStudy = caseStudies.find(s => s.featured) || caseStudies[0]
  const otherStudies = caseStudies.filter(s => s.id !== featuredStudy?.id)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a]">
        <div className="mx-auto max-w-5xl">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary bg-primary/10">
            Case Studies
          </Badge>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white text-balance">
            Real Results from<br />
            <span className="text-primary">Real Partnerships</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
            Discover how businesses across industries have transformed their delivery operations 
            and achieved significant cost savings by partnering with Sendy Logistics.
          </p>
        </div>
      </section>

      {/* Featured Case Study */}
      {featuredStudy && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#f8f6f3]">
          <div className="mx-auto max-w-6xl">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-border/50">
              <div className="grid lg:grid-cols-5">
                {/* Content Side */}
                <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                      Featured Study
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {featuredStudy.category}
                    </Badge>
                  </div>
                  <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
                    {featuredStudy.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    {featuredStudy.subtitle}
                  </p>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {featuredStudy.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-muted/50 rounded-xl">
                    {featuredStudy.stats?.map((stat: { value: string; label: string }, idx: number) => (
                      <div key={idx} className="text-center">
                        <p className="text-2xl lg:text-3xl font-bold text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  <Link href={`/case-studies/${featuredStudy.slug}`}>
                    <Button size="lg" className="gap-2 rounded-full">
                      Read Full Case Study <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                {/* Visual Side */}
                <div className="lg:col-span-2 bg-[#1a1a1a] p-8 lg:p-12 flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <TrendingDown className="w-10 h-10 text-primary" />
                    </div>
                    <p className="font-serif text-5xl lg:text-6xl font-bold text-white mb-2">40-60%</p>
                    <p className="text-neutral-400 text-lg">Cost Reduction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Other Case Studies Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                More Success Stories
              </h2>
              <p className="text-muted-foreground">
                See how other businesses transformed their delivery operations
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {otherStudies.map((study) => (
              <Link 
                key={study.id} 
                href={`/case-studies/${study.slug}`}
                className="group"
              >
                <div className="h-full bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {categoryIcons[study.category] || <Truck className="w-5 h-5" />}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {study.category}
                    </Badge>
                  </div>
                  
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {study.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-2">
                    {study.description}
                  </p>
                  
                  {/* Mini Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                    {study.stats?.slice(0, 3).map((stat: { value: string; label: string }, idx: number) => (
                      <div key={idx}>
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-6 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    Read Case Study <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Delivery Operations?
          </h2>
          <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses that have eliminated fleet headaches and 
            reduced costs with Sendy Logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="rounded-full gap-2">
                Get a Custom Quote <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-full bg-transparent text-white border-white/30 hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
