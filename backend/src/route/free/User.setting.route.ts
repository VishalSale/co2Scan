import { Router } from "express"
import { changePassword } from "../../controller/free/User.setting.controller"

const UserSettingRouter = Router()
UserSettingRouter.put("/change-password", changePassword)

export default UserSettingRouter