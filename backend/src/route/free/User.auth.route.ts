import { Router } from "express"
import { getCurrentUser } from "../../controller/free/User.auth.controller"

const UserAuthRouter = Router()
UserAuthRouter.get("/me", getCurrentUser)

export default UserAuthRouter
