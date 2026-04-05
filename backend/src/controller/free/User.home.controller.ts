import { ValidationError, TryError, CatchError } from "../../utils/error"
import { getCo2ConsumptionValidationSchema } from "../../validator/User.validator"
import { checkRateLimit, getCachedScan } from "../../services/rateLimiter.service"
import { generateFingerprint } from "../../utils/fingerprint"
import { GuestScan, PlanType } from "../../model"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { normalizeUrl, runLighthouseScan, ApiResponse } from "../../utils/common"
import { getGeolocationFromIp } from "../../utils/ipGeolocation"
import { Response } from "express"

export const getCo2Consumption = async (request: UserSessionInterface, response: Response) => {
  try {
    const startTime = Date.now()

    const { error, value: payload } = getCo2ConsumptionValidationSchema.validate(request.body || {}, { abortEarly: false })
    if (error) return ValidationError(error, response, 422)

    const userId = request.session?.id
    const userIp = (request.headers["x-forwarded-for"] as string)?.split(",")[0] || request.ip || "unknown"
    const userFingerprint = generateFingerprint(request)
    const url = normalizeUrl(payload.url)

    const rateLimit = await checkRateLimit(userIp, userFingerprint, url, PlanType.FREE)
    if (!rateLimit.allowed) {
      throw TryError(`Free tier allows 10 scans per day. Please try again after ${rateLimit.resetAt.toISOString()}`, 429)
    }

    const cachedResult = await getCachedScan(url)
    if (cachedResult) {
      return ApiResponse(response, { data: { ...cachedResult, meta: { ...cachedResult.meta, scansRemainingToday: rateLimit.remaining - 1 } } })
    }

    const report = await runLighthouseScan({
      url, userIp, tier: "free",
      scansRemainingToday: rateLimit.remaining - 1,
      protocol: request.protocol,
      host: request.get("host") || "",
      startTime,
    })

    const userGeo = await getGeolocationFromIp(userIp)

    await GuestScan.create({
      url, userId, planType: PlanType.FREE,
      userIp, userFingerprint,
      userCountry: userGeo.countryCode,
      serverIp: report.locations.server.ip,
      serverCountry: report.locations.server.countryCode,
      reportJson: report,
      carbonScore: report.summary.carbonScore,
      co2Grams: report.summary.co2Grams,
      pageSizeMb: report.summary.pageSizeMb,
      grade: report.summary.grade,
      scanDurationSeconds: report.meta.scanDurationSeconds,
      lighthouseVersion: report.meta.lighthouseVersion,
      createdBy: PlanType.FREE,
      createdById: userId,
      createdByIpAddress: userIp,
    })

    ApiResponse(response, { data: report })
  } catch (error) {
    CatchError(error, response)
  }
}
