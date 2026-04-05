import { Sequelize } from "sequelize"
import dotenv from "dotenv"
dotenv.config()

const sequelize = new Sequelize({
  database: process.env.DB_NAME as string,
  username: process.env.DB_USERNAME as string,
  password: process.env.DB_PASSWORD as string,
  host: process.env.DB_HOST as string,
  dialect: "postgres",
  logging: false,
  timezone: "+05:30",
})

export default sequelize