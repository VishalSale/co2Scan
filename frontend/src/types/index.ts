export interface User {
  id: string
  name: string
  email: string
  type: 'free' | 'go'
  createdAt: string
}

export interface ScanResult {
  summary: {
    grade: string
    carbonScore: number
    co2Grams: number
    pageSizeMb: number
    loadTimeSec: number
    performanceScore: number
    equivalents: {
      treesNeeded: number
      phoneCharges: number
      carDistanceKm: number
      lightBulbHours: number
    }
    comparison: {
      yourSite: number
      industryAverage: number
      status: string
    }
  }
  locations: {
    server: {
      ip: string
      country: string
      countryCode: string
      carbonIntensity: number
      energyKwh: number
      co2Grams: number
    }
    user: {
      ip: string
      country: string
      countryCode: string
      carbonIntensity: number
      energyKwh: number
      co2Grams: number
    }
    combined: {
      totalCo2Grams: number
      totalEnergyKwh: number
    }
  }
  breakdown: {
    byType: Array<{
      type: string
      sizeBytes: number
      sizeMb: number
      requests: number
      percent: number
      co2Grams: number
    }>
    largestFiles: Array<{
      file: string
      url: string
      sizeKb: number
      sizeMb: number
      co2Grams: number
      percentOfTotal: number
      type: string
    }>
    unusedCode: {
      js: {
        totalKb: number
        unusedKb: number
        unusedPercent: number
        co2WastedGrams: number
        files: Array<{
          url: string
          totalBytes: number
          wastedBytes: number
          wastedPercent: number
        }>
      }
      css: {
        totalKb: number
        unusedKb: number
        unusedPercent: number
        co2WastedGrams: number
        files: Array<{
          url: string
          totalBytes: number
          wastedBytes: number
          wastedPercent: number
        }>
      }
    }
    thirdParty: {
      count: number
      totalSizeKb: number
      co2Grams: number
      percentOfTotal: number
    }
  }
  projections: {
    current: {
      pageSizeMb: number
      co2Grams: number
      loadTimeSec: number
    }
    ifOptimized: {
      pageSizeMb: number
      co2Grams: number
      loadTimeSec: number
      improvement: string
    }
  }
  quickWins: Array<{
    priority: number
    action: string
    effort: string
    co2SavedGrams: number
    percentImprovement: number
    howTo: string
    details?: string
  }>
  meta: {
    scannedAt: string
    scanDurationSeconds: number
    scansRemainingToday: number
    lighthouseVersion: string
    cached: boolean
  }
}

export interface ScanHistory {
  id: string
  url: string
  carbonScore: number
  co2Grams: number
  grade: string
  pageSizeMb: number
  createdAt: string
}

export interface DashboardStats {
  totalScans: number
  averageCarbonScore: number
  totalCo2Emissions: number
  scansThisMonth: number
  scansRemainingToday: number
}
