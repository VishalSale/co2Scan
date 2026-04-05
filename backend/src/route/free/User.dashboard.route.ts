import { Router } from "express"
import { getOverallCount } from "../../controller/free/User.dashboard.controller"

const UserDashboardRouter = Router()
UserDashboardRouter.get("/overall", getOverallCount)

export default UserDashboardRouter