import { UserSessionInterface } from "../../middleware/User.middleware"
import { WebsiteCrawl, WebsiteCrawlPage } from "../../model"
import { CatchError, TryError } from "../../utils/error"
import { ApiResponse } from "../../utils/common"
import { Response } from "express"

export const getAnalyticsData = async (request: UserSessionInterface, response: Response) => {
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