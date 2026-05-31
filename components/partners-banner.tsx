"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface Partner {
  id: string
  name: string
  logo_url: string
  industry?: string
  website_url?: string
}

export function PartnersBanner() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/partners")
      .then(res => res.json())
      .then(data => {
        setPartners(data.partners || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider">
            Trusted by Leading Brands Across Industries
          </p>
          <div className="flex justify-center gap-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-28 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (partners.length === 0) {
    return null
  }

  // Get unique industries for the tags
  const industries = Array.from(new Set(partners.map(p => p.industry).filter(Boolean)))

  // Duplicate partners for seamless infinite scroll
  const duplicatedPartners = [...partners, ...partners, ...partners]

  return (
    <section className="py-12 bg-muted/30 border-y overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Trusted by Leading Brands Across Industries
        </p>
      </div>
      
      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling container */}
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {duplicatedPartners.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex-shrink-0 mx-8 group"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-32 relative grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                  {partner.website_url ? (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full w-full"
                    >
                      <Image
                        src={partner.logo_url || "/placeholder.svg"}
                        alt={partner.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </a>
                  ) : (
                    <Image
                      src={partner.logo_url || "/placeholder.svg"}
                      alt={partner.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
                {partner.industry && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 group-hover:text-primary transition-colors">
                    {partner.industry}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Industry tags */}
      {industries.length > 0 && (
        <div className="container mx-auto px-4 mt-8">
          <div className="flex flex-wrap justify-center gap-2">
            {industries.map((industry) => (
              <span
                key={industry}
                className="px-3 py-1 text-xs font-medium bg-background border rounded-full text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-default"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  )
}
