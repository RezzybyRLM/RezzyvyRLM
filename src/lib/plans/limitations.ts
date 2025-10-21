// Plan-based feature limitations

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise'

export interface PlanLimits {
  planType: PlanType
  jobSearchesPerMonth: number
  applicationsPerMonth: number
  bookmarksPerMonth: number
  aiResumeMatches: number
  aiInterviewSessions: number
  jobAlerts: number
  canApplyDirectly: boolean
  canExportData: boolean
  apiQuotaRemaining: number
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    planType: 'free',
    jobSearchesPerMonth: 10,
    applicationsPerMonth: 5,
    bookmarksPerMonth: 20,
    aiResumeMatches: 2,
    aiInterviewSessions: 1,
    jobAlerts: 1,
    canApplyDirectly: false,
    canExportData: false,
    apiQuotaRemaining: 10,
  },
  basic: {
    planType: 'basic',
    jobSearchesPerMonth: 50,
    applicationsPerMonth: 20,
    bookmarksPerMonth: 100,
    aiResumeMatches: 10,
    aiInterviewSessions: 5,
    jobAlerts: 3,
    canApplyDirectly: true,
    canExportData: false,
    apiQuotaRemaining: 50,
  },
  pro: {
    planType: 'pro',
    jobSearchesPerMonth: 200,
    applicationsPerMonth: 100,
    bookmarksPerMonth: 500,
    aiResumeMatches: 50,
    aiInterviewSessions: 25,
    jobAlerts: 10,
    canApplyDirectly: true,
    canExportData: true,
    apiQuotaRemaining: 200,
  },
  enterprise: {
    planType: 'enterprise',
    jobSearchesPerMonth: -1, // Unlimited
    applicationsPerMonth: -1,
    bookmarksPerMonth: -1,
    aiResumeMatches: -1,
    aiInterviewSessions: -1,
    jobAlerts: -1,
    canApplyDirectly: true,
    canExportData: true,
    apiQuotaRemaining: -1,
  },
}

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

export function hasQuotaRemaining(currentUsage: number, limit: number): boolean {
  return limit === -1 || currentUsage < limit
}

export function getUsagePercentage(currentUsage: number, limit: number): number {
  if (limit === -1) return 0 // Unlimited
  return Math.min((currentUsage / limit) * 100, 100)
}

