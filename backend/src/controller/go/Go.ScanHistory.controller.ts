import { Response } from "express"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { TryError, CatchError } from "../../utils/error"
import { WebsiteCrawl, WebsiteCrawlPage, PlanType } from "../../model"
import { normalizeUrl, ApiResponse } from "../../utils/common"
import { getPlanLimits } from "../../config/plans"
import { runCrawlJob } from "../../services/crawlWorker.service"
import { PlanType as ConstantPlanType } from "../../config/constant"

const goPlanGuard = (request: UserSessionInterface, response: any): boolean => {
    if (request.session?.planType !== ConstantPlanType.go) {
        response.status(403).json({ message: "Available only for GO plan", upgradeUrl: "/pricing" })
        return false
    }
    return true
}

export const getScanHistory = async (request: UserSessionInterface, response: Response) => {
    try {
        const { page = 1, limit = 10 } = request.query
        const pageNumber = Math.max(Number(page), 1)
        const pageSize = Math.max(Number(limit), 1)
        const offset = (pageNumber - 1) * pageSize
        const userId = request.session?.id

        const { count, rows } = await WebsiteCrawl.findAndCountAll({
            where: { userId },
            attributes: ["id", "rootUrl", "status", "totalPages", "pagesScanned", "reportJson", "createdAt"],
            order: [["createdAt", "DESC"]],
            limit: pageSize,
            offset,
            include: [{
                model: WebsiteCrawlPage,
                as: "pages",
                attributes: ["id", "url", "status", "reportJson", "errorMessage"]
            }]
        })

        if (!rows.length)
            throw TryError("No scan history found", 404)

        const pagination: any = {
            total: count,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(count / pageSize)
        }

        ApiResponse(response, {
            message: "Scan history fetched successfully!",
            data: { data: rows, pagination }
        })
    } catch (error) {
        CatchError(error, response)
    }
}

export const getScanHistoryById = async (request: UserSessionInterface, response: Response) => {
    try {
        const id = request.params.id
        const userId = request.session?.id

        const data = await WebsiteCrawl.findOne({
            where: { id: Number(id), userId },
            attributes: ["id", "rootUrl", "status", "totalPages", "pagesScanned", "reportJson", "createdAt", "updatedAt"],
            include: [{
                model: WebsiteCrawlPage,
                as: "pages",
                attributes: ["id", "url", "status", "reportJson", "errorMessage", "createdAt", "updatedAt"],
                separate: true,
                order: [["createdAt", "ASC"]]
            }]
        })

        if (!data)
            throw TryError("Crawl not found", 404)

        ApiResponse(response, { message: "Crawl details fetched successfully!", data })
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

export const pauseAllCrawls = async (request: UserSessionInterface, response: Response) => {
    try {
        if (!goPlanGuard(request, response)) return
        const userId = request.session?.id
        const { Op } = await import("sequelize")
        const jobs = await WebsiteCrawl.findAll({
            where: { userId, status: { [Op.in]: ["running", "pending"] } }
        })
        for (const job of jobs) {
            job.status = "paused"
            await job.save()
        }
        ApiResponse(response, { message: `Paused ${jobs.length} crawl(s).`, data: { paused: jobs.length } })
    } catch (error) {
        CatchError(error, response)
    }
}

export const resumeAllCrawls = async (request: UserSessionInterface, response: Response) => {
    try {
        if (!goPlanGuard(request, response)) return
        const userId = request.session?.id
        const userIp = (request.headers["x-forwarded-for"] as string)?.split(",")[0] || request.ip || "unknown"
        const jobs = await WebsiteCrawl.findAll({ where: { userId, status: "paused" } })
        const goLimits = getPlanLimits(PlanType.GO)
        for (const job of jobs) {
            job.status = "running"
            await job.save()
            runCrawlJob(job.id, userIp, goLimits.pagesPerScan).catch((err) => {
                console.error("Resume all failed for jobId:", job.id, err)
            })
        }
        ApiResponse(response, { message: `Resumed ${jobs.length} crawl(s).`, data: { resumed: jobs.length } })
    } catch (error) {
        CatchError(error, response)
    }
}

export const getCo2Consumption = async (request: UserSessionInterface, response: Response) => {
    try {
        const pageId = request.params.id
        const userId = request.session?.id
        const userIp = (request.headers["x-forwarded-for"] as string)?.split(",")[0] || request.ip || "unknown"

        const page = await WebsiteCrawlPage.findOne({ where: { id: Number(pageId) } })
        if (!page) throw TryError("Page not found", 404)

        const job = await WebsiteCrawl.findOne({ where: { id: page.jobId, userId } })
        if (!job) throw TryError("Access denied", 403)

        page.status = "running"
        page.errorMessage = null
        await page.save()

        const { scanPageFull } = await import("../../services/crawlWorker.service")
        const result = await scanPageFull(normalizeUrl(page.url), userIp)

        page.reportJson = result
        page.status = "completed"
        await page.save()

        const completedCount = await WebsiteCrawlPage.count({ where: { jobId: job.id, status: "completed" } })
        const failedCount = await WebsiteCrawlPage.count({ where: { jobId: job.id, status: "failed" } })
        const pendingCount = await WebsiteCrawlPage.count({ where: { jobId: job.id, status: "pending" } })
        job.pagesScanned = completedCount

        const { aggregateResults } = await import("../../utils/crawlAggregator")
        const completedPages = await WebsiteCrawlPage.findAll({ where: { jobId: job.id, status: "completed" } })
        const pageReports = completedPages.map((p: any) => p.reportJson)
        const summary = aggregateResults(pageReports)
        job.reportJson = {
            site: job.rootUrl,
            totalPagesDiscovered: job.totalPages,
            pagesScanned: completedCount,
            summary,
            pages: pageReports,
            meta: { tier: "go", scannedAt: new Date().toISOString() },
        }

        if (failedCount === 0 && pendingCount === 0) job.status = "completed"
        await job.save()

        ApiResponse(response, { message: "Page scanned successfully", data: { pageId: page.id, status: "completed", result } })
    } catch (error) {
        try {
            const page = await WebsiteCrawlPage.findByPk(Number(request.params.id))
            if (page) { page.status = "failed"; page.errorMessage = (error as any)?.message; await page.save() }
        } catch (_) {}
        CatchError(error, response)
    }
}
