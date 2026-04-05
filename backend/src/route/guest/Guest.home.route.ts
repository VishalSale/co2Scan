import {Router} from "express"
import { getCo2Consumption } from "../../controller/guest/Guest.home.controller"

const GuestHomeRouter = Router()
GuestHomeRouter.post("/co2-consumption", getCo2Consumption)

export default GuestHomeRouter