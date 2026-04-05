import User from './user.model'
import GuestScan from './guestScan.model'
import WebsiteCrawl from './websiteCrawl.model'
import WebsiteCrawlPage from './websiteCrawlPage.model'
import { PlanType } from '../config/plans'

User.hasMany(GuestScan, { foreignKey: 'userId', as: 'scans' })
GuestScan.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(WebsiteCrawl, { foreignKey: 'userId', as: 'crawl' })
WebsiteCrawl.belongsTo(User, { foreignKey: 'userId', as: 'user' })

WebsiteCrawl.hasMany(WebsiteCrawlPage, { foreignKey: 'jobId', as: 'pages' })
WebsiteCrawlPage.belongsTo(WebsiteCrawl, { foreignKey: 'jobId', as: 'job' })

export { User, GuestScan, PlanType, WebsiteCrawl, WebsiteCrawlPage }
