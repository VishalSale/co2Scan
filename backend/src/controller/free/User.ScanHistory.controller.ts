import { Response } from "express"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { CatchError, TryError } from "../../utils/error"
import { GuestScan } from "../../model"
import { ApiResponse } from "../../utils/common"

export const getScanHistory = async (request: UserSessionInterface, response: Response) => {
    try {
        const { page = 1, limit = 10 } = request.query
        const pageNumber = Math.max(Number(page), 1)
        const pageSize = Math.max(Number(limit), 1)
        const offset = (pageNumber - 1) * pageSize
        const userId = request.session?.id

        const { count, rows } = await GuestScan.findAndCountAll({
            where: { userId, planType: "free" },
            attributes: ["id", "url", "pageSizeMb", "co2Grams", "carbonScore", "reportJson", "scanDurationSeconds", "grade", "createdAt"],
            order: [["createdAt", "DESC"]],
            limit: pageSize,
            offset,
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

        const data = await GuestScan.findOne({
            where: { id: Number(id), userId, planType: "free" },
            attributes: ["id", "url", "pageSizeMb", "co2Grams", "carbonScore", "reportJson", "scanDurationSeconds", "grade", "createdAt"],
        })

        if (!data)
            throw TryError("No scan history found", 404)

        ApiResponse(response, { message: "Scan history fetched successfully!", data })
    } catch (error) {
        CatchError(error, response)
    }
}