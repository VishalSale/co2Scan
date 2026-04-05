import Joi from "joi"

export const getCo2ConsumptionValidationSchema = Joi.object({
    url: Joi.string().uri().required().messages({
        "string.base": "URL must be a string",
        "string.empty": "URL is required",
        "string.uri": "URL must be a valid URI",
        "any.required": "URL is required"
    }),
})