import { CookieOptions } from "express"
import jwt from 'jsonwebtoken'

export const generateToken = (payload:any, expiresIn: `${number}${'s' | 'm' | 'h' | 'd'}`) => {
    const accessToken = jwt.sign(payload, process.env.NODE_AUTH_SECRET!, { expiresIn })
    return accessToken
}

export const getOptions = ( maxAge: number ): CookieOptions  => {
    return {
        httpOnly: true,
        maxAge: maxAge,
        secure: false,
    }
}