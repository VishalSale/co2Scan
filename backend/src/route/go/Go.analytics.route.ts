import { Router } from "express"
import { getAnalyticsData } from "../../controller/go/Go.analytics.controller"

const GoAnalyticsRouter = Router()
GoAnalyticsRouter.get("/", getAnalyticsData)

export default GoAnalyticsRouter