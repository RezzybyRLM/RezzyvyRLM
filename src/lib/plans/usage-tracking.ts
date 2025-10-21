import { createClient } from '@/lib/supabase/client'
import { getPlanLimits, PlanType, hasQuotaRemaining } from './limitations'

export interface UserUsage {
  planType: PlanType
  jobSearchesUsed: number
  applicationsUsed: number
  bookmarksUsed: number
  aiResumeMatchesUsed: number
  aiInterviewSessionsUsed: number
  jobAlertsCount: number
  resumesUploaded: number
  quotaResetDate: Date
}

export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  const supabase = createClient()
  
  try {
    // Get user's plan
    const { data: planData, error: planError } = await (supabase as any)
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (planError || !planData) {
      // Create default free plan if none exists
      const planType: PlanType = 'free'
      return {
        planType,
        jobSearchesUsed: 0,
        applicationsUsed: 0,
        bookmarksUsed: 0,
        aiResumeMatchesUsed: 0,
        aiInterviewSessionsUsed: 0,
        jobAlertsCount: 0,
        resumesUploaded: 0,
        quotaResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    }

    const planType = (planData.plan_type as PlanType) || 'free'
    const limits = getPlanLimits(planType)

    // Get usage counts for the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Job searches (from api_usage_tracking)
    const { count: jobSearchesUsed } = await (supabase as any)
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('service', 'apify')
      .eq('endpoint', '/api/fetch-indeed-jobs')
      .gte('timestamp', startOfMonth.toISOString())

    // Applications
    const { count: applicationsUsed } = await (supabase as any)
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('application_date', startOfMonth.toISOString())

    // Bookmarks
    const { count: bookmarksUsed } = await (supabase as any)
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    // AI Resume Matches
    const { count: aiResumeMatchesUsed } = await (supabase as any)
      .from('api_usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('service', 'gemini')
      .eq('endpoint', '/api/ai/resume-match')
      .gte('timestamp', startOfMonth.toISOString())

    // AI Interview Sessions
    const { count: aiInterviewSessionsUsed } = await (supabase as any)
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    // Job Alerts
    const { count: jobAlertsCount } = await (supabase as any)
      .from('job_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    // Resume uploads (total, not per month)
    const { count: resumesUploaded } = await (supabase as any)
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      planType,
      jobSearchesUsed: jobSearchesUsed || 0,
      applicationsUsed: applicationsUsed || 0,
      bookmarksUsed: bookmarksUsed || 0,
      aiResumeMatchesUsed: aiResumeMatchesUsed || 0,
      aiInterviewSessionsUsed: aiInterviewSessionsUsed || 0,
      jobAlertsCount: jobAlertsCount || 0,
      resumesUploaded: resumesUploaded || 0,
      quotaResetDate: new Date(planData.quota_reset_date || Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return null
  }
}

export async function canPerformAction(
  userId: string,
  action: 'jobSearch' | 'application' | 'bookmark' | 'aiResumeMatch' | 'aiInterview' | 'jobAlert' | 'resumeUpload'
): Promise<{ allowed: boolean; reason?: string; usage?: UserUsage }> {
  const usage = await getUserUsage(userId)
  
  if (!usage) {
    return { allowed: false, reason: 'Unable to fetch usage data' }
  }

  const limits = getPlanLimits(usage.planType)

  switch (action) {
    case 'jobSearch':
      if (!hasQuotaRemaining(usage.jobSearchesUsed, limits.jobSearchesPerMonth)) {
        return {
          allowed: false,
          reason: `You've reached your monthly job search limit (${limits.jobSearchesPerMonth}). Upgrade to continue searching.`,
          usage,
        }
      }
      break
    case 'application':
      if (!hasQuotaRemaining(usage.applicationsUsed, limits.applicationsPerMonth)) {
        return {
          allowed: false,
          reason: `You've reached your monthly application limit (${limits.applicationsPerMonth}). Upgrade to continue applying.`,
          usage,
        }
      }
      break
    case 'bookmark':
      if (!hasQuotaRemaining(usage.bookmarksUsed, limits.bookmarksPerMonth)) {
        return {
          allowed: false,
          reason: `You've reached your monthly bookmark limit (${limits.bookmarksPerMonth}). Upgrade to continue bookmarking.`,
          usage,
        }
      }
      break
    case 'aiResumeMatch':
      if (!hasQuotaRemaining(usage.aiResumeMatchesUsed, limits.aiResumeMatches)) {
        return {
          allowed: false,
          reason: `You've reached your AI resume match limit (${limits.aiResumeMatches}). Upgrade to continue using this feature.`,
          usage,
        }
      }
      break
    case 'aiInterview':
      if (!hasQuotaRemaining(usage.aiInterviewSessionsUsed, limits.aiInterviewSessions)) {
        return {
          allowed: false,
          reason: `You've reached your AI interview session limit (${limits.aiInterviewSessions}). Upgrade to continue practicing.`,
          usage,
        }
      }
      break
    case 'jobAlert':
      if (!hasQuotaRemaining(usage.jobAlertsCount, limits.jobAlerts)) {
        return {
          allowed: false,
          reason: `You've reached your job alert limit (${limits.jobAlerts}). Upgrade to create more alerts.`,
          usage,
        }
      }
      break
    case 'resumeUpload':
      if (!hasQuotaRemaining(usage.resumesUploaded, limits.resumesUploadsTotal)) {
        return {
          allowed: false,
          reason: `You've reached your resume upload limit (${limits.resumesUploadsTotal} total). Upgrade to upload more resumes.`,
          usage,
        }
      }
      break
  }

  return { allowed: true, usage }
}

export async function trackUsage(
  userId: string,
  action: 'jobSearch' | 'application' | 'bookmark' | 'aiResumeMatch' | 'aiInterview' | 'jobAlert' | 'resumeUpload',
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient()

    try {
      if (action === 'jobSearch') {
        await (supabase as any).from('api_usage_tracking').insert({
          user_id: userId,
          service: 'apify',
          endpoint: '/api/fetch-indeed-jobs',
          request_count: 1,
          metadata: metadata || {},
        })
      } else if (action === 'aiResumeMatch') {
        await (supabase as any).from('api_usage_tracking').insert({
          user_id: userId,
          service: 'gemini',
          endpoint: '/api/ai/resume-match',
          request_count: 1,
          metadata: metadata || {},
        })
      }
      // Other actions are tracked through their respective tables
    } catch (error) {
      console.error('Error tracking usage:', error)
    }
}

