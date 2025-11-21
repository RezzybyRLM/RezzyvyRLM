import { createClient } from '@/lib/supabase/server'

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

  const totalJobs = allJobs?.length || 0
  const activeJobs = allJobs?.filter(job => {
    if (!job.expires_at) return true
    return new Date(job.expires_at) > new Date()
  }).length || 0
  const featuredJobs = allJobs?.filter(job => job.is_featured).length || 0

  // Get views count (from job_views table)
  const { data: viewsData } = await supabase
    .from('job_views')
    .select('id', { count: 'exact' })
    .in('job_id', allJobs?.map(j => j.id) || [])

  const totalViews = viewsData?.length || 0

  // Get applications count
  const { data: applicationsData } = await supabase
    .from('job_applications_received')
    .select('id', { count: 'exact' })
    .in('job_id', allJobs?.map(j => j.id) || [])

  const totalApplications = applicationsData?.length || 0

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

  // Get company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const companyName = company?.name || 'Your Company'

  // Get views and applications for each job
  const jobIds = jobs.map(j => j.id)
  
  const { data: viewsData } = await supabase
    .from('job_views')
    .select('job_id')
    .in('job_id', jobIds)

  const { data: applicationsData } = await supabase
    .from('job_applications_received')
    .select('job_id')
    .in('job_id', jobIds)

  // Count views and applications per job
  const viewsCount: Record<string, number> = {}
  const applicationsCount: Record<string, number> = {}

  viewsData?.forEach(view => {
    viewsCount[view.job_id] = (viewsCount[view.job_id] || 0) + 1
  })

  applicationsData?.forEach(app => {
    applicationsCount[app.job_id] = (applicationsCount[app.job_id] || 0) + 1
  })

  // Map to RecentJob format
  return jobs.map(job => {
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

