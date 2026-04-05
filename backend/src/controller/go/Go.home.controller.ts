import { ValidationError, TryError, CatchError } from "../../utils/error"
import { getCo2ConsumptionValidationSchema } from "../../validator/Go.validator"
import { checkRateLimit } from "../../services/rateLimiter.service"
import { generateFingerprint } from "../../utils/fingerprint"
import { WebsiteCrawl, WebsiteCrawlPage } from "../../model"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { normalizeUrl, ApiResponse } from "../../utils/common"
import { PlanType as ConstantPlanType } from "../../config/constant"
import { PlanType, getPlanLimits } from "../../config/plans"
import { runCrawlJob } from "../../services/crawlWorker.service"
import { Op } from "sequelize"
import { Response } from "express"

const goPlanGuard = (request: UserSessionInterface, response: Response): boolean => {
    if (request.session?.planType !== ConstantPlanType.go) {
        ApiResponse(response, { message: "Available only for GO plan", status: 403 })
        return false
    }
    return true
}

export const crawlWebsiteCo2 = async (request: UserSessionInterface, response: Response) => {
    try {
        if (!goPlanGuard(request, response)) return

        const { error, value: payload } = getCo2ConsumptionValidationSchema.validate(request.body || {}, { abortEarly: false })
        if (error) return ValidationError(error, response, 422)

        const userId = request.session?.id
        const userIp = (request.headers["x-forwarded-for"] as string)?.split(",")[0] || request.ip || "unknown"
        const userFingerprint = generateFingerprint(request)
        const rootUrl = normalizeUrl(payload.url)

        const goLimits = getPlanLimits(PlanType.GO)
        const rateLimit = await checkRateLimit(userIp, userFingerprint, rootUrl, PlanType.GO)
        if (!rateLimit.allowed)
            throw TryError(`GO plan allows ${goLimits.scansPerDay} site crawls per day. Try again after ${rateLimit.resetAt.toISOString()}`, 429)

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const cachedJob = await WebsiteCrawl.findOne({
            where: { rootUrl, userId, status: "completed", createdAt: { [Op.gte]: oneDayAgo } },
            order: [["createdAt", "DESC"]],
        })

        if (cachedJob?.reportJson && (cachedJob.reportJson as any).summary) {
            return ApiResponse(response, {
                message: "Cached result returned",
                data: { jobId: cachedJob.id, status: "completed", cached: true, cachedAt: cachedJob.createdAt, report: cachedJob.reportJson }
            })
        }

        const job = await WebsiteCrawl.create({
            userId, rootUrl, status: "pending", pagesScanned: 0,
            createdBy: ConstantPlanType.go, createdById: userId, createdByIpAddress: userIp,
        })

        runCrawlJob(job.id, userIp, goLimits.pagesPerScan).catch((err) => {
            console.error("Crawl job failed for jobId:", job.id, err)
        })

        ApiResponse(response, {
            message: "Crawl started. Use jobId to check status or pause/resume.",
            data: { jobId: job.id, statusUrl: `/api/go/home/crawl-status/${job.id}` },
            status: 202
        })
    } catch (error) {
        CatchError(error, response)
    }
}

export const getCrawlStatus = async (request: UserSessionInterface, response: Response) => {
    try {
        if (!goPlanGuard(request, response)) return

        const userId = request.session?.id
        const job = await WebsiteCrawl.findOne({ where: { id: request.params.jobId, userId } })
        if (!job) throw TryError("Job not found", 404)

        const [running, completed, pending, failed] = await Promise.all([
            WebsiteCrawlPage.count({ where: { jobId: job.id, status: "running" } }),
            WebsiteCrawlPage.count({ where: { jobId: job.id, status: "completed" } }),
            WebsiteCrawlPage.count({ where: { jobId: job.id, status: "pending" } }),
            WebsiteCrawlPage.count({ where: { jobId: job.id, status: "failed" } }),
        ])

        if (job.status === "failed") throw TryError(job.errorMessage || "Crawl failed", 500)

        if (job.status === "pending" || job.status === "running" || job.status === "paused") {
            const scannedPages = await WebsiteCrawlPage.findAll({
                where: { jobId: job.id, status: "completed" },
                attributes: ["url", "reportJson"],
            })
            return ApiResponse(response, {
                data: {
                    jobId: job.id, status: job.status, site: job.rootUrl,
                    progress: { totalPages: job.totalPages ?? "discovering...", running, completed, pending, failed },
                    scannedPages: scannedPages.map(p => p.reportJson),
                }
            })
        }

        ApiResponse(response, { data: { jobId: job.id, status: "completed", report: job.reportJson } })
    } catch (error) {
        CatchError(error, response)
    }
}

export const pauseCrawl = async (request: UserSessionInterface, response: Response) => {
    try {
        if (!goPlanGuard(request, response)) return
        const userId = request.session?.id
        const job = await WebsiteCrawl.findOne({ where: { id: request.params.jobId, userId } })
        if (!job) throw TryError("Job not found", 404)
        if (job.status !== "running" && job.status !== "pending")
            throw TryError(`Cannot pause a job with status: ${job.status}`, 400)
        job.status = "paused"
        await job.save()
        ApiResponse(response, { message: "Crawl will pause after current page finishes.", data: { jobId: job.id, status: "paused" } })
    } catch (error) {
        CatchError(error, response)
    }
}

export const resumeCrawl = async (request: UserSessionInterface, response: Response) => {
    try {
        if (!goPlanGuard(request, response)) return
        const userId = request.session?.id
        const userIp = (request.headers["x-forwarded-for"] as string)?.split(",")[0] || request.ip || "unknown"
        const job = await WebsiteCrawl.findOne({ where: { id: request.params.jobId, userId } })
        if (!job) throw TryError("Job not found", 404)
        if (job.status !== "paused") throw TryError(`Cannot resume a job with status: ${job.status}`, 400)
        const goLimits = getPlanLimits(PlanType.GO)
        job.status = "running"
        await job.save()
        runCrawlJob(job.id, userIp, goLimits.pagesPerScan).catch((err) => {
            console.error("Crawl resume failed for jobId:", job.id, err)
        })
        ApiResponse(response, { message: "Crawl resumed from where it left off.", data: { jobId: job.id, status: "running" } })
    } catch (error) {
        CatchError(error, response)
    }
}
