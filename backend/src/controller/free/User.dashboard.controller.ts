import { Response } from "express"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { CatchError, TryError } from "../../utils/error"
import { GuestScan } from "../../model"
import { ApiResponse } from "../../utils/common"

export const getOverallCount = async (request: UserSessionInterface, response: Response) => {
    try {
        const userId = request.session?.id
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const { count, rows } = await GuestScan.findAndCountAll({
            where: { userId, planType: "free" },
            attributes: ["id", "reportJson", "createdAt"]
        })

        if (!rows.length)
            throw TryError("Data not found", 404)

        let totalCarbonScore = 0
        let totalCo2 = 0
        let monthlyCount = 0

        rows.forEach((row: any) => {
            const report = row.reportJson
            totalCarbonScore += report?.summary?.carbonScore || 0
            totalCo2 += report?.summary?.co2Grams || 0
            if (row.createdAt >= startOfMonth && row.createdAt <= endOfMonth)
                monthlyCount++
        })

        const avgCarbonScore = count > 0 ? (totalCarbonScore / count).toFixed(2) : 0
        ApiResponse(response, { data: { totalScans: count, avgCarbonScore, totalCo2: totalCo2.toFixed(4), thisMonthScans: monthlyCount } })
    } catch (error) {
        CatchError(error, response)
    }
}
