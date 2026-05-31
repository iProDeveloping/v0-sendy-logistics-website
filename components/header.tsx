"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: "Services", href: "/services" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Pricing", href: "/pricing" },
    { label: "Track", href: "/track" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/sendy-logo.jpg"
              alt="Sendy Logistics"
              width={140}
              height={60}
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-foreground/80 hover:text-primary font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:845-736-3946"
              className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="font-medium">845.Sendy-Go</span>
            </a>
            <Button asChild variant="outline" className="font-semibold bg-transparent">
              <Link href="/login">
                <User className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
              <Link href="/contact">Get a Quote</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary font-medium transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="tel:845-736-3946"
                className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors py-2"
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">845.Sendy-Go</span>
              </a>
              <Button asChild variant="outline" className="font-semibold w-full mt-2 bg-transparent">
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full mt-2">
                <Link href="/contact">Get a Quote</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
