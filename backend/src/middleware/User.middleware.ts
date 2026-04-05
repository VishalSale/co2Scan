import { Request, Response, NextFunction } from "express"
import { CatchError, TryError } from "../utils/error"
import jwt, { JwtPayload } from "jsonwebtoken"
import dotenv from "dotenv"
import { jwtPayload } from "../utils/types"
dotenv.config()

export interface UserSessionInterface extends Request {
    session?: jwtPayload
}

export const userMiddleware = (request: UserSessionInterface, response: Response, next: NextFunction) => {
    try {
        const token = request.cookies.userAccessToken
        if (!token)
            throw TryError("Unauthorized access", 401)

        const data = jwt.verify(token, process.env.NODE_AUTH_SECRET as string) as jwtPayload
        request.session = {
            id: data.id,
            name: data.name,
            mobile: data.mobile || null,
            email: data.email,
            status: data.status,
            planType: data.planType
        }

        next()
    } catch (error) {
        CatchError(error, response)
    }
}