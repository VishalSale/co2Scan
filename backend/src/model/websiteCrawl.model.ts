import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/db'
import { SearchStatus } from '../config/constant'
import { searchStatus } from '../utils/types'

class WebsiteCrawl extends Model {
    public id!: number
    public userId!: number
    public rootUrl!: string
    public status!: searchStatus
    public totalPages!: number | null
    public pagesScanned!: number
    public reportJson!: object | null
    public errorMessage!: string | null

    public createdBy!: string | null
    public createdById!: number | null
    public createdByIpAddress!: string | null

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

WebsiteCrawl.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rootUrl: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM(...Object.keys(SearchStatus)),
        defaultValue: 'pending'
    },
    totalPages: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    pagesScanned: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    reportJson: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdBy: DataTypes.STRING,
    createdById: DataTypes.INTEGER,
    createdByIpAddress: DataTypes.STRING,
}, {
    sequelize,
    modelName: 'WebsiteCrawl',
    tableName: 'website_crawls',
    paranoid: true,
    timestamps: true
})

export default WebsiteCrawl
