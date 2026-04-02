import { createClient } from '@/lib/supabase/server'
import type { EmployerAnalyticsData } from '@/lib/employer/analytics-types'

export interface EmployerStats {
  totalJobs: number
  activeJobs: number
  featuredJobs: number
  totalViews: number
  totalClicks: number
  totalApplications: number
  monthlyRevenue: number
}

export interface RecentJob {
  id: string
  title: string
  company: string
  location: string
  status: 'active' | 'expired' | 'draft'
  views: number
  applications: number
  createdAt: string
  isFeatured: boolean
}

export async function getEmployerStats(userId: string, companyId: string): Promise<EmployerStats> {
  const supabase = await createClient()

  if (!companyId) {
    // Return zero stats if no company
    return {
      totalJobs: 0,
      activeJobs: 0,
      featuredJobs: 0,
      totalViews: 0,
      totalClicks: 0,
      totalApplications: 0,
      monthlyRevenue: 0,
    }
  }

  // Get job counts
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('id, is_featured, expires_at')
    .eq('company_id', companyId)

  const allJobsTyped = (allJobs || []) as Array<{ id: string; is_featured: boolean | null; expires_at: string | null }>

  const totalJobs = allJobsTyped.length
  const activeJobs = allJobsTyped.filter(job => {
    if (!job.expires_at) return true
    return new Date(job.expires_at) > new Date()
  }).length
  const featuredJobs = allJobsTyped.filter(job => job.is_featured).length

  const jobIds = allJobsTyped.map(j => j.id)
  let totalViews = 0
  let totalApplications = 0

  if (jobIds.length > 0) {
    const { count: viewsCount } = await supabase
      .from('job_views')
      .select('*', { count: 'exact', head: true })
      .in('job_id', jobIds)

    const { count: applicationsCount } = await supabase
      .from('job_applications_received')
      .select('*', { count: 'exact', head: true })
      .in('job_id', jobIds)

    totalViews = viewsCount ?? 0
    totalApplications = applicationsCount ?? 0
  }

  // Calculate monthly revenue (featured jobs * $99/month, simplified)
  const monthlyRevenue = featuredJobs * 99

  // Clicks would be tracked separately, for now use views as proxy
  const totalClicks = totalViews

  return {
    totalJobs,
    activeJobs,
    featuredJobs,
    totalViews,
    totalClicks,
    totalApplications,
    monthlyRevenue,
  }
}

export async function getRecentJobs(userId: string, companyId: string, limit: number = 5): Promise<RecentJob[]> {
  const supabase = await createClient()

  if (!companyId) {
    return []
  }

  // Get recent jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, location, is_featured, expires_at, created_at, company_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !jobs) {
    return []
  }

  const jobsTyped = jobs as Array<{
    id: string
    title: string
    location: string
    is_featured: boolean | null
    expires_at: string | null
    created_at: string | null
    company_id: string | null
  }>

  // Get company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const companyTyped = company as { name: string } | null
  const companyName = companyTyped?.name || 'Your Company'

  // Get views and applications for each job
  const jobIds = jobsTyped.map(j => j.id)
  
  const { data: viewsData } = await supabase
    .from('job_views')
    .select('job_id')
    .in('job_id', jobIds)

  const { data: applicationsData } = await supabase
    .from('job_applications_received')
    .select('job_id')
    .in('job_id', jobIds)

  const viewsDataTyped = viewsData as Array<{ job_id: string }> | null
  const applicationsDataTyped = applicationsData as Array<{ job_id: string }> | null

  // Count views and applications per job
  const viewsCount: Record<string, number> = {}
  const applicationsCount: Record<string, number> = {}

  viewsDataTyped?.forEach(view => {
    viewsCount[view.job_id] = (viewsCount[view.job_id] || 0) + 1
  })

  applicationsDataTyped?.forEach(app => {
    applicationsCount[app.job_id] = (applicationsCount[app.job_id] || 0) + 1
  })

  // Map to RecentJob format
  return jobsTyped.map(job => {
    const isExpired = job.expires_at ? new Date(job.expires_at) < new Date() : false
    const status: 'active' | 'expired' | 'draft' = isExpired ? 'expired' : 'active'

    return {
      id: job.id,
      title: job.title,
      company: companyName,
      location: job.location,
      status,
      views: viewsCount[job.id] || 0,
      applications: applicationsCount[job.id] || 0,
      createdAt: job.created_at || new Date().toISOString(),
      isFeatured: job.is_featured || false,
    }
  })
}

export type { EmployerAnalyticsData } from '@/lib/employer/analytics-types'

function rangeToDays(range: string): number {
  switch (range) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case '1y':
      return 365
    default:
      return 30
  }
}

function formatDayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getEmployerAnalytics(
  userId: string,
  companyId: string,
  range: string,
  singleJobId?: string
): Promise<EmployerAnalyticsData> {
  const supabase = await createClient()
  const stats = await getEmployerStats(userId, companyId)

  const { data: jobsRows } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('company_id', companyId)

  const allJobIds = (jobsRows || []).map(j => (j as { id: string }).id)
  const jobIds =
    singleJobId && allJobIds.includes(singleJobId) ? [singleJobId] : allJobIds

  const idToTitle: Record<string, string> = {}
  ;(jobsRows || []).forEach(row => {
    const r = row as { id: string; title: string }
    idToTitle[r.id] = r.title
  })

  const days = rangeToDays(range)
  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(periodStart.getDate() - days)
  const periodStartIso = periodStart.toISOString()

  const priorEnd = new Date(periodStart)
  const priorStart = new Date(periodStart)
  priorStart.setDate(priorStart.getDate() - days)
  const priorStartIso = priorStart.toISOString()

  if (jobIds.length === 0) {
    return {
      totalViews: 0,
      totalClicks: 0,
      totalApplications: 0,
      conversionRate: 0,
      averageViewsPerJob: 0,
      topPerformingJobs: [],
      viewsOverTime: [],
      revenue: {
        total: stats.monthlyRevenue,
        thisMonth: stats.monthlyRevenue,
        lastMonth: 0,
        growth: null,
      },
      trends: { viewsChangePercent: null, applicationsChangePercent: null },
      insights: [
        {
          tone: 'neutral',
          title: 'Post a job to see analytics',
          body: 'Once you publish roles, views, applications, and trends will appear here.',
        },
      ],
    }
  }

  const { count: viewsPeriod } = await supabase
    .from('job_views')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .gte('viewed_at', periodStartIso)

  const { count: viewsPrior } = await supabase
    .from('job_views')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .gte('viewed_at', priorStartIso)
    .lt('viewed_at', periodStartIso)

  const { count: appsPeriod } = await supabase
    .from('job_applications_received')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .gte('created_at', periodStartIso)

  const { count: appsPrior } = await supabase
    .from('job_applications_received')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .gte('created_at', priorStartIso)
    .lt('created_at', periodStartIso)

  const totalViews = viewsPeriod ?? 0
  const totalApplications = appsPeriod ?? 0
  const totalClicks = totalViews
  const conversionRate =
    totalViews > 0 ? Math.round((totalApplications / totalViews) * 1000) / 10 : 0
  const divisor = singleJobId ? 1 : Math.max(jobIds.length, 1)
  const averageViewsPerJob =
    totalViews > 0 ? Math.round((totalViews / divisor) * 10) / 10 : 0

  const vPrior = viewsPrior ?? 0
  const aPrior = appsPrior ?? 0
  const viewsChangePercent =
    vPrior > 0 ? Math.round(((totalViews - vPrior) / vPrior) * 1000) / 10 : null
  const applicationsChangePercent =
    aPrior > 0 ? Math.round(((totalApplications - aPrior) / aPrior) * 1000) / 10 : null

  const { data: viewsDetail } = await supabase
    .from('job_views')
    .select('job_id, viewed_at')
    .in('job_id', jobIds)
    .gte('viewed_at', periodStartIso)
    .order('viewed_at', { ascending: true })
    .limit(8000)

  const viewsByJob: Record<string, number> = {}
  const appsByJob: Record<string, number> = {}
  const dayBuckets: Record<string, number> = {}

  ;(viewsDetail || []).forEach(row => {
    const r = row as { job_id: string; viewed_at: string | null }
    viewsByJob[r.job_id] = (viewsByJob[r.job_id] || 0) + 1
    if (r.viewed_at) {
      const key = formatDayKey(new Date(r.viewed_at))
      dayBuckets[key] = (dayBuckets[key] || 0) + 1
    }
  })

  const { data: appsDetail } = await supabase
    .from('job_applications_received')
    .select('job_id')
    .in('job_id', jobIds)
    .gte('created_at', periodStartIso)

  ;(appsDetail || []).forEach(row => {
    const r = row as { job_id: string }
    appsByJob[r.job_id] = (appsByJob[r.job_id] || 0) + 1
  })

  const topPerformingJobs = jobIds
    .map(id => {
      const views = viewsByJob[id] || 0
      const applications = appsByJob[id] || 0
      const cr = views > 0 ? Math.round((applications / views) * 1000) / 10 : 0
      return {
        id,
        title: idToTitle[id] || 'Job',
        views,
        clicks: views,
        applications,
        conversionRate: cr,
      }
    })
    .filter(j => j.views > 0 || j.applications > 0)
    .sort((a, b) => b.applications - a.applications || b.views - a.views)
    .slice(0, 10)

  const viewsOverTime: Array<{ date: string; views: number; clicks: number }> = []
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart)
    d.setDate(d.getDate() + i)
    const key = formatDayKey(d)
    const v = dayBuckets[key] || 0
    viewsOverTime.push({ date: key, views: v, clicks: v })
  }

  const insights: EmployerAnalyticsData['insights'] = []
  if (totalViews === 0 && totalApplications === 0) {
    insights.push({
      tone: 'neutral',
      title: 'No activity in this range',
      body: 'Try a longer date range or share your postings to start collecting views and applications.',
    })
  } else {
    if (totalApplications > 0) {
      insights.push({
        tone: 'positive',
        title: 'Applications coming in',
        body: `You received ${totalApplications} application${totalApplications === 1 ? '' : 's'} in the selected period.`,
      })
    }
    if (conversionRate > 0 && totalViews >= 10) {
      insights.push({
        tone: 'neutral',
        title: 'View to application rate',
        body: `About ${conversionRate}% of views in this period resulted in an application.`,
      })
    }
    if (topPerformingJobs.length > 0) {
      const top = topPerformingJobs[0]
      insights.push({
        tone: 'positive',
        title: 'Top role',
        body: `"${top.title}" leads with ${top.applications} application${top.applications === 1 ? '' : 's'} and ${top.views} views in this period.`,
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'neutral',
      title: 'Keep monitoring',
      body: 'Trends will sharpen as more candidates view and apply to your listings.',
    })
  }

  return {
    totalViews,
    totalClicks,
    totalApplications,
    conversionRate,
    averageViewsPerJob,
    topPerformingJobs,
    viewsOverTime,
    revenue: {
      total: stats.monthlyRevenue,
      thisMonth: stats.monthlyRevenue,
      lastMonth: 0,
      growth: null,
    },
    trends: {
      viewsChangePercent,
      applicationsChangePercent,
    },
    insights,
  }
}

