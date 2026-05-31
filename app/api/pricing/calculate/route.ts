import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const distance = parseFloat(searchParams.get('distance') || '0')
  const customerLevelId = searchParams.get('customerLevelId')
  const serviceType = searchParams.get('serviceType') || 'standard'
  
  if (!distance || distance <= 0) {
    return NextResponse.json({ success: false, error: 'Valid distance is required' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  try {
    // Get the applicable pricing rule based on distance
    const { data: pricingRules, error: pricingError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .eq('service_type', serviceType)
      .lte('min_miles', distance)
      .order('min_miles', { ascending: false })
      .limit(10)
    
    if (pricingError) {
      console.error('[Pricing] Error fetching rules:', pricingError)
      return NextResponse.json({ success: false, error: 'Failed to fetch pricing rules' }, { status: 500 })
    }
    
    // Find the matching rule (first one where max_miles is null or >= distance)
    const applicableRule = pricingRules?.find(rule => 
      rule.max_miles === null || rule.max_miles >= distance
    )
    
    if (!applicableRule) {
      // Fallback to default pricing
      const basePrice = 10
      const pricePerMile = 2
      const subtotal = basePrice + (distance * pricePerMile)
      
      return NextResponse.json({
        success: true,
        basePrice,
        pricePerMile,
        distance,
        subtotal,
        discountPercentage: 0,
        discountAmount: 0,
        total: subtotal,
        ruleName: 'Default',
        serviceType
      })
    }
    
    // Calculate base subtotal
    const basePrice = parseFloat(applicableRule.base_price)
    const pricePerMile = parseFloat(applicableRule.price_per_mile)
    const subtotal = basePrice + (distance * pricePerMile)
    
    // Get customer discount if applicable
    let discountPercentage = 0
    if (customerLevelId) {
      const { data: customerLevel } = await supabase
        .from('customer_levels')
        .select('discount_percentage')
        .eq('id', customerLevelId)
        .single()
      
      if (customerLevel) {
        discountPercentage = parseFloat(customerLevel.discount_percentage) || 0
      }
    }
    
    const discountAmount = subtotal * (discountPercentage / 100)
    const total = subtotal - discountAmount
    
    return NextResponse.json({
      success: true,
      basePrice,
      pricePerMile,
      distance,
      subtotal: Math.round(subtotal * 100) / 100,
      discountPercentage,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      ruleName: applicableRule.name,
      serviceType: applicableRule.service_type
    })
  } catch (error) {
    console.error('[Pricing] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to calculate pricing' }, { status: 500 })
  }
}
