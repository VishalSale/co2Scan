import GuestScan from "../model/guestScan.model"
import { Op } from "sequelize"
import { PlanType, getPlanLimits } from "../config/plans"

/**
 * Check if user has exceeded rate limit
 * Uses both IP and fingerprint to prevent bypass
 * Counts unique URLs scanned in the last 24 hours
 */
export async function checkRateLimit(userIp: string, userFingerprint: string, currentUrl: string, planType: PlanType = PlanType.GUEST): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limits = getPlanLimits(planType)

  // If unlimited scans (-1), always allow
  if (limits.scansPerDay === -1) {
    return {
      allowed: true,
      remaining: -1, // unlimited
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Get all unique URLs scanned by this IP OR fingerprint in the last 24 hours
  const scannedUrls = await GuestScan.findAll({
    where: {
      [Op.or]: [{ userIp }, { userFingerprint }],
      createdAt: { [Op.gte]: oneDayAgo, },
    },
    attributes: ["url"],
    group: ["url"],
    raw: true,
  })

  const uniqueUrlsScanned = scannedUrls.map((scan: any) => scan.url)
  const uniqueCount = uniqueUrlsScanned.length

  // Check if current URL was already scanned (won't count against limit)
  const isAlreadyScanned = uniqueUrlsScanned.includes(currentUrl)

  // Calculate remaining scans
  const remaining = isAlreadyScanned
    ? Math.max(0, limits.scansPerDay - uniqueCount)
    : Math.max(0, limits.scansPerDay - uniqueCount - 1)

  // Allow if under limit OR if rescanning an already-scanned URL
  const allowed = isAlreadyScanned || uniqueCount < limits.scansPerDay

  // Reset time is 24 hours from now
  // const resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const firstScan = await GuestScan.findOne({
    where: {
      [Op.or]: [{ userIp }, { userFingerprint }],
      createdAt: { [Op.gte]: oneDayAgo },
    },
    order: [["createdAt", "ASC"]],
  })

  const resetAt = firstScan
    ? new Date(new Date(firstScan.createdAt).getTime() + 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000)

  return { allowed, remaining, resetAt }
}

export const getCachedScan = async (url: string) => {
  const cacheExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const cachedScan = await GuestScan.findOne({
    where: { url, createdAt: { [Op.gte]: cacheExpiry, }, },
    order: [["createdAt", "DESC"]],
  })

  if (cachedScan) {
    const report = cachedScan.reportJson as any

    // Guard: if stored report is missing key fields, skip cache and re-scan
    if (!report || !report.summary || !report.meta) {
      return null
    }

    return {
      ...report,
      meta: {
        ...report.meta,
        cached: true,
        cachedAt: cachedScan.createdAt,
      },
    }
  }

  return null
}
