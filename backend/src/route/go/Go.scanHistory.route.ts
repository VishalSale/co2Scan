import { Router } from "express"
import { getCo2Consumption, getScanHistory, getScanHistoryById, pauseCrawl, resumeCrawl, pauseAllCrawls, resumeAllCrawls } from "../../controller/go/Go.ScanHistory.controller"

const GoScanHistoryRouter = Router()
GoScanHistoryRouter.get("/", getScanHistory)
GoScanHistoryRouter.get("/co2-consumption/:id", getCo2Consumption)
GoScanHistoryRouter.post("/crawl-pause-all", pauseAllCrawls)
GoScanHistoryRouter.post("/crawl-resume-all", resumeAllCrawls)
GoScanHistoryRouter.post("/crawl-pause/:jobId", pauseCrawl)
GoScanHistoryRouter.post("/crawl-resume/:jobId", resumeCrawl)
GoScanHistoryRouter.get("/:id", getScanHistoryById)

export default GoScanHistoryRouter