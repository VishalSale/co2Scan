import { Router } from "express"
import UserHomeRouter from "./User.home.route"
import UserAuthRouter from "./User.auth.route"
import UserScanHistoryRouter from "./User.scanHistory.route"
import UserDashboardRouter from "./User.dashboard.route"
import UserProfileRouter from "./User.profile.route"
import UserSettingRouter from "./User.setting.route"

const FreeRouter = Router()
FreeRouter.use("/auth", UserAuthRouter)
FreeRouter.use("/dashboard", UserDashboardRouter)
FreeRouter.use("/home", UserHomeRouter)
FreeRouter.use("/profile", UserProfileRouter)
FreeRouter.use("/setting", UserSettingRouter)
FreeRouter.use("/scan-history", UserScanHistoryRouter)

export default FreeRouter