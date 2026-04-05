import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/db'
import { PlanType, StatusType } from '../config/constant'
import { planType, statusType } from '../utils/types'

class User extends Model {
    public id!: number
    public code!: string | null
    public planType!: planType
    public name!: string
    public email!: string
    public mobile!: string | null
    public profileImg!: string | null
    public password!: string

    public emailVerifiedAt!: string
    public status!: statusType
    public statusChangedBy!: string | null
    public statusChangedById!: number | null
}

User.init({
    code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    planType:{
        type: DataTypes.ENUM(...Object.keys(PlanType)),
        defaultValue: 'free'
    },
    profileImg: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    mobile: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: DataTypes.STRING,

    status: {
        type: DataTypes.ENUM(...Object.keys(StatusType)),
        defaultValue: 'active',
    },
    statusChangedBy: DataTypes.STRING,
    statusChangedById: DataTypes.INTEGER,
},
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        paranoid: true,
        timestamps: true,
    })

export default User