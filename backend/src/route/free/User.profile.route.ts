import { Router } from "express"
import { getProfile, updateProfile } from "../../controller/free/User.profile.controller"

const UserProfileRouter = Router()
UserProfileRouter.get("/", getProfile)
UserProfileRouter.put("/update", updateProfile)

export default UserProfileRouter