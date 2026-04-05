import { calculateGrade } from "./carbonCalculator"

export const aggregateResults = (pages: any[]) => {
  // Filter out failed/empty scans (zero bytes = lighthouse got nothing)
  const validPages = pages.filter(p => p && (p.co2Grams ?? 0) > 0)

  if (!validPages.length) {
    return {
      pagesScanned: 0,
      averageCo2: 0,
      averageCarbonScore: 0,
      averagePageSizeMb: 0,
      grade: "F",
      worstPages: [],
    }
  }

  const totalCo2 = validPages.reduce((sum, p) => sum + (p.co2Grams ?? 0), 0)
  const totalCarbonScore = validPages.reduce((sum, p) => sum + (p.carbonScore ?? 0), 0)
  const totalPageSize = validPages.reduce((sum, p) => sum + (p.pageSizeMb ?? 0), 0)

  const averageCo2 = totalCo2 / validPages.length
  const averageCarbonScore = Math.round(totalCarbonScore / validPages.length)
  const averagePageSizeMb = Number((totalPageSize / validPages.length).toFixed(2))
  const grade = calculateGrade(averageCo2)

  const worstPages = [...validPages]
    .sort((a, b) => (b.co2Grams ?? 0) - (a.co2Grams ?? 0))
    .slice(0, 5)
    .map(p => ({
      url: p.url,
      co2Grams: p.co2Grams,
      pageSizeMb: p.pageSizeMb,
      grade: p.grade,
    }))

  return {
    pagesScanned: validPages.length,
    averageCo2: Number(averageCo2.toFixed(4)),
    averageCarbonScore,
    averagePageSizeMb,
    grade,
    worstPages,
  }
}
