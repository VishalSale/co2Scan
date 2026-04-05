import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import cookieParser from 'cookie-parser'
import sequelize from "./config/db"
import MainRouterList from "./route"
import { CorsConfig } from "./utils/common"
import "./model/index" // Import all models to register them

const app = express()
const HOST = '0.0.0.0'
const PORT = Number(process.env.NODE_PORT) || 8080

sequelize.sync({ alter: true }).then(async () => {
    console.log("Database synced")
    const { WebsiteCrawl } = await import("./model")
    await WebsiteCrawl.update({ status: "paused" }, { where: { status: "running" } })
}).catch((error:unknown) => {
    console.error("Error syncing DB:" , error)
})

app.use(cors(CorsConfig))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))

app.use("/api", MainRouterList)

app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`)
})

export default app