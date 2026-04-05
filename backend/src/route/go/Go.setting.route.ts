import { Router } from "express"
import { changePassword } from "../../controller/go/Go.setting.controller"

const GoSettingRouter = Router()
GoSettingRouter.put("/change-password", changePassword)

export default GoSettingRouter