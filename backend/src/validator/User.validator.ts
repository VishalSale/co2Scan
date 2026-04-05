import Joi from "joi"

export const registerUserValidationSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name is required",
        "any.required": "Name is required"
    }),
    mobile: Joi.string().optional().messages({
        "string.base": "Email must be a string",
    }),
    email: Joi.string().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email is required",
        "any.required": "Email is required"
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base": "Password must contain at least 1 uppercase, 1 lowercase, and 1 special character"
    }),
    confirmPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base": "Password must contain at least 1 uppercase, 1 lowercase, and 1 special character"
    }),
})

export const loginValidationSchema = Joi.object({
    email: Joi.string().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email is required",
        "any.required": "Email is required"
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base": "Password must contain at least 1 uppercase, 1 lowercase, and 1 special character"
    }),
})

export const getCo2ConsumptionValidationSchema = Joi.object({
    url: Joi.string().uri().required().messages({
        "string.base": "URL must be a string",
        "string.empty": "URL is required",
        "string.uri": "URL must be a valid URI",
        "any.required": "URL is required"
    }),
})

export const updateProfileValidationSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name is required",
        "any.required": "Name is required"
    }),
    mobile: Joi.string().allow('', null).optional().messages({
        "string.base": "Mobile must be a string",
    }),
    profileImg: Joi.string().allow('', null).optional()
})

export const changePasswordValidationSchema = Joi.object({
    oldPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base": "Password must contain at least 1 uppercase, 1 lowercase, and 1 special character"
    }),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base": "Password must contain at least 1 uppercase, 1 lowercase, and 1 special character"
    }),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "any.required": "Password is required"
    })
})
