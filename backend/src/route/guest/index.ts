import { Router } from "express"
import GuestAuthRouter from "./Guest.auth.route"
import GuestHomeRouter from "./Guest.home.route"

const GuestRouter = Router()
GuestRouter.use("/auth", GuestAuthRouter)
GuestRouter.use("/home", GuestHomeRouter)

export default GuestRouter