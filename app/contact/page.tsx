"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Mail, MapPin, Clock, CheckCircle, Loader2 } from "lucide-react"

const serviceTypes = [
  { value: "corporate", label: "Corporate Delivery" },
  { value: "grocery", label: "Grocery Delivery" },
  { value: "pharmacy", label: "Pharmacy Logistics" },
  { value: "seasonal", label: "Seasonal Deliveries" },
  { value: "messenger", label: "Local Messenger" },
  { value: "returns", label: "Returns Management" },
  { value: "quote", label: "General Quote Request" },
  { value: "other", label: "Other Inquiry" },
]

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    content: "845.Sendy-Go (845-736-3946)",
    href: "tel:845-736-3946",
  },
  {
    icon: Mail,
    title: "Email",
    content: "hello@sendylogistics.com",
    href: "mailto:hello@sendylogistics.com",
  },
  {
    icon: MapPin,
    title: "Address",
    content: "123 Delivery Way, Logistics City",
    href: null,
  },
  {
    icon: Clock,
    title: "Hours",
    content: "Mon-Sat: 7AM-9PM, Sun: 9AM-6PM",
    href: null,
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    serviceType: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form")
      }

      setSuccess(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        serviceType: "",
        message: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to streamline your deliveries? Contact us for a quote or to learn more about our services.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Contact Information</h2>
              <div className="space-y-6">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon
                  const content = (
                    <div className="flex items-start gap-4" key={index}>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-muted-foreground">{item.content}</p>
                      </div>
                    </div>
                  )
                  
                  return item.href ? (
                    <a key={item.title} href={item.href} className="block hover:opacity-80 transition-opacity">
                      {content}
                    </a>
                  ) : (
                    <div key={item.title}>{content}</div>
                  )
                })}
              </div>

              <div className="mt-8 p-6 bg-primary/10 rounded-2xl">
                <h3 className="font-semibold text-foreground mb-2">Business Hours</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our team is available to assist you during regular business hours. For urgent deliveries, call our hotline.
                </p>
                <a
                  href="tel:845-736-3946"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors"
                >
                  Call Now: 845.Sendy-Go
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-2xl p-8">
                {success ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Message Sent!</h2>
                    <p className="text-muted-foreground mb-6">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                    <Button onClick={() => setSuccess(false)} variant="outline" className="rounded-full">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company Name</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => handleChange("company", e.target.value)}
                            placeholder="Your Company"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Select value={formData.serviceType} onValueChange={(value) => handleChange("serviceType", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                {service.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          required
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="Tell us about your delivery needs..."
                          rows={5}
                        />
                      </div>

                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
