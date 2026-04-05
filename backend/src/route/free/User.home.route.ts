import {Router} from "express"
import { getCo2Consumption } from "../../controller/free/User.home.controller"

const UserHomeRouter = Router()
UserHomeRouter.post("/co2-consumption", getCo2Consumption)

export default UserHomeRouter