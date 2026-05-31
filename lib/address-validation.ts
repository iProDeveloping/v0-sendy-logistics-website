/**
 * Google Address Validation API integration
 * Validates addresses and detects if subpremises (unit/apt) is needed
 */

interface AddressComponent {
  componentName: {
    text: string
    languageCode?: string
  }
  componentType: string
  confirmationLevel: string
  inferred?: boolean
  replaced?: boolean
  spellCorrected?: boolean
}

interface AddressValidationResult {
  verdict: {
    inputGranularity: string
    validationGranularity: string
    geocodeGranularity: string
    addressComplete?: boolean
    hasUnconfirmedComponents?: boolean
    hasInferredComponents?: boolean
    hasReplacedComponents?: boolean
    possibleNextAction?: string
  }
  address: {
    formattedAddress: string
    postalAddress: {
      regionCode: string
      languageCode: string
      postalCode: string
      administrativeArea: string
      locality: string
      addressLines: string[]
    }
    addressComponents: AddressComponent[]
  }
  geocode?: {
    location: {
      latitude: number
      longitude: number
    }
    placeId: string
  }
  uspsData?: {
    standardizedAddress?: {
      firstAddressLine: string
      cityStateZipAddressLine: string
    }
    dpvConfirmation?: string
    dpvFootnote?: string
  }
}

interface ValidationResponse {
  result: AddressValidationResult
  responseId: string
}

export interface AddressValidationOutput {
  isValid: boolean
  needsSubpremise: boolean
  formattedAddress: string
  components: {
    streetNumber?: string
    route?: string
    locality?: string
    administrativeArea?: string
    postalCode?: string
    subpremise?: string
  }
  location?: {
    lat: number
    lng: number
  }
  placeId?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  issues: string[]
}

/**
 * Validate an address using Google Address Validation API
 * Returns whether the address needs a unit/apartment number
 */
export async function validateAddress(
  address: string,
  regionCode: string = 'US'
): Promise<AddressValidationOutput> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('[v0] GOOGLE_MAPS_API_KEY not configured for Address Validation')
    // Return response that triggers fallback pattern matching
    return {
      isValid: true,
      needsSubpremise: false,
      formattedAddress: address,
      components: {},
      confidence: 'LOW',
      issues: ['API key not configured - using fallback']
    }
  }
  
  console.log(`[v0] Validating address with Google API: "${address}"`)

  try {
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: {
            regionCode,
            addressLines: [address],
          },
          enableUspsCass: regionCode === 'US', // Enhanced USPS validation for US
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Address Validation API error:', errorText)
      return {
        isValid: true,
        needsSubpremise: false,
        formattedAddress: address,
        components: {},
        confidence: 'LOW',
        issues: ['Validation API error']
      }
    }

    const data: ValidationResponse = await response.json()
    const result = data.result
    
    console.log(`[v0] Address Validation API response for "${address}":`, {
      possibleNextAction: result.verdict.possibleNextAction,
      inputGranularity: result.verdict.inputGranularity,
      addressComplete: result.verdict.addressComplete,
      dpvConfirmation: result.uspsData?.dpvConfirmation,
    })

    // Check if subpremise is needed - multiple indicators
    const needsSubpremise = 
      result.verdict.possibleNextAction === 'CONFIRM_ADD_SUBPREMISES' ||
      result.uspsData?.dpvConfirmation === 'S' || // Secondary number missing
      result.uspsData?.dpvConfirmation === 'D'    // Missing secondary info
    
    // Extract address components
    const components: AddressValidationOutput['components'] = {}
    for (const comp of result.address.addressComponents || []) {
      switch (comp.componentType) {
        case 'street_number':
          components.streetNumber = comp.componentName.text
          break
        case 'route':
          components.route = comp.componentName.text
          break
        case 'locality':
          components.locality = comp.componentName.text
          break
        case 'administrative_area_level_1':
          components.administrativeArea = comp.componentName.text
          break
        case 'postal_code':
          components.postalCode = comp.componentName.text
          break
        case 'subpremise':
          components.subpremise = comp.componentName.text
          break
      }
    }

    // Determine confidence level
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
    const issues: string[] = []

    if (result.verdict.hasUnconfirmedComponents) {
      confidence = 'MEDIUM'
      issues.push('Some address components could not be confirmed')
    }
    if (result.verdict.hasInferredComponents) {
      confidence = 'MEDIUM'
      issues.push('Some address components were inferred')
    }
    if (result.verdict.hasReplacedComponents) {
      confidence = 'MEDIUM'
      issues.push('Some address components were corrected')
    }
    if (!result.verdict.addressComplete) {
      confidence = 'LOW'
      issues.push('Address may be incomplete')
    }

    // Check USPS DPV confirmation for US addresses
    if (result.uspsData?.dpvConfirmation) {
      const dpv = result.uspsData.dpvConfirmation
      if (dpv === 'N') {
        confidence = 'LOW'
        issues.push('Address not confirmed by USPS')
      } else if (dpv === 'S') {
        // Secondary (unit) number missing
        if (!needsSubpremise) {
          issues.push('USPS indicates secondary number may be needed')
        }
      } else if (dpv === 'D') {
        // Missing secondary info but primary is valid
        if (!needsSubpremise) {
          issues.push('Primary address valid but secondary info missing')
        }
      }
    }

    return {
      isValid: result.verdict.validationGranularity !== 'OTHER',
      needsSubpremise,
      formattedAddress: result.address.formattedAddress,
      components,
      location: result.geocode ? {
        lat: result.geocode.location.latitude,
        lng: result.geocode.location.longitude,
      } : undefined,
      placeId: result.geocode?.placeId,
      confidence,
      issues,
    }
  } catch (error) {
    console.error('[v0] Address validation error:', error)
    return {
      isValid: true,
      needsSubpremise: false,
      formattedAddress: address,
      components: {},
      confidence: 'LOW',
      issues: ['Validation request failed']
    }
  }
}

/**
 * Quick check if address needs a unit number
 * Returns true if Google says subpremise is needed
 */
export async function addressNeedsUnit(address: string): Promise<boolean> {
  const result = await validateAddress(address)
  return result.needsSubpremise
}
