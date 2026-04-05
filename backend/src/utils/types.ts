import { StatusType, PlanType, SearchStatus } from "../config/constant"

export type statusType = keyof typeof StatusType
export type planType = keyof typeof PlanType
export type searchStatus = keyof typeof SearchStatus

export type jwtPayload = {
    id: number,
    name: string,
    mobile: string | null,
    email: string,
    status: string,
    planType: string
}