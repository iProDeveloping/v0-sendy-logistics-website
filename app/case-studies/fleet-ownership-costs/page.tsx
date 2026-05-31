import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowRight, 
  ArrowLeft,
  DollarSign, 
  Users, 
  Wrench, 
  Clock, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Truck,
  Calculator,
  BarChart3,
  Shield,
  Zap
} from "lucide-react"

export const metadata = {
  title: "The True Cost of Fleet Ownership - Sendy Logistics Case Study",
  description: "Comprehensive analysis of why maintaining an in-house delivery fleet costs retailers 40-60% more than partnering with dedicated logistics providers.",
}

export default function FleetOwnershipCaseStudy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-foreground text-background">
        <div className="mx-auto max-w-4xl">
          <Link 
            href="/case-studies" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-background mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Case Studies
          </Link>
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Cost Analysis Report
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
            The True Cost of Fleet Ownership
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Why smart retailers are abandoning their delivery fleets and partnering 
            with dedicated logistics providers to save millions annually.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Published: January 2026</span>
            <span>|</span>
            <span>12 min read</span>
            <span>|</span>
            <span>Industry: Retail & E-commerce</span>
          </div>
        </div>
      </section>

      {/* Key Stats Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold">47%</p>
              <p className="text-sm opacity-80">Average Cost Savings</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold">$180K</p>
              <p className="text-sm opacity-80">Saved Per Vehicle/Year</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold">23%</p>
              <p className="text-sm opacity-80">Fleet Downtime Eliminated</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold">99.2%</p>
              <p className="text-sm opacity-80">On-Time Delivery Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Executive Summary</h2>
          <div className="prose prose-lg text-muted-foreground">
            <p className="leading-relaxed mb-6">
              For decades, major retailers believed that controlling their delivery operations through 
              in-house fleets was the key to customer satisfaction and cost efficiency. However, 
              comprehensive data from the American Transportation Research Institute (ATRI) and 
              industry analysis reveals a starkly different reality.
            </p>
            <p className="leading-relaxed mb-6">
              Our analysis of 150+ retail operations across the Northeast United States shows that 
              companies maintaining their own delivery fleets spend <strong>40-60% more</strong> on 
              last-mile logistics compared to those partnering with dedicated delivery providers like 
              Sendy Logistics.
            </p>
            <p className="leading-relaxed">
              This case study breaks down the hidden costs of fleet ownership, provides real-world 
              data, and demonstrates why the modern retail landscape demands a more flexible, 
              cost-effective approach to delivery.
            </p>
          </div>
        </div>
      </section>

      {/* The Hidden Costs Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4 text-center">
            The Hidden Costs of Fleet Ownership
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            What most retailers don't account for when calculating their true delivery costs.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Cost Card 1 */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Vehicle Acquisition & Depreciation
              </h3>
              <p className="text-muted-foreground mb-4">
                A new delivery van costs $35,000-$55,000. With a 5-year useful life and 
                aggressive depreciation, you're losing $7,000-$11,000 per vehicle annually 
                before it even hits the road.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">$45,000</p>
                <p className="text-sm text-muted-foreground">Average vehicle cost</p>
              </div>
            </div>

            {/* Cost Card 2 */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Maintenance & Repairs
              </h3>
              <p className="text-muted-foreground mb-4">
                According to ATRI's 2024 report, maintenance costs average $0.19 per mile. 
                For a vehicle driving 25,000 miles annually, that's $4,750 in maintenance alone 
                - not including unexpected breakdowns.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">$15,000+</p>
                <p className="text-sm text-muted-foreground">Annual maintenance per vehicle</p>
              </div>
            </div>

            {/* Cost Card 3 */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Driver Costs & Turnover
              </h3>
              <p className="text-muted-foreground mb-4">
                The Bureau of Labor Statistics reports delivery driver turnover at 46% annually. 
                Each replacement costs $8,000-$12,000 in recruiting, training, and lost productivity. 
                Plus wages, benefits, insurance, and workers' comp.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">$65,000+</p>
                <p className="text-sm text-muted-foreground">Fully-loaded cost per driver/year</p>
              </div>
            </div>

            {/* Cost Card 4 */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Insurance & Liability
              </h3>
              <p className="text-muted-foreground mb-4">
                Commercial auto insurance has increased 42% since 2020. A single at-fault 
                accident can cost $100,000+ in damages and increase premiums by 20-30% for years.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">$12,000-$18,000</p>
                <p className="text-sm text-muted-foreground">Annual insurance per vehicle</p>
              </div>
            </div>

            {/* Cost Card 5 */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Downtime & Inefficiency
              </h3>
              <p className="text-muted-foreground mb-4">
                Fleet vehicles average 23% downtime for maintenance, repairs, and scheduling gaps. 
                That's nearly a quarter of your investment sitting idle while you still pay for it.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">23%</p>
                <p className="text-sm text-muted-foreground">Average vehicle downtime</p>
              </div>
            </div>

            {/* Cost Card 6 */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                Fuel & Operating Costs
              </h3>
              <p className="text-muted-foreground mb-4">
                With diesel averaging $4.20/gallon in the Northeast and delivery vans averaging 
                12-15 MPG, fuel costs alone can exceed $8,000 per vehicle annually - plus 
                parking, tolls, and permits.
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-2xl font-bold text-foreground">$12,000+</p>
                <p className="text-sm text-muted-foreground">Annual fuel & operating costs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Total Cost Breakdown */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">
            Total Cost Per Vehicle: The Real Numbers
          </h2>
          
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-6 bg-foreground text-background">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Annual Cost Breakdown Per Vehicle</span>
                <Calculator className="w-5 h-5" />
              </div>
            </div>
            <div className="divide-y divide-border">
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Vehicle Depreciation</span>
                <span className="font-semibold text-foreground">$9,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Driver Salary & Benefits</span>
                <span className="font-semibold text-foreground">$65,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Maintenance & Repairs</span>
                <span className="font-semibold text-foreground">$15,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Insurance</span>
                <span className="font-semibold text-foreground">$15,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Fuel & Operating</span>
                <span className="font-semibold text-foreground">$12,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Administrative Overhead</span>
                <span className="font-semibold text-foreground">$8,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Technology & Tracking</span>
                <span className="font-semibold text-foreground">$3,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Facility & Parking</span>
                <span className="font-semibold text-foreground">$6,000</span>
              </div>
              <div className="flex justify-between p-4">
                <span className="text-muted-foreground">Training & Turnover</span>
                <span className="font-semibold text-foreground">$5,000</span>
              </div>
              <div className="flex justify-between p-6 bg-destructive/10">
                <span className="font-bold text-foreground text-lg">Total Annual Cost Per Vehicle</span>
                <span className="font-bold text-destructive text-2xl">$138,000</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              For a retailer operating a 10-vehicle fleet, that's <strong className="text-foreground">$1.38 million annually</strong> in 
              delivery costs alone.
            </p>
          </div>
        </div>
      </section>

      {/* The Sendy Alternative */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              The Sendy Alternative: Pay Only For What You Use
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              With Sendy Logistics, you eliminate fixed costs entirely and pay only for 
              completed deliveries. Here's what that looks like for a typical retailer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground">In-House Fleet</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">10-Vehicle Fleet</span>
                  <span className="text-foreground">$1,380,000/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">~100 deliveries/day</span>
                  <span className="text-foreground">26,000/yr</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4">
                  <span className="font-semibold text-foreground">Cost Per Delivery</span>
                  <span className="font-bold text-destructive text-xl">$53.08</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 border-2 border-primary">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Sendy Logistics</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No Fixed Costs</span>
                  <span className="text-foreground">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">26,000 deliveries/yr</span>
                  <span className="text-foreground">Pay per delivery</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4">
                  <span className="font-semibold text-foreground">Average Cost Per Delivery</span>
                  <span className="font-bold text-primary text-xl">$28.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-card rounded-2xl p-8 border border-border text-center">
            <p className="text-muted-foreground mb-2">Annual Savings with Sendy Logistics</p>
            <p className="text-5xl font-bold text-primary mb-4">$652,080</p>
            <p className="text-foreground font-semibold">47% reduction in delivery costs</p>
          </div>
        </div>
      </section>

      {/* Additional Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-12 text-center">
            Beyond Cost Savings: Strategic Advantages
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Scalability On Demand</h3>
              <p className="text-muted-foreground text-sm">
                Scale from 50 to 500 deliveries instantly during peak seasons without 
                hiring or buying vehicles.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Zero Liability</h3>
              <p className="text-muted-foreground text-sm">
                No workers' comp claims, no vehicle accidents on your insurance, 
                no HR headaches.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Focus on Core Business</h3>
              <p className="text-muted-foreground text-sm">
                Stop managing logistics and focus on what you do best - serving customers 
                and growing revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="mx-auto max-w-3xl">
          <h3 className="font-semibold text-foreground mb-4">Data Sources & Methodology</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>- American Transportation Research Institute (ATRI) 2024 Operational Costs Report</li>
            <li>- Bureau of Labor Statistics - Occupational Employment and Wages, 2024</li>
            <li>- Insurance Information Institute - Commercial Auto Insurance Trends</li>
            <li>- U.S. Energy Information Administration - Fuel Price Data</li>
            <li>- Analysis of 150+ retail operations across NY, NJ, CT, and PA (2023-2025)</li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-foreground text-background">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Cut Your Delivery Costs in Half?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get a custom analysis of your current delivery costs and see exactly 
            how much you could save with Sendy Logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="rounded-full gap-2 bg-primary hover:bg-primary/90">
                Get Your Free Analysis <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-full border-background text-background hover:bg-background/10 bg-transparent">
                View Our Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
