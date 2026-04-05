import { Router } from "express"
import GuestRouter from "./guest"
import { userMiddleware } from "../middleware/User.middleware"
import FreeRouter from "./free"
import GoRouter from "./go"

const MainRouterList = Router()
MainRouterList.use("/guest", GuestRouter)
MainRouterList.use("/free", userMiddleware, FreeRouter)
MainRouterList.use("/go", userMiddleware, GoRouter)

export default MainRouterList