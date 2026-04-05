import { WebsiteCrawl, WebsiteCrawlPage } from "../model"
import { Op } from "sequelize"
import { aggregateResults } from "../utils/crawlAggregator"
import { discoverPages } from "./crawlQueue.service"
import { calculateCarbonEmissions, calculateGrade, calculateCarbonScore, getRealWorldEquivalents } from "../utils/carbonCalculator"
import { getServerIpFromUrl, getGeolocationFromIp } from "../utils/ipGeolocation"

// Global mutex — only one Lighthouse/Chrome instance at a time to prevent ERR_INTERNAL_ASSERTION
let lighthouseLock = false
const lighthouseQueue: Array<() => void> = []

const acquireLighthouseLock = (): Promise<void> => {
    return new Promise((resolve) => {
        if (!lighthouseLock) {
            lighthouseLock = true
            resolve()
        } else {
            lighthouseQueue.push(resolve)
        }
    })
}

const releaseLighthouseLock = () => {
    const next = lighthouseQueue.shift()
    if (next) {
        next()
    } else {
        lighthouseLock = false
    }
}

export const scanPageFull = async (url: string, userIp: string) => {
    const [userGeo, serverIp] = await Promise.all([
        getGeolocationFromIp(userIp),
        getServerIpFromUrl(url),
    ])
    const serverGeo = serverIp ? await getGeolocationFromIp(serverIp) : { countryCode: "GLOBAL", country: "Unknown" }

    const dynamicImport = new Function("specifier", "return import(specifier)")
    const chromeLauncherModule = await dynamicImport("chrome-launcher")
    const chromeLauncher = chromeLauncherModule.default || chromeLauncherModule
    const lighthouseModule = await dynamicImport("lighthouse")
    const lighthouse = lighthouseModule.default || lighthouseModule

    // Acquire lock before launching Chrome — prevents port conflicts
    await acquireLighthouseLock()

    // Wait for any previous Chrome instance to fully release its port
    await new Promise(res => setTimeout(res, 800))

    let chrome: any = null
    try {
        chrome = await chromeLauncher.launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu", "--no-zygote"] })
        // Settle time to avoid stale performance marks from previous instance
        await new Promise(res => setTimeout(res, 500))
        const options = {
            logLevel: "error",
            output: "json",
            port: chrome.port,
            throttling: {
                rttMs: 40,
                throughputKbps: 10 * 1024,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 10 * 1024,
                uploadThroughputKbps: 5 * 1024,
            },
            throttlingMethod: "simulate",
        } as const

        const runnerResult = await lighthouse(url, options)
        const lhr = runnerResult?.lhr
        if (!lhr) throw new Error("Lighthouse failed for: " + url)

        const totalBytes = lhr.audits["total-byte-weight"]?.numericValue ?? 0

        const resourceSummary = (lhr.audits["resource-summary"]?.details as any)?.items || []
        const breakdown = resourceSummary.map((item: any) => ({
            type: item.resourceType,
            sizeBytes: item.transferSize || 0,
            sizeMb: Number(((item.transferSize || 0) / (1024 * 1024)).toFixed(2)),
            requests: item.requestCount || 0,
        }))

        const jsSize = breakdown.find((b: any) => b.type === "script")?.sizeBytes || 0
        const unusedJsBytes = lhr.audits["unused-javascript"]?.details?.overallSavingsBytes || 0
        const unusedJsPercent = jsSize > 0 ? Math.min(100, Math.round((unusedJsBytes / jsSize) * 100)) : 0

        const cssSize = breakdown.find((b: any) => b.type === "stylesheet")?.sizeBytes || 0
        const unusedCssBytes = lhr.audits["unused-css-rules"]?.details?.overallSavingsBytes || 0
        const unusedCssPercent = cssSize > 0 ? Math.min(100, Math.round((unusedCssBytes / cssSize) * 100)) : 0

        const unusedJsFiles = (lhr.audits["unused-javascript"]?.details?.items || []).map((item: any) => ({
            url: item.url, totalBytes: item.totalBytes, wastedBytes: item.wastedBytes,
            wastedPercent: Math.round((item.wastedBytes / item.totalBytes) * 100),
        }))
        const unusedCssFiles = (lhr.audits["unused-css-rules"]?.details?.items || []).map((item: any) => ({
            url: item.url, totalBytes: item.totalBytes, wastedBytes: item.wastedBytes,
            wastedPercent: Math.round((item.wastedBytes / item.totalBytes) * 100),
        }))

        const performanceScore = Math.round((lhr.categories.performance?.score ?? 0) * 100)
        const largestContentfulPaint = lhr.audits["largest-contentful-paint"]?.numericValue ?? 0

        const carbonData = await calculateCarbonEmissions({
            totalBytes,
            serverCountryCode: serverGeo.countryCode,
            userCountryCode: userGeo.countryCode,
        })

        const totalCo2Grams = carbonData.combined.totalCo2Grams
        const grade = calculateGrade(totalCo2Grams)
        const carbonScore = calculateCarbonScore(totalCo2Grams)
        const equivalents = getRealWorldEquivalents(totalCo2Grams)
        const pageSizeMb = Number((totalBytes / (1024 * 1024)).toFixed(2))

        const largestFiles = ((lhr.audits["network-requests"]?.details as any)?.items || [])
            .filter((item: any) => item.transferSize > 0)
            .sort((a: any, b: any) => b.transferSize - a.transferSize)
            .slice(0, 5)
            .map((item: any) => ({
                file: item.url.split("/").pop() || item.url,
                url: item.url,
                sizeKb: Math.round(item.transferSize / 1024),
                sizeMb: Number((item.transferSize / (1024 * 1024)).toFixed(2)),
                co2Grams: Number(((item.transferSize / totalBytes) * totalCo2Grams).toFixed(4)),
                percentOfTotal: Math.round((item.transferSize / totalBytes) * 100),
                type: item.resourceType,
            }))

        const thirdPartyItems = largestFiles.filter((item: any) => {
            try {
                return new URL(item.url).hostname !== new URL(url).hostname
            } catch { return false }
        })
        const thirdPartySizeBytes = thirdPartyItems.reduce((sum: number, item: any) => sum + item.sizeKb * 1024, 0)
        const thirdPartyCo2 = Number(((thirdPartySizeBytes / totalBytes) * totalCo2Grams).toFixed(4))

        const quickWins: any[] = []
        const largeImages = largestFiles.filter((f: any) => f.type === "image" && f.sizeKb > 300)
        if (largeImages.length > 0) {
            const imageBytes = largeImages.reduce((sum: number, img: any) => sum + img.sizeKb * 1024 * 0.7, 0)
            quickWins.push({
                priority: 1, action: "Compress large images", effort: "10-20 minutes",
                co2SavedGrams: Number(((imageBytes / totalBytes) * totalCo2Grams).toFixed(4)),
                percentImprovement: Math.round((imageBytes / totalBytes) * 100),
                howTo: "Use WebP/AVIF and lazy loading",
                files: largeImages.map((img: any) => img.url),
            })
        }
        if (unusedJsPercent > 30) {
            quickWins.push({
                priority: 2, action: "Remove unused JavaScript", effort: "30-60 minutes",
                co2SavedGrams: Number(((unusedJsBytes / totalBytes) * totalCo2Grams).toFixed(4)),
                percentImprovement: Math.round((unusedJsBytes / totalBytes) * 100),
                howTo: "Use webpack-bundle-analyzer, tree-shaking, and code-splitting",
                details: `${unusedJsPercent}% of JavaScript is unused (${Math.round(unusedJsBytes / 1024)} KB)`,
            })
        }
        if (unusedCssPercent > 30) {
            quickWins.push({
                priority: 3, action: "Remove unused CSS", effort: "15-30 minutes",
                co2SavedGrams: Number(((unusedCssBytes / totalBytes) * totalCo2Grams).toFixed(4)),
                percentImprovement: Math.round((unusedCssBytes / totalBytes) * 100),
                howTo: "Use PurgeCSS, UnCSS, or critical CSS extraction",
                details: `${unusedCssPercent}% of CSS is unused (${Math.round(unusedCssBytes / 1024)} KB)`,
            })
        }

        const topQuickWins = quickWins.slice(0, 3)
        const potentialSavingsBytes = topQuickWins.reduce((sum, qw) => sum + (qw.co2SavedGrams / totalCo2Grams) * totalBytes, 0)
        const optimizedBytes = totalBytes - potentialSavingsBytes
        const optimizedCo2 = totalCo2Grams - topQuickWins.reduce((sum, qw) => sum + qw.co2SavedGrams, 0)
        const optimizedLoadTime = totalBytes > 0 ? largestContentfulPaint * (optimizedBytes / totalBytes) : largestContentfulPaint
        const industryAvgCo2 = 1.6
        const comparisonPercent = Math.round(((totalCo2Grams - industryAvgCo2) / industryAvgCo2) * 100)

        return {
            url,
            summary: {
                grade, carbonScore, co2Grams: totalCo2Grams, pageSizeMb,
                loadTimeSec: Number((largestContentfulPaint / 1000).toFixed(2)),
                performanceScore, equivalents,
                comparison: {
                    yourSite: totalCo2Grams, industryAverage: industryAvgCo2,
                    status: comparisonPercent > 0 ? `${comparisonPercent}% worse than average` : `${Math.abs(comparisonPercent)}% better than average`,
                },
            },
            locations: {
                server: { ip: serverIp || "unknown", country: serverGeo.country, countryCode: serverGeo.countryCode, carbonIntensity: carbonData.serverSide.carbonIntensity, energyKwh: carbonData.serverSide.energyKwh, co2Grams: carbonData.serverSide.co2Grams },
                user: { ip: userIp, country: userGeo.country, countryCode: userGeo.countryCode, carbonIntensity: carbonData.userSide.carbonIntensity, energyKwh: carbonData.userSide.energyKwh, co2Grams: carbonData.userSide.co2Grams },
                combined: carbonData.combined,
            },
            breakdown: {
                byType: breakdown.map((b: any) => ({ ...b, percent: Math.round((b.sizeBytes / totalBytes) * 100), co2Grams: Number(((b.sizeBytes / totalBytes) * totalCo2Grams).toFixed(4)) })),
                largestFiles,
                unusedCode: {
                    js: { totalKb: Math.round(jsSize / 1024), unusedKb: Math.round(unusedJsBytes / 1024), unusedPercent: unusedJsPercent, co2WastedGrams: Number(((unusedJsBytes / totalBytes) * totalCo2Grams).toFixed(4)), files: unusedJsFiles },
                    css: { totalKb: Math.round(cssSize / 1024), unusedKb: Math.round(unusedCssBytes / 1024), unusedPercent: unusedCssPercent, co2WastedGrams: Number(((unusedCssBytes / totalBytes) * totalCo2Grams).toFixed(4)), files: unusedCssFiles },
                },
                thirdParty: { count: thirdPartyItems.length, totalSizeKb: Math.round(thirdPartySizeBytes / 1024), co2Grams: thirdPartyCo2, percentOfTotal: Math.round((thirdPartySizeBytes / totalBytes) * 100), items: thirdPartyItems.slice(0, 5) },
            },
            projections: {
                current: { pageSizeMb, co2Grams: totalCo2Grams, loadTimeSec: Number((largestContentfulPaint / 1000).toFixed(2)) },
                ifOptimized: { pageSizeMb: Number((optimizedBytes / (1024 * 1024)).toFixed(2)), co2Grams: Number(optimizedCo2.toFixed(4)), loadTimeSec: Number((optimizedLoadTime / 1000).toFixed(2)), improvement: `${Math.round(((totalCo2Grams - optimizedCo2) / totalCo2Grams) * 100)}% reduction` },
            },
            quickWins: topQuickWins,
            // expose these flat for aggregator
            co2Grams: totalCo2Grams,
            carbonScore,
            pageSizeMb,
            grade,
            lighthouseVersion: lhr.lighthouseVersion || "unknown",
        }
    } finally {
        if (chrome) {
            try { await chrome.kill() } catch (_) {}
        }
        // Release lock so next scan can proceed
        releaseLighthouseLock()
    }
}

