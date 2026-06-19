'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  MapPin,
  Briefcase,
  Star,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

interface Job {
  id: string
  title: string
  company: string
  location: string
  salaryRange: string
  jobType: string
  status: 'active' | 'expired' | 'draft' | 'paused'
  isFeatured: boolean
  views: number
  applications: number
  createdAt: string
  expiresAt: string
  description: string
}

const STATUS_META: Record<Job['status'], { label: string; dot: string; chip: string }> = {
  active: { label: 'Active', dot: 'bg-success', chip: 'bg-success/10 text-success' },
  expired: { label: 'Expired', dot: 'bg-accent', chip: 'bg-accent/10 text-accent' },
  draft: { label: 'Draft', dot: 'bg-primary', chip: 'bg-primary/10 text-primary' },
  paused: { label: 'Paused', dot: 'bg-text/40', chip: 'bg-text/5 text-text/60' },
}

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('users')
          .select('employer_company_id')
          .eq('id', user.id)
          .single()

        const compId = profile?.employer_company_id
        if (compId) {
          const { data: company } = await supabase.from('companies').select('id, name').eq('id', compId).single()
          if (company) {
            setCompanyId(company.id)
            await fetchJobs(company.id, company.name)
          } else {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const fetchJobs = async (compId: string, companyName: string) => {
    try {
      // Fetch jobs from database
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', compId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching jobs:', error)
        setLoading(false)
        return
      }

      // Get views and applications for each job
      const jobIds = jobsData?.map(j => j.id) || []

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

      // Map to Job format
      const mappedJobs: Job[] = (jobsData || []).map(job => {
        const isExpired = job.expires_at ? new Date(job.expires_at) < new Date() : false
        const status: 'active' | 'expired' | 'draft' | 'paused' =
          isExpired ? 'expired' : 'active' // Simplified - you'd have a status field

        return {
          id: job.id,
          title: job.title,
          company: companyName,
          location: job.location,
          salaryRange: job.salary_range || 'Not specified',
          jobType: job.job_type || 'Full-time',
          status,
          isFeatured: job.is_featured || false,
          views: viewsCount[job.id] || 0,
          applications: applicationsCount[job.id] || 0,
          createdAt: job.created_at || new Date().toISOString(),
          expiresAt: job.expires_at || '',
          description: job.description || '',
        }
      })

      setJobs(mappedJobs)
      setFilteredJobs(mappedJobs)
    } catch (error) {
      console.error('Error mapping jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = jobs

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }, [jobs, searchQuery, statusFilter])

  // Aggregate KPIs — all computed from the real jobs list (no fabricated metrics).
  const kpis = useMemo(() => {
    const totalViews = jobs.reduce((s, j) => s + j.views, 0)
    const totalApplicants = jobs.reduce((s, j) => s + j.applications, 0)
    return {
      active: jobs.filter(j => j.status === 'active').length,
      applicants: totalApplicants,
      views: totalViews,
      featured: jobs.filter(j => j.isFeatured).length,
    }
  }, [jobs])

  // Filter tabs with live counts, only for statuses actually present.
  const statusTabs = useMemo(() => {
    const order: Job['status'][] = ['active', 'draft', 'paused', 'expired']
    const present = order.filter(s => jobs.some(j => j.status === s))
    return [
      { key: 'all', label: 'All listings', count: jobs.length },
      ...present.map(s => ({ key: s, label: STATUS_META[s].label, count: jobs.filter(j => j.status === s).length })),
    ]
  }, [jobs])

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return
    }

    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to delete job')
        return
      }

      // Refresh jobs list
      if (companyId) {
        const { data: company } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', companyId)
          .single()

        if (company) {
          await fetchJobs(company.id, company.name)
        }
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const kpiCards = [
    { label: 'Active listings', value: kpis.active, icon: Briefcase, tint: 'bg-success/10 text-success' },
    { label: 'Total applicants', value: kpis.applicants, icon: Users, tint: 'bg-primary/10 text-primary' },
    { label: 'Total views', value: kpis.views, icon: Eye, tint: 'bg-secondary/10 text-secondary' },
    { label: 'Featured', value: kpis.featured, icon: Star, tint: 'bg-accent/10 text-accent' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Command header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Hiring command center
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Manage listings</h1>
          <p className="mt-1 text-sm text-text/55">Track every open role, its reach, and its applicant pipeline.</p>
        </div>
        <Button asChild className="bg-primary text-white shadow-sm hover:bg-primary-600">
          <Link href="/employer/manage-jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Post a job
          </Link>
        </Button>
      </div>

      {/* KPI strip — real aggregates */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map(k => (
          <div key={k.label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-card">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', k.tint)}>
              <k.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums text-text">{k.value.toLocaleString()}</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-text/45">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusTabs.map(tab => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-text/65 hover:bg-background'
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-1.5 text-[11px] font-semibold tabular-nums', isActive ? 'bg-white/25 text-white' : 'bg-text/5 text-text/50')}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
          <Input
            placeholder="Search roles, locations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Job pipeline cards */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-text">No jobs found</h3>
          <p className="mb-4 text-sm text-text/55">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Get started by posting your first job.'}
          </p>
          <Button asChild className="bg-primary text-white hover:bg-primary-600">
            <Link href="/employer/manage-jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Post a job
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredJobs.map((job, i) => {
            const conversion = job.views > 0 ? Math.round((job.applications / job.views) * 100) : 0
            const meta = STATUS_META[job.status]
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut, delay: Math.min(i * 0.04, 0.3) }}
                className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-text">{job.title}</h3>
                      {job.isFeatured && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          <Star className="h-3 w-3" /> Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-text/55">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {job.location}
                    </p>
                  </div>
                  <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', meta.chip)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} /> {meta.label}
                  </span>
                </div>

                {/* Metric tiles — Applicants / Views / Conversion (all real) */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-primary/[0.07] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">Applicants</p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-text">{job.applications.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/[0.06] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary/80">Views</p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-text">{job.views.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-text/50">
                      <TrendingUp className="h-3 w-3" /> Conv.
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-text">{conversion}%</p>
                  </div>
                </div>

                {/* Footer meta + actions */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-xs text-text/55">
                  <span className="font-medium text-text/70">{job.jobType}</span>
                  <span>{job.salaryRange}</span>
                  <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" className="border-border" asChild>
                    <Link href={`/employer/manage-jobs/${job.id}`}>
                      <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="border-border" asChild>
                    <Link href={`/jobs/${job.id}`}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                    </Link>
                  </Button>
                  <Button size="sm" className="bg-secondary text-white hover:bg-secondary-600" asChild>
                    <Link href="/employer/applications">
                      <Users className="mr-1.5 h-3.5 w-3.5" /> Review applicants
                    </Link>
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job.id)}
                    className="ml-auto rounded-lg p-2 text-text/40 transition-colors hover:bg-accent/10 hover:text-accent"
                    aria-label="Delete listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
