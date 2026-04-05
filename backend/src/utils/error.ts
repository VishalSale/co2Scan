import { Response } from "express"

interface ErrorMessage extends Error {
    status?: number
}

export const TryError = (message:any, status:number = 500) => {
    const error: ErrorMessage = Error(message)
    error.status = status
    return  error
}

export const CatchError = (error: unknown, res: Response, prodMessage: string = "Internal server error") => {
    if(error instanceof Error){
        const message = (process.env.NODE_ENV === "dev" ? error.message : prodMessage)
        const status = (error as ErrorMessage).status || 500
        res.status(status).json({message})
    }
}

export const ValidationError = (errors:any, response:Response, status:number) => {
    const formattedErrors: { [key: string]: string } = {}
    errors.details.forEach((err: any) => {
        // Use path instead of context.key to get the correct field name
        const fieldName = err.path[0] || err.context.key
        formattedErrors[fieldName] = err.message
    })
    response.status(status).json({
        success: false,
        errors: formattedErrors,
    })
}