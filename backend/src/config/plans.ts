// Subscription plans and limits

export enum PlanType {
  GUEST = "guest",
  FREE = "free",
  GO = "go",
}


export const PLAN_LIMITS = {
  [PlanType.GUEST]: {
    scansPerDay: 5,
    uniqueUrlsPerDay: 5,
    pagesPerScan: 1,
    historyDays: 0,
    teamMembers: 0,
    apiAccess: false,
    support: "community",
  },
  [PlanType.FREE]: {
    scansPerDay: 10,
    uniqueUrlsPerDay: 10,
    pagesPerScan: 1,
    historyDays: 7,
    teamMembers: 0,
    apiAccess: false,
    support: "email",
  },
  [PlanType.GO]: {
    scansPerDay: 50 , // 50
    uniqueUrlsPerDay: 50, // 50
    pagesPerScan: 10, // Increased from 10 to 100 for full site crawling
    historyDays: -1, // unlimited
    teamMembers: 0,
    apiAccess: true,/*  */
    support: "priority",
  },
}

export function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType]
}
