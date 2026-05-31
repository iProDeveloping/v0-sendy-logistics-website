import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata = {
  title: "Delivery FAQs - Common Questions About Same-Day Delivery",
  description: "Answers to frequently asked questions about Sendy Logistics delivery services. Learn about pricing, delivery times, tracking, service areas, and business partnerships.",
  alternates: {
    canonical: 'https://sendylogistics.com/faq',
  },
  openGraph: {
    title: "Delivery FAQs - Sendy Logistics",
    description: "Get answers to common questions about same-day delivery services in NYC & NJ.",
    url: 'https://sendylogistics.com/faq',
  },
}

export default async function FAQPage() {
  const supabase = await createClient()
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })

  // Group FAQs by category
  const groupedFaqs = (faqs || []).reduce((acc: Record<string, typeof faqs>, faq) => {
    const category = faq.category || "General"
    if (!acc[category]) acc[category] = []
    acc[category].push(faq)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our delivery services.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <div key={category} className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">{category}</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {(categoryFaqs || []).map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="bg-card border border-border rounded-xl px-6"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-8">
            Our team is here to help. Contact us and we'll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors">
              Contact Us
            </a>
            <a href="tel:845-736-3946" className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary/10 transition-colors">
              845.Sendy-Go
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
