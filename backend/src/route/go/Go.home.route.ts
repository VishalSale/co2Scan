import { Router } from "express"
import { crawlWebsiteCo2, getCrawlStatus, pauseCrawl, resumeCrawl } from "../../controller/go/Go.home.controller"

const GoHomeRouter = Router()
GoHomeRouter.get("/crawl-status/:jobId", getCrawlStatus)
GoHomeRouter.post("/crawl-website-co2", crawlWebsiteCo2)
GoHomeRouter.post("/crawl-pause/:jobId", pauseCrawl)
GoHomeRouter.post("/crawl-resume/:jobId", resumeCrawl)

export default GoHomeRouter
