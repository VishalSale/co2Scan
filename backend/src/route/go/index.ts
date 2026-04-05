import { Router } from "express"
import GoHomeRouter from "./Go.home.route"
import GoScanHistoryRouter from "./Go.scanHistory.route"
import GoDashboardRouter from "./Go.dashboard.route"
import GoAnalyticsRouter from "./Go.analytics.route"
import GoProfileRouter from "./Go.profile.route"
import GoSettingRouter from "./Go.setting.route"

const GoRouter = Router()
GoRouter.use("/profile", GoProfileRouter)
GoRouter.use("/home", GoHomeRouter)
GoRouter.use("/dashboard", GoDashboardRouter)
GoRouter.use("/scan-history", GoScanHistoryRouter)
GoRouter.use("/analytics", GoAnalyticsRouter)
GoRouter.use("/setting", GoSettingRouter)

export default GoRouter