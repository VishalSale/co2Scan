import { Response } from "express"
import { CatchError } from "../../utils/error"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { ApiResponse } from "../../utils/common"

export const getCurrentUser = async (request: UserSessionInterface, response: Response) => {
    try {
        const userData = {
            id: request.session?.id,
            name: request.session?.name,
            email: request.session?.email,
            mobile: request.session?.mobile || null,
            status: request.session?.status,
            type: request.session?.planType
        }
        
        ApiResponse(response, { message: "User data retrieved", data: { user: userData } })
    } catch (error) {
        CatchError(error, response)
    }
}
