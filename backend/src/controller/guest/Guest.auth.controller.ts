import { Request, Response } from "express"
import { TryError, CatchError, ValidationError } from "../../utils/error"
import { GuestSessionInterface } from "../../middleware/Guest.middleware"
import { loginValidationSchema, registerUserValidationSchema } from "../../validator/User.validator"
import { User } from "../../model"
import { Op } from "sequelize"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { ApiResponse } from "../../utils/common"
import { getOptions } from "../../utils/tokenConfiguration"
import { jwtPayload } from "../../utils/types"

export const registerUser = async (request: GuestSessionInterface, response: Response) => {
    try {
        const { error, value: payload } = registerUserValidationSchema.validate(request.body || {}, { abortEarly: false })
        if (error)
            throw ValidationError(error, response, 422)

        const whereCondition: any = { email: payload.email }
        if (payload.mobile)
            whereCondition.mobile = payload.mobile

        const isExist = await User.findOne({
            where: { [Op.or]: whereCondition }
        })

        if (isExist)
            throw TryError("Email or mobile already been taken", 409)

        const hashPass = await bcrypt.hash(payload.password, 10)
        const userPayload: any = {
            ...payload,
            password: hashPass,
            type: "free"
        }
        
        const user = await User.create(userPayload)
        const code = `GU${new Date().getFullYear()}${user.id}`
        await user.update({ code })
        ApiResponse(response, { message: "User registered successfully" })
    } catch (error) {
        CatchError(error, response)
    }
}

export const login = async (request: GuestSessionInterface, response: Response) => {
    try {
        const { error, value: payload } = loginValidationSchema.validate(request.body || {}, { abortEarly: false })
        if (error)
            throw ValidationError(error, response, 422)

        const user = await User.findOne({
            where: { email: payload.email }
        })

        if (!user)
            throw TryError("User not found", 404)

        const passMatch = await bcrypt.compare(payload.password, user.password)
        if (!passMatch)
            throw TryError("Email or password is incorrect", 403)

        const tokenPayload: jwtPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile || null,
            status: user.status,
            planType: user.planType
        }

        const token = jwt.sign(tokenPayload, process.env.NODE_AUTH_SECRET as string)
        const twelveHours = 12 * 60 * 60 * 1000
        response.cookie("userAccessToken", token, getOptions(twelveHours))
        ApiResponse(response, { message: "User login successfully!!!" })
    } catch (error) {
        CatchError(error, response)
    }
}

export const logout = async (request: Request, response: Response) => {
    try {
        const token = request.cookies.userAccessToken
        if(!token)
            throw TryError("Already logout", 200)
        
        response.cookie("userAccessToken", "", getOptions(0))
        response.clearCookie("userAccessToken")
        ApiResponse(response, { message: "Logout successfully" })
    } catch (error) {
        CatchError(error, response)
    }
}