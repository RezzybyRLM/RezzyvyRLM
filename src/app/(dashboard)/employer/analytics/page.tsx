'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
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
  Sparkles,
} from 'lucide-react'
import type { EmployerAnalyticsData } from '@/lib/employer/analytics-types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

type DateRangeKey = '7d' | '30d' | '90d' | '1y'

function TrendCaption({
  value,
  suffix,
}: {
  value: number | null
  suffix: string
}) {
  if (value === null) {
    return <p className="text-xs text-text/45">No prior period to compare</p>
  }
  const up = value >= 0
  return (
    <p className={cn('inline-flex items-center text-xs font-medium', up ? 'text-success' : 'text-accent')}>
      {up ? (
        <TrendingUp className="mr-1 inline h-3 w-3" aria-hidden />
      ) : (
        <TrendingDown className="mr-1 inline h-3 w-3" aria-hidden />
      )}
      {up ? '+' : ''}
      {value}% <span className="ml-1 font-normal text-text/45">{suffix}</span>
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
      <div className="rounded-2xl border border-border bg-white py-12 text-center shadow-card">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-text/25" />
        <h3 className="mb-2 text-lg font-semibold text-text">No company on file</h3>
        <p className="text-text/55">Create or link a company to see employer analytics.</p>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="rounded-2xl border border-border bg-white py-12 text-center shadow-card">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-text/25" />
        <h3 className="mb-2 text-lg font-semibold text-text">No analytics data</h3>
        <p className="text-text/55">Post jobs to start collecting views and applications.</p>
      </div>
    )
  }

  const insightStyles = {
    positive: { wrap: 'bg-success/10', icon: 'text-success', title: 'text-success' },
    neutral: { wrap: 'bg-secondary/[0.06]', icon: 'text-secondary', title: 'text-secondary' },
    caution: { wrap: 'bg-primary/10', icon: 'text-primary', title: 'text-primary' },
  } as const

  const headlineCards = [
    {
      label: 'Total views',
      value: analyticsData.totalViews.toLocaleString(),
      icon: Eye,
      tint: 'bg-secondary/10 text-secondary',
      caption: <TrendCaption value={analyticsData.trends.viewsChangePercent} suffix="vs prior period" />,
    },
    {
      label: 'Engagement',
      value: analyticsData.totalClicks.toLocaleString(),
      icon: MousePointer,
      tint: 'bg-primary/10 text-primary',
      caption: <p className="text-xs text-text/45">Clicks tracked as views until click data exists</p>,
    },
    {
      label: 'Applications',
      value: analyticsData.totalApplications.toLocaleString(),
      icon: Users,
      tint: 'bg-accent/10 text-accent',
      caption: <TrendCaption value={analyticsData.trends.applicationsChangePercent} suffix="vs prior period" />,
    },
    {
      label: 'Conversion rate',
      value: `${analyticsData.conversionRate}%`,
      icon: BarChart3,
      tint: 'bg-success/10 text-success',
      caption: (
        <p className="text-xs text-text/45">
          Applications ÷ views
          {analyticsData.averageViewsPerJob > 0 ? <> · Avg {analyticsData.averageViewsPerJob}/job</> : null}
        </p>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Command header + controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Hiring command center
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Analytics</h1>
          <p className="mt-1 text-sm text-text/55">Job performance for the selected period.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            aria-label="Filter by job"
          >
            <option value="all">All jobs</option>
            {jobOptions.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeKey)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            aria-label="Date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" className="border-border" type="button" onClick={() => loadAnalytics()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" className="border-border" type="button" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {headlineCards.map(card => (
          <div key={card.label} className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text/45">{card.label}</p>
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', card.tint)}>
                <card.icon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-text">{card.value}</p>
            <div className="mt-1">{card.caption}</div>
          </div>
        ))}
      </div>

      {/* Revenue estimate */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-text">Revenue estimate</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-b from-primary/[0.12] to-primary/[0.04] p-5 text-center">
            <div className="text-3xl font-bold tabular-nums text-text">${analyticsData.revenue.thisMonth.toLocaleString()}</div>
            <p className="mt-1 text-sm text-text/55">Est. monthly (featured × $99)</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-secondary/[0.1] to-secondary/[0.03] p-5 text-center">
            <div className="text-3xl font-bold tabular-nums text-text">${analyticsData.revenue.total.toLocaleString()}</div>
            <p className="mt-1 text-sm text-text/55">Same basis as dashboard totals</p>
          </div>
          <div className="rounded-xl bg-background p-5 text-center">
            <div className="text-3xl font-bold text-text/40">—</div>
            <p className="mt-1 text-sm text-text/55">Historical billing not stored yet</p>
          </div>
        </div>
      </div>

      {/* Top roles */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-text">Top roles (this period)</h2>
        {analyticsData.topPerformingJobs.length === 0 ? (
          <p className="mt-4 text-sm text-text/55">No views or applications in this range.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {analyticsData.topPerformingJobs.map((job, index) => (
              <div key={job.id} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 transition-colors hover:bg-background/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text/55">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views} views</span>
                      <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{job.clicks} clicks</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications} applications</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-lg font-bold tabular-nums text-text">{job.conversionRate}%</div>
                  <p className="text-sm text-text/55">Conversion</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-text">Views over time</h2>
          {chartPoints.length === 0 ? (
            <p className="mt-4 text-sm text-text/55">No views in this period.</p>
          ) : (
            <div className="mt-5 flex h-52 items-end gap-px sm:gap-0.5">
              {chartPoints.map(day => (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex h-44 w-full items-end justify-center px-px">
                    <div
                      className="w-full max-w-[14px] rounded-t bg-gradient-to-t from-primary to-primary-400"
                      style={{
                        height: `${Math.max((day.views / maxBar) * 100, day.views > 0 ? 4 : 0)}%`,
                      }}
                      title={`${day.date}: ${day.views} views`}
                    />
                  </div>
                  <span className="mt-1 w-full truncate text-center text-[10px] text-text/45">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-text">Relative views by job</h2>
          {analyticsData.topPerformingJobs.length === 0 ? (
            <p className="mt-4 text-sm text-text/55">No data for this period.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {analyticsData.topPerformingJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-sm font-medium text-text/75">{job.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary/10">
                      <div
                        className="h-2 rounded-full bg-secondary"
                        style={{ width: `${(job.views / maxCompareViews) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm tabular-nums text-text/55">{job.views}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <Sparkles className="h-4.5 w-4.5 text-primary" /> Insights
        </h2>
        <div className="mt-4 space-y-3">
          {analyticsData.insights.map((item, i) => {
            const s = insightStyles[item.tone]
            return (
              <div key={i} className={cn('flex items-start gap-3 rounded-xl p-4', s.wrap)}>
                <Calendar className={cn('mt-0.5 h-5 w-5 shrink-0', s.icon)} />
                <div>
                  <h4 className={cn('font-semibold', s.title)}>{item.title}</h4>
                  <p className="text-sm text-text/70">{item.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
