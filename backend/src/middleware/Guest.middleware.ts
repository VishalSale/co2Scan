
import { Request, Response, NextFunction } from "express"
import { TryError } from "../utils/error"

export interface GuestSessionInterface extends Request {
}

export const guestSessionMiddleware = (request: GuestSessionInterface, response: Response, next: NextFunction) => {
    const token = request.cookies.adminAccessToken
    if (token)
        throw TryError("Logout first", 401)

    next()
}