'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import type { EmployerAnalyticsData } from '@/lib/employer/analytics-types'
import { createClient } from '@/lib/supabase/client'

type DateRangeKey = '7d' | '30d' | '90d' | '1y'

function TrendCaption({
  value,
  suffix,
}: {
  value: number | null
  suffix: string
}) {
  if (value === null) {
    return <p className="text-xs text-muted-foreground">No prior period to compare</p>
  }
  const up = value >= 0
  return (
    <p className="text-xs text-muted-foreground">
      {up ? (
        <TrendingUp className="mr-1 inline h-3 w-3" aria-hidden />
      ) : (
        <TrendingDown className="mr-1 inline h-3 w-3" aria-hidden />
      )}
      {up ? '+' : ''}
      {value}% {suffix}
    </p>
  )
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<EmployerAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noCompany, setNoCompany] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeKey>('30d')
  const [selectedJob, setSelectedJob] = useState<string>('all')
  const [jobOptions, setJobOptions] = useState<Array<{ id: string; title: string }>>([])
  const supabase = createClient()

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setNoCompany(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAnalyticsData(null)
        setLoading(false)
        return
      }

      const { data: companies } = await supabase.from('companies').select('id').limit(1)
      if (!companies?.length) {
        setNoCompany(true)
        setAnalyticsData(null)
        setJobOptions([])
        setLoading(false)
        return
      }

      const companyId = companies[0].id
      const jobQuery =
        selectedJob !== 'all' ? `&jobId=${encodeURIComponent(selectedJob)}` : ''
      const [jobsRes, analyticsRes] = await Promise.all([
        fetch(`/api/employer/recent-jobs?companyId=${companyId}&limit=100`),
        fetch(`/api/employer/analytics?companyId=${companyId}&range=${dateRange}${jobQuery}`),
      ])

      const jobsJson = await jobsRes.json()
      if (jobsJson.success && Array.isArray(jobsJson.jobs)) {
        setJobOptions(jobsJson.jobs.map((j: { id: string; title: string }) => ({ id: j.id, title: j.title })))
      }

      const analyticsJson = await analyticsRes.json()
      if (analyticsJson.success && analyticsJson.analytics) {
        setAnalyticsData(analyticsJson.analytics as EmployerAnalyticsData)
      } else {
        setAnalyticsData(null)
      }
    } catch (e) {
      console.error('Analytics load failed:', e)
      setAnalyticsData(null)
    } finally {
      setLoading(false)
    }
  }, [supabase, dateRange, selectedJob])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const chartPoints = useMemo(() => {
    if (!analyticsData?.viewsOverTime?.length) return []
    const v = analyticsData.viewsOverTime
    if (v.length <= 31) return v
    const step = Math.ceil(v.length / 28)
    const out: typeof v = []
    for (let i = 0; i < v.length; i += step) {
      const chunk = v.slice(i, i + step)
      out.push({
        date: chunk[0].date,
        views: chunk.reduce((s, d) => s + d.views, 0),
        clicks: chunk.reduce((s, d) => s + d.clicks, 0),
      })
    }
    return out
  }, [analyticsData])

  const maxBar = useMemo(
    () => Math.max(...chartPoints.map(d => d.views), 1),
    [chartPoints]
  )

  const maxCompareViews = useMemo(() => {
    if (!analyticsData?.topPerformingJobs.length) return 1
    return Math.max(...analyticsData.topPerformingJobs.map(j => j.views), 1)
  }, [analyticsData])

  const handleExport = () => {
    if (!analyticsData) return
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employer-analytics-${dateRange}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !analyticsData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  if (noCompany) {
    return (
      <div className="py-12 text-center">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No company on file</h3>
        <p className="text-gray-600">Create or link a company to see employer analytics.</p>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="py-12 text-center">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No analytics data</h3>
        <p className="text-gray-600">Post jobs to start collecting views and applications.</p>
      </div>
    )
  }

  const insightStyles = {
    positive: 'bg-green-50',
    neutral: 'bg-slate-50',
    caution: 'bg-amber-50',
  } as const

  const insightTitle = {
    positive: 'text-green-900',
    neutral: 'text-slate-900',
    caution: 'text-amber-900',
  } as const

  const insightBody = {
    positive: 'text-green-800',
    neutral: 'text-slate-700',
    caution: 'text-amber-800',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">Employer hub</p>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Analytics</h1>
          <p className="mt-1 text-sm text-text/55">Job performance for the selected period</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Filter by job"
          >
            <option value="all">All jobs</option>
            {jobOptions.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeKey)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" type="button" onClick={() => loadAnalytics()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" type="button" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            <TrendCaption value={analyticsData.trends.viewsChangePercent} suffix="vs prior period" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement (views)</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Clicks tracked as views until click data exists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalApplications.toLocaleString()}</div>
            <TrendCaption
              value={analyticsData.trends.applicationsChangePercent}
              suffix="vs prior period"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Applications ÷ views in this period
              {analyticsData.averageViewsPerJob > 0 ? (
                <> · Avg {analyticsData.averageViewsPerJob} views per job</>
              ) : null}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                ${analyticsData.revenue.thisMonth.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Est. monthly (featured × $99)</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                ${analyticsData.revenue.total.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Same basis as dashboard totals</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-500">—</div>
              <p className="text-sm text-gray-600">Historical billing not stored yet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top roles (this period)</CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.topPerformingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No views or applications in this range.</p>
          ) : (
            <div className="space-y-4">
              {analyticsData.topPerformingJobs.map((job, index) => (
                <div key={job.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {job.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          {job.clicks} clicks
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {job.applications} applications
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-semibold text-gray-900">{job.conversionRate}%</div>
                    <p className="text-sm text-gray-600">Conversion</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Views over time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No views in this period.</p>
            ) : (
              <div className="flex h-52 items-end gap-px sm:gap-0.5">
                {chartPoints.map(day => (
                  <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center">
                    <div className="flex h-44 w-full items-end justify-center px-px">
                      <div
                        className="w-full max-w-[14px] rounded-t bg-primary"
                        style={{
                          height: `${Math.max((day.views / maxBar) * 100, day.views > 0 ? 4 : 0)}%`,
                        }}
                        title={`${day.date}: ${day.views} views`}
                      />
                    </div>
                    <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">
                      {day.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relative views by job</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topPerformingJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data for this period.</p>
            ) : (
              <div className="space-y-3">
                {analyticsData.topPerformingJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-sm font-medium text-gray-700">{job.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(job.views / maxCompareViews) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-gray-600">{job.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analyticsData.insights.map((item, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-lg p-4 ${insightStyles[item.tone]}`}>
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
              <div>
                <h4 className={`font-medium ${insightTitle[item.tone]}`}>{item.title}</h4>
                <p className={`text-sm ${insightBody[item.tone]}`}>{item.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
