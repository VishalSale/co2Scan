import { Response } from "express"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { CatchError, TryError, ValidationError } from "../../utils/error"
import { User } from "../../model"
import { ApiResponse } from "../../utils/common"
import { updateProfileValidationSchema } from "../../validator/Go.validator"

export const getProfile = async (request: UserSessionInterface, response: Response) => {
    try {
        const profile = await User.findOne({
            where: { id: request.session?.id },
            attributes: ["id", "code", "planType", "name", "email", "mobile", "profileImg", "status"]
        })
        if (!profile)
            throw TryError("User not found", 404)

        ApiResponse(response, { data: profile })
    } catch (error) {
        CatchError(error, response)
    }
}

export const updateProfile = async (request: UserSessionInterface, response: Response) => {
    try {
        const { error, value: payload } = updateProfileValidationSchema.validate(request.body || {}, { abortEarly: false })
        if (error)
            throw ValidationError(error, response, 422)

        const id = request.session?.id
        const profile = await User.findByPk(id)
        if (!profile)
            throw TryError("User not found", 404)

        if(!payload.profileImg)
            payload.profileImg = null

        await profile.update(payload)
        ApiResponse(response, { message: "Profile updated successfully" })
    } catch (error) {
        CatchError(error, response)
    }
}