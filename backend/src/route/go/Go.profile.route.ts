import { Router } from "express"
import { getProfile, updateProfile } from "../../controller/go/Go.profile.controller"

const GoProfileRouter = Router()
GoProfileRouter.get("/", getProfile)
GoProfileRouter.put("/update", updateProfile)

export default GoProfileRouter