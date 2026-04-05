import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/db'
import { searchStatus } from '../utils/types'
import { SearchStatus } from '../config/constant'

class WebsiteCrawlPage extends Model {
    public id!: number
    public jobId!: number
    public url!: string
    public status!: searchStatus
    public reportJson!: object | null
    public errorMessage!: string | null

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

WebsiteCrawlPage.init({
    jobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM(...Object.keys(SearchStatus)),
        defaultValue: "pending",
    },
    reportJson: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'WebsiteCrawlPage',
    tableName: 'website_crawl_pages',
    timestamps: true,
})

export default WebsiteCrawlPage
