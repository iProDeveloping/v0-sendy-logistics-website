import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, serviceType, message } = body

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert contact submission
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      phone: phone || null,
      company: company || null,
      service_type: serviceType || null,
      message,
      status: "new",
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to submit form. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Form submitted successfully" })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
