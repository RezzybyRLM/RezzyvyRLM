'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  FileStack,
  Bookmark,
  BriefcaseBusiness,
  Loader2,
  Headphones,
  Send,
  Building2,
  ExternalLink,
  BellRing,
  Plus,
  Upload,
  UserRound,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const easeOut = [0.22, 1, 0.36, 1] as const

type DiscoveryJob = {
  key: string
  title: string
  company: string
  location: string
  salaryDisplay: string | null
  logoUrl: string | null
  href: string
  external: boolean
  sourceLabel: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null)
  const [stats, setStats] = useState({
    resumes: 0,
    bookmarks: 0,
    jobAlerts: 0,
    interviews: 0,
    applications: 0,
  })
  const [alerts, setAlerts] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [discoveryJobs, setDiscoveryJobs] = useState<DiscoveryJob[]>([])
  const supabase = createClient()

  const fetchDiscoveryJobs = async () => {
    const { data: premium } = await supabase
      .from('jobs')
      .select(`id, title, location, salary_range, companies ( name, logo_url )`)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4)

    const { data: indeedRows } = await supabase
      .from('cached_indeed_jobs')
      .select('id, title, company, location, salary, apply_url, expires_at, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(12)

    const indeedFiltered = (indeedRows || []).filter((row) => {
      if (!row.expires_at) return true
      return new Date(row.expires_at) > new Date()
    })

    const out: DiscoveryJob[] = []
    for (const row of (premium || []).slice(0, 2)) {
      const r = row as unknown as {
        id: string
        title: string
        location: string | null
        salary_range: string | null
        companies: { name: string; logo_url: string | null } | { name: string; logo_url: string | null }[] | null
      }
      const companyRow = Array.isArray(r.companies) ? r.companies[0] : r.companies
      out.push({
        key: `premium-${r.id}`,
        title: r.title,
        company: companyRow?.name?.trim() || 'Employer',
        location: (r.location && r.location.trim()) || 'Location TBD',
        salaryDisplay: r.salary_range?.trim() || null,
        logoUrl: companyRow?.logo_url || null,
        href: `/jobs/${r.id}`,
        external: false,
        sourceLabel: 'On Rezzy',
      })
    }
    for (const row of indeedFiltered.slice(0, 2)) {
      const r = row as { id: string; title: string; company: string; location: string; salary: string | null; apply_url: string }
      out.push({
        key: `indeed-${r.id}`,
        title: r.title,
        company: r.company?.trim() || 'Company',
        location: (r.location && r.location.trim()) || 'Location TBD',
        salaryDisplay: r.salary?.trim() || null,
        logoUrl: null,
        href: r.apply_url,
        external: true,
        sourceLabel: 'Partner listing',
      })
    }
    setDiscoveryJobs(out)
  }

  const fetchStats = async (userId: string) => {
    const [resumeResult, bookmarkResult, alertResult, interviewResult, applicationsResult, alertRows] =
      await Promise.all([
        supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('job_alerts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
        supabase.from('interview_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('job_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      ])
    setStats({
      resumes: resumeResult.count ?? 0,
      bookmarks: bookmarkResult.count ?? 0,
      jobAlerts: alertResult.count ?? 0,
      interviews: interviewResult.count ?? 0,
      applications: applicationsResult.count ?? 0,
    })
    setAlerts((alertRows.data as Array<Record<string, unknown>>) || [])
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const sessionUser = await resolveSessionUser(supabase)
        if (!mounted) return
        if (sessionUser) {
          setUser(sessionUser)
          await Promise.all([fetchStats(sessionUser.id), fetchDiscoveryJobs()])
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  const statCards = [
    { label: 'Applications', value: stats.applications, href: '/applications', icon: Send },
    { label: 'Saved jobs', value: stats.bookmarks, href: '/bookmarks', icon: Bookmark },
    { label: 'Resumes', value: stats.resumes, href: '/resume-manager', icon: FileStack },
    { label: 'Interview practice', value: stats.interviews, href: '/interview-pro', icon: Headphones },
  ]

  // Setup completeness from real activity signals.
  const steps = [stats.resumes > 0, stats.applications > 0, stats.bookmarks > 0, stats.jobAlerts > 0, stats.interviews > 0]
  const strength = Math.round((steps.filter(Boolean).length / steps.length) * 100)

  const alertLabel = (a: Record<string, unknown>) =>
    String(a.keywords ?? a.search_query ?? a.title ?? a.query ?? 'Job alert')
  const alertLocation = (a: Record<string, unknown>) =>
    a.location ? String(a.location) : 'Anywhere'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: easeOut }}
      className="space-y-8"
    >
      {/* Greeting */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text md:text-[2rem]">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="mt-1.5 text-sm text-text/55">
            You have {stats.applications} application{stats.applications === 1 ? '' : 's'} in progress and{' '}
            {stats.bookmarks} saved job{stats.bookmarks === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-border" asChild>
            <Link href="/profile">Edit profile</Link>
          </Button>
          <Button className="bg-primary text-white hover:bg-primary/90" asChild>
            <Link href="/job-board">Browse jobs</Link>
          </Button>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <StatCard key={s.label} index={i} label={s.label} value={s.value} icon={s.icon} href={s.href} />
        ))}
      </section>

      {/* Body: discovery + right rail */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Job discovery */}
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Job discovery</h2>
            <Link href="/job-board" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {discoveryJobs.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-white/70 p-8 text-center shadow-card backdrop-blur-xl">
              <BriefcaseBusiness className="mx-auto mb-3 h-9 w-9 text-text/25" />
              <p className="font-medium text-text/70">No listings yet</p>
              <p className="mt-1 text-sm text-text/45">New roles appear here as they&apos;re published or synced.</p>
              <Button className="mt-4 bg-primary text-white hover:bg-primary/90" asChild>
                <Link href="/job-board">Browse jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {discoveryJobs.map((job) => (
                <div
                  key={job.key}
                  className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/70 p-4 shadow-card backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                    {job.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={job.logoUrl} alt="" className="max-h-full max-w-full object-contain p-1.5" />
                    ) : (
                      <Building2 className="h-6 w-6 text-text/35" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-text">{job.title}</h3>
                    <p className="truncate text-sm text-text/55">
                      {job.company} · {job.location}
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {job.sourceLabel}
                    </span>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    {job.salaryDisplay && <span className="text-sm font-semibold text-text">{job.salaryDisplay}</span>}
                    {job.external ? (
                      <a
                        href={job.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link href={job.href} className="text-xs font-medium text-primary hover:underline">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Profile strength */}
          <div className="rounded-2xl border border-border/70 bg-white/70 p-5 shadow-card backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-text">Profile strength</p>
              <span className="text-sm font-semibold text-primary">{strength}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${strength}%` }} />
            </div>
            <div className="mt-4 space-y-2">
              <Link
                href="/resume-manager"
                className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm text-text/80 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4 text-text/50" /> Upload a resume
                </span>
                <Plus className="h-4 w-4 text-text/40" />
              </Link>
              <Link
                href="/profile"
                className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm text-text/80 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-text/50" /> Edit your profile
                </span>
                <Plus className="h-4 w-4 text-text/40" />
              </Link>
            </div>
          </div>

          {/* AI interview card */}
          <div className="overflow-hidden rounded-2xl bg-secondary-800 p-5 text-white shadow-card">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Sparkles className="h-3 w-3" /> AI-powered
            </span>
            <h3 className="mt-3 text-lg font-semibold leading-snug">Master your interviews</h3>
            <p className="mt-1 text-sm text-white/70">
              Real-time feedback on your answers from our advanced career AI.
            </p>
            <Button className="mt-4 w-full bg-white text-secondary-900 hover:bg-white/90" asChild>
              <Link href="/interview-pro">Start practice</Link>
            </Button>
          </div>

          {/* Job alerts */}
          <div className="rounded-2xl border border-border/70 bg-white/70 p-5 shadow-card backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text">Job alerts</p>
              <Link href="/job-alerts" className="text-primary" aria-label="Manage alerts">
                <Plus className="h-4 w-4" />
              </Link>
            </div>
            {alerts.length === 0 ? (
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <BellRing className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-text/70">No alerts yet</p>
                  <Link href="/job-alerts" className="text-sm font-medium text-primary hover:underline">
                    Create your first alert
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{alertLabel(a)}</p>
                      <p className="truncate text-xs text-text/50">{alertLocation(a)}</p>
                    </div>
                    <span
                      className={
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ' +
                        (a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')
                      }
                    >
                      {a.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                ))}
                <Link href="/job-alerts" className="block pt-1 text-sm font-medium text-primary hover:underline">
                  Manage alerts
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