export const runCrawlJob = async (jobId: number, userIp: string, limit: number) => {
    const job = await WebsiteCrawl.findByPk(jobId)
    if (!job) return

    try {
        job.status = "running"
        await job.save()

        // Reset any pages stuck in "running" from previous pause or crash
        // Also mark pages stuck in "running" for more than 5 minutes as failed
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const stuckPages = await WebsiteCrawlPage.findAll({
            where: {
                jobId,
                status: "running",
                updatedAt: { [Op.lt]: fiveMinutesAgo }
            }
        })

        for (const page of stuckPages) {
            page.status = "failed"
            page.errorMessage = "Scan timeout - page took too long"
            await page.save()
        }

        // Reset recently running pages to pending (from pause/resume)
        await WebsiteCrawlPage.update(
            { status: "pending" },
            { where: { jobId, status: "running" } }
        )

        // Discover pages and save them all as "pending" if not already done
        let pendingPages = await WebsiteCrawlPage.findAll({ where: { jobId, status: "pending" } })

        if (pendingPages.length === 0 && job.totalPages === null) {
            // First run — discover and save all pages
            const urls = await discoverPages(job.rootUrl, limit)
            job.totalPages = urls.length
            await job.save()

            await WebsiteCrawlPage.bulkCreate(urls.map(url => ({ jobId, url, status: "pending" })))
            pendingPages = await WebsiteCrawlPage.findAll({ where: { jobId, status: "pending" } })
        }

        // If no pending pages but job is not completed, check if we need to build final report
        if (pendingPages.length === 0) {
            const completedPages = await WebsiteCrawlPage.findAll({ where: { jobId, status: "completed" } })

            if (completedPages.length > 0) {
                const pageReports = completedPages.map(p => p.reportJson)
                const summary = aggregateResults(pageReports)
                job.pagesScanned = completedPages.length
                job.reportJson = {
                    site: job.rootUrl,
                    totalPagesDiscovered: job.totalPages,
                    pagesScanned: completedPages.length,
                    summary,
                    pages: pageReports,
                    meta: { tier: "go", scannedAt: new Date().toISOString() },
                }
                job.status = "completed"
                await job.save()
            }
            return
        }

        for (const page of pendingPages) {
            page.status = "running"
            await page.save()

            let attempt = 0
            const maxAttempts = 2
            let lastError: any = null

            while (attempt < maxAttempts) {
                try {
                    const result = await scanPageFull(page.url, userIp)
                    page.reportJson = result
                    page.status = "completed"
                    await page.save()
                    job.pagesScanned += 1

                    // ── Rebuild aggregated report after every completed page ──
                    // This ensures partial results are always visible (pause/resume safe)
                    const allCompleted = await WebsiteCrawlPage.findAll({ where: { jobId, status: "completed" } })
                    const pageReports = allCompleted.map((p: any) => p.reportJson)
                    const partialSummary = aggregateResults(pageReports)
                    job.reportJson = {
                        site: job.rootUrl,
                        totalPagesDiscovered: job.totalPages,
                        pagesScanned: allCompleted.length,
                        summary: partialSummary,
                        pages: pageReports,
                        meta: { tier: "go", scannedAt: new Date().toISOString(), partial: true },
                    }
                    await job.save()

                    lastError = null
                    break
                } catch (err: any) {
                    lastError = err
                    const isLighthouseMarkError = err?.message?.includes('performance mark') || err?.message?.includes('lh:runner')
                    if (isLighthouseMarkError && attempt < maxAttempts - 1) {
                        // wait a bit and retry — stale performance marks clear after a moment
                        await new Promise(res => setTimeout(res, 2000))
                    }
                    attempt++
                }
            }

            if (lastError) {
                page.status = "failed"
                page.errorMessage = lastError?.message || "Scan failed"
                await page.save()
                console.log("Scan failed for:", page.url, lastError?.message)
            }

            // Check if job was paused AFTER completing current page
            await job.reload()
            if ((job.status as string) === "paused") {
                console.log(`[crawlWorker] Job ${jobId} paused after completing ${page.url}`)
                return
            }
        }

        // Check if paused after loop (edge case: paused on last page)
        await job.reload()
        if ((job.status as string) === "paused") return

        // All pages done — build final report from completed pages
        const completedPages = await WebsiteCrawlPage.findAll({ where: { jobId, status: "completed" } })
        const pageReports = completedPages.map(p => p.reportJson)
        const summary = aggregateResults(pageReports)

        job.reportJson = {
            site: job.rootUrl,
            totalPagesDiscovered: job.totalPages,
            pagesScanned: completedPages.length,
            summary,
            pages: pageReports,
            meta: { tier: "go", scannedAt: new Date().toISOString() },
        }
        job.status = "completed"
        await job.save()

    } catch (err: any) {
        job.status = "failed"
        job.errorMessage = err?.message || "Unknown error"
        await job.save()
    }
}
