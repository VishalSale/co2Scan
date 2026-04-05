import { Router } from "express"
import { getScanHistory, getScanHistoryById } from "../../controller/free/User.ScanHistory.controller"

const UserScanHistoryRouter = Router()
UserScanHistoryRouter.get("/", getScanHistory)
UserScanHistoryRouter.get("/:id", getScanHistoryById)

export default UserScanHistoryRouter