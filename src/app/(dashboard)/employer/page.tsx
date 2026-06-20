'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Plus, TrendingUp, Users, Settings, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

const easeOut = [0.22, 1, 0.36, 1] as const

interface JobStats {
  totalJobs: number
  activeJobs: number
  featuredJobs: number
  totalViews: number
  totalClicks: number
  totalApplications: number
  monthlyRevenue: number
}

interface RecentJob {
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

export default function EmployerDashboard() {
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    featuredJobs: 0,
    totalViews: 0,
    totalClicks: 0,
    totalApplications: 0,
    monthlyRevenue: 0,
  })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (mounted) setLoading(false)
          return
        }
        const { data: profile } = await supabase
          .from('users')
          .select('employer_company_id, role')
          .eq('id', user.id)
          .single()
        if (!mounted) return

        const compId = profile?.employer_company_id ?? null
        if (compId) {
          setCompanyId(compId)
          const [statsResponse, jobsResponse] = await Promise.all([
            fetch(`/api/employer/stats?companyId=${compId}`),
            fetch(`/api/employer/recent-jobs?companyId=${compId}&limit=6`),
          ])
          if (!mounted) return
          const [statsData, jobsData] = await Promise.all([statsResponse.json(), jobsResponse.json()])
          if (mounted) {
            if (statsData.success) setStats(statsData.stats)
            if (jobsData.success) setRecentJobs(jobsData.jobs)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      mounted = false
    }
  }, [supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="border-0 bg-emerald-100 text-emerald-800">Active</Badge>
      case 'expired':
        return <Badge className="border-0 bg-red-100 text-red-800">Expired</Badge>
      case 'draft':
        return <Badge className="border-0 bg-amber-100 text-amber-800">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="mb-2 text-lg font-semibold text-amber-950">No employer organization linked</h3>
          <p className="mb-4 text-amber-900/90">
            Business accounts are created with a one-time invite from your admin. Ask for a new org invite link, then
            open it and accept while signed in.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const applicantRate = stats.totalViews > 0 ? Math.round((stats.totalApplications / stats.totalViews) * 100) : 0
  const barPct = stats.totalViews > 0 ? Math.max(4, Math.min(100, (stats.totalApplications / stats.totalViews) * 100)) : 0

  const pulse = [
    { label: 'Listings', value: stats.totalJobs },
    { label: 'Active', value: stats.activeJobs },
    { label: 'Views', value: stats.totalViews },
    { label: 'Applicants', value: stats.totalApplications },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: easeOut }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Command center</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-text md:text-[2.1rem]">Hiring command center</h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-text/55">
            <span className="inline-flex h-2 w-2 rounded-full bg-success" aria-hidden />
            {stats.activeJobs} active listing{stats.activeJobs === 1 ? '' : 's'} · {stats.totalApplications} total applicant{stats.totalApplications === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild className="bg-primary text-white hover:bg-primary/90">
          <Link href="/employer/manage-jobs/new">
            <Plus className="mr-2 h-4 w-4" /> Post new job
          </Link>
        </Button>
      </div>

      {/* Live pulse hero */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-card md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text/45">Live pulse</p>
            <h2 className="mt-1 text-2xl font-bold text-text">Hiring infrastructure</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-primary">{applicantRate}%</p>
            <p className="text-xs text-text/50">Applicant rate</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pulse.map((m) => (
            <div key={m.label} className="rounded-2xl bg-gradient-to-b from-primary/[0.12] to-primary/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">{m.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-text">{m.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs text-text/50">
            <span>Views → applicants</span>
            <span className="font-medium text-text/70">{applicantRate}% convert</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${barPct}%` }} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-border/70 pt-4 text-sm text-text/60">
          <span>Featured listings: <span className="font-semibold text-text">{stats.featuredJobs}</span></span>
          <span>Monthly revenue: <span className="font-semibold text-text">${stats.monthlyRevenue}</span></span>
        </div>
      </div>

      {/* Active listings + side rail */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Active listings</h2>
            <Link href="/employer/manage-jobs" className="text-sm font-medium text-primary hover:underline">
              Manage all
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-card">
              <Briefcase className="mx-auto mb-3 h-9 w-9 text-text/25" />
              <p className="font-medium text-text/70">No listings yet</p>
              <Button className="mt-4 bg-primary text-white hover:bg-primary/90" asChild>
                <Link href="/employer/manage-jobs/new">Post your first job</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-text">{job.title}</h3>
                        {job.isFeatured && (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-text/55">{job.location}</p>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="mt-4 flex items-center gap-8">
                    <div>
                      <p className="text-xl font-bold tabular-nums text-text">{job.views.toLocaleString()}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-text/45">Views</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums text-text">{job.applications.toLocaleString()}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-text/45">Applicants</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="border-border" asChild>
                      <Link href={`/employer/manage-jobs/${job.id}`}>Edit</Link>
                    </Button>
                    <Button size="sm" className="bg-primary text-white hover:bg-primary/90" asChild>
                      <Link href="/employer/applications">Review applicants</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side rail */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-text">Recent activity</p>
            <div className="mt-3 space-y-3">
              {recentJobs.length === 0 ? (
                <p className="text-sm text-text/50">No recent activity yet.</p>
              ) : (
                recentJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                      <Briefcase className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">
                        Posted <span className="font-medium">{job.title}</span>
                      </p>
                      <p className="text-xs text-text/45">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-3 shadow-card">
            {[
              { href: '/employer/analytics', label: 'View analytics', icon: TrendingUp },
              { href: '/employer/applications', label: 'All applications', icon: Users },
              { href: '/employer/profile', label: 'Company profile', icon: Settings },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-text/80 transition-colors hover:bg-primary/5 hover:text-text"
              >
                <span className="inline-flex items-center gap-2.5">
                  <s.icon className="h-4 w-4 text-text/50" /> {s.label}
                </span>
                <ChevronRight className="h-4 w-4 text-text/30" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
