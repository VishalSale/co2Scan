import { Router } from "express"
import { getOverallCount } from "../../controller/go/Go.dashboard.controller"

const GoDashboardRouter = Router()
GoDashboardRouter.get("/overall", getOverallCount)

export default GoDashboardRouter