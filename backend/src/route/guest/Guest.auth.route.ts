import { Router } from "express"
import { login, logout, registerUser } from "../../controller/guest/Guest.auth.controller"

const GuestAuthRouter = Router()
GuestAuthRouter.post("/register", registerUser)
GuestAuthRouter.post("/login", login)
GuestAuthRouter.get("/logout", logout)

export default GuestAuthRouter