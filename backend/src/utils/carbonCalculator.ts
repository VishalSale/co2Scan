import { getCarbonIntensity } from "./carbonIntensity"

const ENERGY_PER_GB = {
  low: 0.02,
  medium: 0.055,
  high: 0.14,
}

interface CarbonCalculationInput {
  totalBytes: number
  serverCountryCode: string
  userCountryCode: string
}

interface CarbonCalculationResult {
  serverSide: {
    energyKwh: number
    co2Grams: number
    carbonIntensity: number
    country: string
  }
  userSide: {
    energyKwh: number
    co2Grams: number
    carbonIntensity: number
    country: string
  }
  combined: {
    totalEnergyKwh: number
    totalCo2Grams: number
  }
  breakdown: {
    low: number
    medium: number
    high: number
  }
}

/**
 * Calculate CO2 emissions for both server and user side
 */
export async function calculateCarbonEmissions(input: CarbonCalculationInput): Promise<CarbonCalculationResult> {
  const { totalBytes, serverCountryCode, userCountryCode } = input

  // Get carbon intensity for both locations
  const [serverCarbon, userCarbon] = await Promise.all([
    getCarbonIntensity(serverCountryCode),
    getCarbonIntensity(userCountryCode),
  ])

  // Convert bytes to GB
  const totalGb = totalBytes / (1024 * 1024 * 1024)

  // Calculate energy (using medium estimate)
  const energyKwh = totalGb * ENERGY_PER_GB.medium

  // Split energy consumption: 60% server-side, 40% user-side (industry estimate)
  const serverEnergyKwh = energyKwh * 0.6
  const userEnergyKwh = energyKwh * 0.4

  // Calculate CO2 for each side
  const serverCo2Grams = serverEnergyKwh * serverCarbon.carbonIntensity
  const userCo2Grams = userEnergyKwh * userCarbon.carbonIntensity

  // Calculate range (low/medium/high)
  const energyLow = totalGb * ENERGY_PER_GB.low
  const energyHigh = totalGb * ENERGY_PER_GB.high
  const avgCarbonIntensity = (serverCarbon.carbonIntensity + userCarbon.carbonIntensity) / 2

  return {
    serverSide: {
      energyKwh: Number(serverEnergyKwh.toFixed(6)),
      co2Grams: Number(serverCo2Grams.toFixed(4)),
      carbonIntensity: serverCarbon.carbonIntensity,
      country: serverCarbon.region,
    },
    userSide: {
      energyKwh: Number(userEnergyKwh.toFixed(6)),
      co2Grams: Number(userCo2Grams.toFixed(4)),
      carbonIntensity: userCarbon.carbonIntensity,
      country: userCarbon.region,
    },
    combined: {
      totalEnergyKwh: Number(energyKwh.toFixed(6)),
      totalCo2Grams: Number((serverCo2Grams + userCo2Grams).toFixed(4)),
    },
    breakdown: {
      low: Number((energyLow * avgCarbonIntensity).toFixed(4)),
      medium: Number((energyKwh * avgCarbonIntensity).toFixed(4)),
      high: Number((energyHigh * avgCarbonIntensity).toFixed(4)),
    },
  }
}

/**
 * Calculate grade based on CO2 emissions
 */
export function calculateGrade(co2Grams: number): string {
  if (co2Grams < 0.5) return "A+"
  if (co2Grams < 1.0) return "A"
  if (co2Grams < 1.5) return "B"
  if (co2Grams < 2.0) return "C"
  if (co2Grams < 3.0) return "D"
  return "F"
}

/**
 * Calculate carbon score (0-100, higher is better)
 */
export function calculateCarbonScore(co2Grams: number): number {
  // Score based on logarithmic scale
  // 0.5g = 100, 5g = 0
  const score = Math.max(0, Math.min(100, 100 - (co2Grams / 5) * 100))
  return Math.round(score)
}

/**
 * Get real-world equivalents
 */
export function getRealWorldEquivalents(co2Grams: number) {
  return {
    treesNeeded: Number((co2Grams / 21000).toFixed(4)), // 1 tree absorbs ~21kg CO2/year
    phoneCharges: Number((co2Grams / 0.8).toFixed(1)), // 1 phone charge = ~0.8g CO2
    carDistanceKm: Number((co2Grams / 120).toFixed(4)), // Average car = ~120g CO2/km
    lightBulbHours: Number((co2Grams / 0.5).toFixed(1)), // LED bulb = ~0.5g CO2/hour
  }
}
