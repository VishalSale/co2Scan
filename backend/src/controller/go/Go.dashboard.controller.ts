import { Response } from "express"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { CatchError, TryError } from "../../utils/error"
import { WebsiteCrawl } from "../../model"
import { ApiResponse } from "../../utils/common"

export const getOverallCount = async (request: UserSessionInterface, response: Response) => {
    try {
        const userId = request.session?.id
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const { count, rows } = await WebsiteCrawl.findAndCountAll({
            where: { userId },
            attributes: ["id", "reportJson", "pagesScanned", "totalPages", "status", "createdAt"]
        })

        if (!rows.length)
            throw TryError("Data not found", 404)

        let totalCarbonScore = 0
        let totalCo2 = 0
        let monthlyCount = 0
        let totalPagesScanned = 0
        let completedCrawls = 0

        rows.forEach((row: any) => {
            const report = row.reportJson
            totalCarbonScore += report?.summary?.averageCarbonScore || 0
            totalCo2 += report?.summary?.averageCo2 || 0
            totalPagesScanned += row.pagesScanned || 0
            if (row.status === "completed") completedCrawls++
            if (row.createdAt >= startOfMonth && row.createdAt <= endOfMonth)
                monthlyCount++
        })

        const avgCarbonScore = count > 0 ? (totalCarbonScore / count).toFixed(2) : 0

        ApiResponse(response, {
            data: {
                totalScans: count,
                avgCarbonScore,
                totalCo2: totalCo2.toFixed(4),
                thisMonthScans: monthlyCount,
                totalPagesScanned,
                completedCrawls
            }
        })
    } catch (error) {
        CatchError(error, response)
    }
}
