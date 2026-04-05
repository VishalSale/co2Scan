import axios from "axios"

// Free static carbon intensity data by country (g CO2/kWh)
// Source: Ember Climate, IEA, and various national grid reports (2023-2024 averages)
const CARBON_INTENSITY_BY_COUNTRY: Record<string, number> = {
  // Low carbon intensity (renewable-heavy)
  NO: 18, // Norway (hydro)
  IS: 20, // Iceland (geothermal/hydro)
  SE: 45, // Sweden (nuclear/hydro)
  FR: 60, // France (nuclear)
  CH: 65, // Switzerland
  CA: 120, // Canada (varies by province)
  BR: 130, // Brazil (hydro)
  
  // Medium carbon intensity
  FI: 90, // Finland
  DK: 110, // Denmark
  ES: 180, // Spain
  GB: 220, // United Kingdom
  IT: 250, // Italy
  NZ: 130, // New Zealand
  PT: 200, // Portugal
  
  // Medium-high carbon intensity
  US: 390, // United States (varies by state)
  JP: 450, // Japan
  KR: 420, // South Korea
  RU: 450, // Russia
  TR: 420, // Turkey
  
  // High carbon intensity (coal-heavy)
  CN: 550, // China
  IN: 630, // India
  PL: 700, // Poland
  ZA: 850, // South Africa
  AU: 600, // Australia
  ID: 680, // Indonesia
  
  // Middle East & others
  AE: 400, // UAE
  SA: 600, // Saudi Arabia
  EG: 500, // Egypt
  MX: 420, // Mexico
  AR: 350, // Argentina
  CL: 400, // Chile
  
  // Default global average
  GLOBAL: 442,
}

// Free electricity cost by country (local currency per kWh)
const ELECTRICITY_COST_BY_COUNTRY: Record<string, { cost: number; currency: string }> = {
  // Expensive
  DE: { cost: 0.40, currency: "EUR" }, // Germany
  DK: { cost: 0.38, currency: "EUR" }, // Denmark
  BE: { cost: 0.35, currency: "EUR" }, // Belgium
  IT: { cost: 0.32, currency: "EUR" }, // Italy
  GB: { cost: 0.28, currency: "GBP" }, // UK
  
  // Medium
  US: { cost: 0.16, currency: "USD" }, // USA
  JP: { cost: 27, currency: "JPY" }, // Japan
  AU: { cost: 0.30, currency: "AUD" }, // Australia
  FR: { cost: 0.22, currency: "EUR" }, // France
  ES: { cost: 0.28, currency: "EUR" }, // Spain
  CA: { cost: 0.13, currency: "CAD" }, // Canada
  
  // Cheaper
  IN: { cost: 8, currency: "INR" }, // India
  CN: { cost: 0.08, currency: "USD" }, // China
  RU: { cost: 0.05, currency: "USD" }, // Russia
  BR: { cost: 0.10, currency: "USD" }, // Brazil
  MX: { cost: 0.09, currency: "USD" }, // Mexico
  
  // Default
  GLOBAL: { cost: 0.15, currency: "USD" },
}

interface CarbonIntensityResult {
  carbonIntensity: number
  source: string
  region: string
}

interface ElectricityCostResult {
  cost: number
  currency: string
  source: string
}

/**
 * Get carbon intensity for a region
 * Tries free API first, falls back to static data
 */
export async function getCarbonIntensity(countryCode?: string): Promise<CarbonIntensityResult> {
  const region = countryCode?.toUpperCase() || "GLOBAL"
  
  // Try free Electricity Maps API (no auth needed for some endpoints)
  // Note: This may have rate limits, so we catch errors and fallback
  if (countryCode && countryCode !== "GLOBAL") {
    try {
      // CO2 Signal API (free, no key needed for basic usage)
      const response = await axios.get(`https://api.co2signal.com/v1/latest`, {
        params: { countryCode: region },
        timeout: 3000,
      })
      
      if (response.data?.data?.carbonIntensity) {
        return {
          carbonIntensity: Math.round(response.data.data.carbonIntensity),
          source: "CO2 Signal API (live)",
          region,
        }
      }
    } catch (error) {
      // API failed or rate limited, fall through to static data
      console.log(`CO2 Signal API unavailable for ${region}, using static data`)
    }
  }
  
  // Fallback to static data
  const carbonIntensity = CARBON_INTENSITY_BY_COUNTRY[region] || CARBON_INTENSITY_BY_COUNTRY.GLOBAL
  
  return {
    carbonIntensity,
    source: "Static regional average (2023-2024)",
    region,
  }
}

/**
 * Get electricity cost for a region
 * Uses static data (updated periodically)
 */
export function getElectricityCost(countryCode?: string): ElectricityCostResult {
  const region = countryCode?.toUpperCase() || "GLOBAL"
  const data = ELECTRICITY_COST_BY_COUNTRY[region] || ELECTRICITY_COST_BY_COUNTRY.GLOBAL
  
  return {
    cost: data.cost,
    currency: data.currency,
    source: "Static regional average (2024)",
  }
}

/**
 * Get both carbon intensity and electricity cost
 */
export async function getRegionalEnergyData(countryCode?: string) {
  const [carbonData, costData] = await Promise.all([
    getCarbonIntensity(countryCode),
    Promise.resolve(getElectricityCost(countryCode)),
  ])
  
  return {
    carbon: carbonData,
    electricity: costData,
  }
}
