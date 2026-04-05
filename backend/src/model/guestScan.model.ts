import { DataTypes, Model } from "sequelize"
import sequelize from "../config/db"
import { PlanType } from "../config/constant"
import { planType } from "../utils/types"

class GuestScan extends Model {
  public id!: string
  public url!: string
  public userId!: number | null
  public planType!: planType
  public userIp!: string
  public userFingerprint!: string
  public userCountry!: string
  public serverIp!: string | null
  public serverCountry!: string | null
  public reportJson!: object
  public carbonScore!: number | null
  public co2Grams!: number | null
  public pageSizeMb!: number | null
  public grade!: string | null
  public scanDurationSeconds!: number | null
  public lighthouseVersion!: string | null

  public createdBy!: string | null
  public createdById!: number | null
  public createdByIpAddress!: string | null
  public readonly createdAt!: Date
  public updatedBy!: string | null
  public updatedById!: number | null
  public updatedByIpAddress!: string | null
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null
}

GuestScan.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    planType: {
      type: DataTypes.ENUM(...Object.keys(PlanType)),
      allowNull: false,
      defaultValue: "guest",
    },
    userIp: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    userFingerprint: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    userCountry: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    serverIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    serverCountry: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    reportJson: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    carbonScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    co2Grams: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    pageSizeMb: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    scanDurationSeconds: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    lighthouseVersion: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    createdBy: DataTypes.STRING,
    createdById: DataTypes.INTEGER,
    createdByIpAddress: DataTypes.STRING,
    updatedBy: DataTypes.STRING,
    updatedById: DataTypes.INTEGER,
    updatedByIpAddress: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'GuestScans',
    tableName: 'guest_scans',
    paranoid: true,
    timestamps: true,
  }
)

export default GuestScan