import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { BusinessSection } from "@/components/business-section"
import { CustomersSection } from "@/components/customers-section"
import { ReturnsSection } from "@/components/returns-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { PartnersBanner } from "@/components/partners-banner"
import { LocalBusinessJsonLd, ServiceJsonLd } from "@/components/seo/json-ld"

export default function HomePage() {
  return (
    <main>
      <LocalBusinessJsonLd />
      <ServiceJsonLd />
      <Header />
      <HeroSection />
      <PartnersBanner />
      <ServicesSection />
      <BusinessSection />
      <CustomersSection />
      <ReturnsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
