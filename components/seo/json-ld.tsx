import Script from 'next/script'

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://sendylogistics.com',
    name: 'Sendy Logistics',
    alternateName: 'Sendy',
    description: 'Same-day delivery services in NYC, New Jersey & surrounding areas. Corporate deliveries, pharmacy delivery, retail logistics, and local messenger services.',
    url: 'https://sendylogistics.com',
    logo: 'https://sendylogistics.com/icon-512.png',
    image: 'https://sendylogistics.com/og-default.jpg',
    telephone: '+1-845-736-3946',
    email: 'info@sendylogistics.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New York',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'New York City',
        '@id': 'https://www.wikidata.org/wiki/Q60',
      },
      {
        '@type': 'City',
        name: 'Jersey City',
      },
      {
        '@type': 'City',
        name: 'Hoboken',
      },
      {
        '@type': 'State',
        name: 'New Jersey',
      },
    ],
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 40.7128,
        longitude: -74.0060,
      },
      geoRadius: '50 mi',
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    sameAs: [
      'https://twitter.com/sendylogistics',
      'https://www.linkedin.com/company/sendylogistics',
      'https://www.facebook.com/sendylogistics',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Delivery Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Same-Day Delivery',
            description: 'Fast same-day delivery within NYC and NJ metro area',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Corporate Delivery Solutions',
            description: 'Business-to-business delivery services with volume discounts',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Pharmacy Delivery',
            description: 'HIPAA-compliant medication delivery services',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Retail Delivery Partner',
            description: 'Last-mile delivery solutions for retail businesses',
          },
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  }

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sendy Logistics',
    url: 'https://sendylogistics.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://sendylogistics.com/track?id={tracking_number}',
      },
      'query-input': 'required name=tracking_number',
    },
  }

return (
    <Script
      id="service-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}


export function FAQJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How fast can Sendy deliver my package?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer same-day delivery within NYC and NJ metro area. Most deliveries are completed within 2-4 hours of pickup.',
        },
      },
      {
        '@type': 'Question',
        name: 'What areas does Sendy Logistics serve?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We serve all five NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island), as well as Jersey City, Hoboken, Newark, and surrounding NJ areas within 50 miles.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I request a delivery?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Simply text us at 845-SENDY-GO (845-736-3946) with your pickup and delivery addresses. You can also use our website chat or contact form.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does delivery cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pricing starts at $15 for local deliveries under 3 miles. Exact pricing depends on distance and package size. We offer volume discounts for businesses.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I track my delivery in real-time?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Every delivery comes with real-time GPS tracking. You receive SMS updates and can view your driver\'s location on a live map.',
        },
      },
    ],
  }

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// Alias for OrganizationJsonLd for clearer usage
export const LocalBusinessJsonLd = OrganizationJsonLd

export function ServiceJsonLd({ 
  name = 'Same-Day Delivery', 
  description = 'Fast same-day delivery services in NYC and NJ metro area', 
  url = 'https://sendylogistics.com/services'
}: { 
  name?: string
  description?: string
  url?: string 
} = {}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Delivery Service',
    name,
    description,
    url,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Sendy Logistics',
      url: 'https://sendylogistics.com',
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 40.7128,
        longitude: -74.0060,
      },
      geoRadius: '50 mi',
    },
  }

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
