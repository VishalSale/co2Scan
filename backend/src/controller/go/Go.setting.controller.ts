import { Response } from "express"
import { UserSessionInterface } from "../../middleware/User.middleware"
import { CatchError, TryError, ValidationError } from "../../utils/error"
import { changePasswordValidationSchema } from "../../validator/Go.validator"
import { User } from "../../model"
import bcrypt from "bcrypt"
import { ApiResponse } from "../../utils/common"
import { getOptions } from "../../utils/tokenConfiguration"

export const changePassword = async (request: UserSessionInterface, response: Response) => {
    try {
        const { error, value } = changePasswordValidationSchema.validate(request.body || {}, { abortEarly: false })
        if (error)
            throw ValidationError(error, response, 422)

        const { oldPassword, newPassword } = value
        const user = await User.findOne({ where: { id: request.session?.id } })
        if (!user)
            throw TryError("User not found", 404)

        const passMatch = await bcrypt.compare(oldPassword, user.password)
        if (!passMatch)
            throw TryError("Invalid password", 403)

        const hashPassword = await bcrypt.hash(newPassword, 10)
        await user.update({ password: hashPassword })

        response.cookie("userAccessToken", "", getOptions(0))
        response.clearCookie("userAccessToken")
        ApiResponse(response, { message: "Password changed successfully" })
    } catch (error) {
        CatchError(error, response)
    }
}
