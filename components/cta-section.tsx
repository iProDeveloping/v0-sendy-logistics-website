import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Phone, ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section id="contact" className="py-24 bg-sendy-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
                Get to know Sendy.
                <br />
                <span className="text-primary">Send today!</span>
              </h2>
              <p className="text-lg text-white/70 leading-relaxed">
                Ready to revolutionize your delivery experience? Contact us today and discover why 
                Sendy is the company that delivers.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="https://sendylogistics.com"
                className="block text-white/70 hover:text-white transition-colors"
              >
                sendylogistics.com
              </a>
              <a
                href="tel:845-736-3946"
                className="flex items-center gap-3 text-2xl sm:text-3xl font-serif font-bold text-white hover:text-primary transition-colors"
              >
                <Phone className="h-6 w-6" />
                845.Sendy-Go
              </a>
              <p className="text-white/50 text-sm tracking-widest text-left mx-2.5 px-24">7 3 6 3 9 &nbsp; 4 6</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              >
                <Link href="/contact">
                  Request a Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 bg-transparent"
              >
                <a href="tel:845-736-3946">Call Us Now</a>
              </Button>
            </div>

            <p className="text-primary font-semibold uppercase tracking-wider text-sm">
              The Company That Delivers™
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sendy_logo2-removebg-preview-G3eRBU7q0x5AbnDeAGR7tOLOqef48M.png"
              alt="Sendy Mascot"
              width={300}
              height={300}
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
