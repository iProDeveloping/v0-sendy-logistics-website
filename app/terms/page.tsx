import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Terms of Service",
  description: "Sendy Logistics terms of service and user agreement. Read our service terms, user responsibilities, and liability information.",
  alternates: {
    canonical: 'https://sendylogistics.com/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function TermsPage() {
  const supabase = await createClient()
  const { data: pageContent } = await supabase
    .from("cms_content")
    .select("*")
    .eq("page_slug", "terms")
    .single()

  const content = pageContent?.content || {}
  const sections = content.sections || [
    { title: "Service Agreement", content: "Sendy Logistics provides delivery and logistics services as described on our website. By using our services, you agree to these terms." },
    { title: "User Responsibilities", content: "Users must provide accurate information and ensure packages comply with shipping regulations. You are responsible for properly packaging items and providing accurate delivery addresses." },
    { title: "Liability", content: "Sendy Logistics liability is limited to the declared value of packages. Insurance options are available for high-value items. We are not liable for delays due to circumstances beyond our control." },
    { title: "Modifications", content: "We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms." },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-center">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-center mb-4">
            Last updated: {content.last_updated || "February 1, 2026"}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {content.intro || "By using Sendy Logistics services, you agree to these terms and conditions. Please read them carefully before using our services."}
            </p>

            <div className="space-y-8">
              {sections.map((section: { title: string; content: string }, index: number) => (
                <div key={index}>
                  <h2 className="font-serif text-xl font-bold text-foreground mb-4">
                    {index + 1}. {section.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@sendylogistics.com" className="text-primary hover:underline">
                  legal@sendylogistics.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
