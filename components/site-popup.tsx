"use client"

import { useState, useEffect } from "react"
import { X, Package, RefreshCw, CheckCircle, Truck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

interface PopupFeature {
  icon: string
  text: string
}

interface SitePopup {
  id: string
  name: string
  title: string
  subtitle: string | null
  description: string | null
  cta_text: string | null
  cta_url: string | null
  secondary_cta_text: string | null
  secondary_cta_url: string | null
  badge_text: string | null
  features: PopupFeature[]
  display_pages: string[]
  delay_seconds: number
  show_once_per_session: boolean
}

const iconMap: Record<string, React.ReactNode> = {
  package: <Package className="h-4 w-4" />,
  sync: <RefreshCw className="h-4 w-4" />,
  check: <CheckCircle className="h-4 w-4" />,
  truck: <Truck className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
}

export function SitePopup() {
  const [popup, setPopup] = useState<SitePopup | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fetchPopup = async () => {
      const supabase = createClient()
      
      // Get current page name from pathname
      let currentPage = "home"
      if (pathname === "/") {
        currentPage = "home"
      } else {
        currentPage = pathname.split("/")[1] || "home"
      }

      // Check if popup was already dismissed this session
      const dismissedPopups = sessionStorage.getItem("dismissed_popups")
      const dismissed = dismissedPopups ? JSON.parse(dismissedPopups) : []

      console.log("[v0] Fetching popup for page:", currentPage)
      
      const { data, error } = await supabase
        .from("site_popups")
        .select("*")
        .eq("is_active", true)
        .contains("display_pages", [currentPage])
        .order("created_at", { ascending: false })
        .limit(1)
      
      console.log("[v0] Popup query result:", { data, error })

      const popupData = data?.[0]
      if (popupData && !dismissed.includes(popupData.id)) {
        setPopup(popupData)
        // Show popup after delay
        setTimeout(() => {
          setIsVisible(true)
        }, (popupData.delay_seconds || 3) * 1000)
      }
    }

    fetchPopup()
  }, [pathname])

  const handleClose = () => {
    setIsClosing(true)
    
    // Mark as dismissed for this session
    if (popup?.show_once_per_session) {
      const dismissedPopups = sessionStorage.getItem("dismissed_popups")
      const dismissed = dismissedPopups ? JSON.parse(dismissedPopups) : []
      dismissed.push(popup.id)
      sessionStorage.setItem("dismissed_popups", JSON.stringify(dismissed))
    }

    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      setPopup(null)
    }, 300)
  }

  if (!popup || !isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup Card */}
      <div 
        className={`relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-orange-600 px-6 py-8 text-primary-foreground">
          {popup.badge_text && (
            <Badge className="mb-3 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Sparkles className="h-3 w-3 mr-1" />
              {popup.badge_text}
            </Badge>
          )}
          <h2 className="text-2xl font-bold mb-1">{popup.title}</h2>
          {popup.subtitle && (
            <p className="text-primary-foreground/90 text-lg">{popup.subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {popup.description && (
            <p className="text-muted-foreground mb-6">{popup.description}</p>
          )}

          {/* Features */}
          {popup.features && popup.features.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {popup.features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2"
                >
                  <span className="text-primary">
                    {iconMap[feature.icon] || <CheckCircle className="h-4 w-4" />}
                  </span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            {popup.cta_url && (
              <Button 
                asChild 
                className="flex-1"
                size="lg"
              >
                <a href={popup.cta_url} target="_blank" rel="noopener noreferrer">
                  {popup.cta_text || "Learn More"}
                </a>
              </Button>
            )}
            {popup.secondary_cta_url && (
              <Button 
                asChild 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <a href={popup.secondary_cta_url} target="_blank" rel="noopener noreferrer">
                  {popup.secondary_cta_text || "Learn More"}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
