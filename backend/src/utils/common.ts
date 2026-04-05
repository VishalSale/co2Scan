import { calculateCarbonEmissions, calculateGrade, calculateCarbonScore, getRealWorldEquivalents } from "./carbonCalculator"
import { getGeolocationFromIp, getServerIpFromUrl } from "./ipGeolocation"
import { TryError } from "./error"

export const CorsConfig = {
    origin: process.env.CLIENT,
    credentials: true
}

export const normalizeUrl = (url: string) => {
    return url.trim().toLowerCase().replace(/\/$/, "")
}

export const ApiResponse = (response: any, data: { message?: string; data?: any; status?: number }) => {
    return response.status(data.status || 200).json({
        message: data.message || null,
        data: data.data || null,
        success: data.status ? data.status >= 200 && data.status < 300 : true,
        status: data.status || 200
    })
}

export interface ScanOptions {
    url: string
    userIp: string
    tier: "guest" | "free"
    scansRemainingToday: number
    protocol: string
    host: string
    startTime: number
}

export interface ScanReport {
    summary: any
    locations: any
    breakdown: any
    projections: any
    quickWins: any[]
    badge: any
    limitations: any
    meta: any
}

export async function runLighthouseScan(opts: ScanOptions): Promise<ScanReport> {
    const { url, userIp, tier, scansRemainingToday, protocol, host, startTime } = opts

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

    const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless", "--no-sandbox"] })

    try {
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
        if (!lhr) throw TryError("Failed to generate Lighthouse report", 500)

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
            badge: {
                grade, carbonScore,
                shareUrl: `${protocol}://${host}/badge/${url}`,
                embedCode: `<img src="${protocol}://${host}/badge/${url}.svg" alt="Carbon Grade ${grade}" />`,
            },
            limitations: {
                tier,
                message: tier === "guest" ? "Sign up for free to get 10 scans/day and history tracking" : "Upgrade to Go for unlimited scans, full recommendations, and history tracking",
                upgradeUrl: "/pricing",
            },
            meta: {
                scannedAt: new Date().toISOString(),
                scanDurationSeconds: Number(((Date.now() - startTime) / 1000).toFixed(2)),
                scansRemainingToday,
                lighthouseVersion: lhr.lighthouseVersion || "unknown",
                cached: false,
            },
        }
    } finally {
        await chrome.kill()
    }
}
