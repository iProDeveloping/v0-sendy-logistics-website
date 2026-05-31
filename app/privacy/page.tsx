import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy",
  description: "Sendy Logistics privacy policy. Learn how we collect, use, and protect your personal information when using our delivery services.",
  alternates: {
    canonical: 'https://sendylogistics.com/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: pageContent } = await supabase
    .from("cms_content")
    .select("*")
    .eq("page_slug", "privacy")
    .single()

  const content = pageContent?.content || {}
  const sections = content.sections || [
    { title: "Information We Collect", content: "We collect information you provide directly, such as name, address, email, and phone number when you use our services or contact us." },
    { title: "How We Use Your Information", content: "We use your information to provide delivery services, communicate with you, and improve our services." },
    { title: "Data Protection", content: "We implement industry-standard security measures to protect your data." },
    { title: "Contact Us", content: "For privacy-related inquiries, contact us at privacy@sendylogistics.com" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6 text-center">
            Privacy Policy
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
              {content.content || "At Sendy Logistics, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information."}
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
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@sendylogistics.com" className="text-primary hover:underline">
                  privacy@sendylogistics.com
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
