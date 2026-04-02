export interface EmployerAnalyticsData {
  totalViews: number
  totalClicks: number
  totalApplications: number
  conversionRate: number
  averageViewsPerJob: number
  topPerformingJobs: Array<{
    id: string
    title: string
    views: number
    clicks: number
    applications: number
    conversionRate: number
  }>
  viewsOverTime: Array<{
    date: string
    views: number
    clicks: number
  }>
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number | null
  }
  trends: {
    viewsChangePercent: number | null
    applicationsChangePercent: number | null
  }
  insights: Array<{ tone: 'positive' | 'neutral' | 'caution'; title: string; body: string }>
}
