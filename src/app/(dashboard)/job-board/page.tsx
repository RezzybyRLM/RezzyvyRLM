'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  Briefcase,
  DollarSign,
  X,
  Mail,
  Phone,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Building2,
  GraduationCap,
  Users,
  ChevronDown,
  Flag,
  SlidersHorizontal,
  Sparkles,
  Lock,
  LogIn,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JobApplicationModal } from '@/components/ui/job-application-modal'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'
import { findBestMatchingProfile } from '@/lib/jobs/match-score'
import { normalizeJobRows } from '@/lib/jobs/normalize-job'
import { getPlanLimits, type PlanType } from '@/lib/plans/limitations'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Job {
  id: string
  title: string
  description: string
  location: string
  salary_range: string | null
  job_type: string | null
  is_featured: boolean | null
  created_at: string | null
  expires_at: string | null
  application_deadline: string | null
  requirements: string[] | null
  benefits: string[] | null
  tags: string[] | null
  work_schedule: string | null
  remote_type: string | null
  experience_required: string | null
  education_required: string | null
  application_instructions: string | null
  contact_email: string | null
  contact_phone: string | null
  company: {
    name: string
    logo_url: string | null
    description: string | null
    website: string | null
  } | null
}

type DateFilter = 'anytime' | 'today' | '3days' | 'week' | 'month'
type RemoteFilter = 'all' | 'remote' | 'hybrid' | 'onsite'
type SalaryFilter = 'all' | '40k' | '60k' | '80k' | '100k' | '120k'

const DATE_LABEL: Record<DateFilter, string> = {
  anytime: 'Any time',
  today: 'Today',
  '3days': 'Past 3 days',
  week: 'Past week',
  month: 'Past month',
}
const REMOTE_LABEL: Record<RemoteFilter, string> = {
  all: 'Any workplace',
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}
const SALARY_LABEL: Record<SalaryFilter, string> = {
  all: 'Any salary',
  '40k': '$40k+',
  '60k': '$60k+',
  '80k': '$80k+',
  '100k': '$100k+',
  '120k': '$120k+',
}

export default function JobBoardPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [locationFilter, setLocationFilter] = useState(searchParams.get('l') || '')
  const [dateFilter, setDateFilter] = useState<DateFilter>('anytime')
  const [remoteFilter, setRemoteFilter] = useState<RemoteFilter>('all')
  const [salaryFilter, setSalaryFilter] = useState<SalaryFilter>('all')

  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [visitedJobs, setVisitedJobs] = useState<Set<string>>(new Set())
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set())
  const [openFilter, setOpenFilter] = useState<null | 'date' | 'remote' | 'salary'>(null)

  const [isAuthed, setIsAuthed] = useState(false)
  const [plan, setPlan] = useState<PlanType>('free')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchScoreLoading, setMatchScoreLoading] = useState(false)
  const [matchedProfileName, setMatchedProfileName] = useState<string | null>(null)

  const detailPanelRef = useRef<HTMLDivElement>(null)
  const openedVjkRef = useRef<string | null>(null)
  const searchRef = useRef(searchQuery)
  const locationRef = useRef(locationFilter)
  searchRef.current = searchQuery
  locationRef.current = locationFilter

  // Resolve session + load this user's real bookmarks (so saved state survives refresh)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!mounted) return
      setIsAuthed(!!user)
      if (user) {
        const [{ data: bookmarkData }, { data: planRow }] = await Promise.all([
          supabase.from('bookmarks').select('job_id').eq('user_id', user.id),
          supabase.from('user_plans').select('plan_type').eq('user_id', user.id).maybeSingle(),
        ])
        if (!mounted) return
        setBookmarkedJobs(
          new Set((bookmarkData || []).map((b: { job_id: string | null }) => b.job_id).filter(Boolean) as string[])
        )
        const pt = (planRow?.plan_type as PlanType | undefined) ?? 'free'
        setPlan(pt)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [supabase])

  // Track visited jobs across the session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const visited = sessionStorage.getItem('visitedJobs')
    if (visited) setVisitedJobs(new Set(JSON.parse(visited)))
  }, [])

  const markAsVisited = useCallback((jobId: string) => {
    setVisitedJobs(prev => {
      const updated = new Set(prev)
      updated.add(jobId)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('visitedJobs', JSON.stringify(Array.from(updated)))
      }
      return updated
    })
  }, [])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)

    const qText = searchRef.current.trim().replace(/[%_]/g, '')
    const locText = locationRef.current.trim()

    try {
      let query = supabase
        .from('jobs')
        .select(`*, companies ( name, logo_url, description, website )`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(400)

      if (dateFilter !== 'anytime') {
        const now = new Date()
        const cutoffDate = new Date()
        switch (dateFilter) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0)
            break
          case '3days':
            cutoffDate.setDate(now.getDate() - 3)
            break
          case 'week':
            cutoffDate.setDate(now.getDate() - 7)
            break
          case 'month':
            cutoffDate.setDate(now.getDate() - 30)
            break
        }
        query = query.gte('created_at', cutoffDate.toISOString())
      }

      if (remoteFilter !== 'all') {
        if (remoteFilter === 'remote') query = query.eq('remote_type', 'remote')
        else if (remoteFilter === 'hybrid') query = query.eq('remote_type', 'hybrid')
        else query = query.or('remote_type.ilike.%on-site%,remote_type.ilike.%onsite%')
      }

      const salaryMins: Record<SalaryFilter, number | null> = {
        all: null,
        '40k': 40000,
        '60k': 60000,
        '80k': 80000,
        '100k': 100000,
        '120k': 120000,
      }
      const minSal = salaryMins[salaryFilter]
      if (minSal !== null) query = query.gte('min_salary', minSal)

      if (qText) query = query.or(`title.ilike.%${qText}%,description.ilike.%${qText}%`)
      if (locText) query = query.ilike('location', `%${locText}%`)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      if (data) setJobs(normalizeJobRows(data as Record<string, unknown>[]) as unknown as Job[])
    } catch (err: unknown) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [supabase, dateFilter, remoteFilter, salaryFilter])

  useEffect(() => {
    void fetchJobs()
  }, [fetchJobs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    void fetchJobs()
  }

  const calculateJobMatchScore = useCallback(
    async (job: Job) => {
      try {
        setMatchScoreLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
          setMatchScore(null)
          setMatchedProfileName(null)
          return
        }
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
        if (error || !profiles || profiles.length === 0) {
          setMatchScore(null)
          setMatchedProfileName(null)
          return
        }
        const bestMatch = findBestMatchingProfile(profiles, job)
        if (bestMatch) {
          setMatchScore(bestMatch.score)
          setMatchedProfileName(bestMatch.profile.profile_name)
        } else {
          setMatchScore(null)
          setMatchedProfileName(null)
        }
      } catch (e) {
        console.error('Error calculating match score:', e)
        setMatchScore(null)
        setMatchedProfileName(null)
      } finally {
        setMatchScoreLoading(false)
      }
    },
    [supabase]
  )

  // Deep link: /job-board?vjk=<id> opens that job once the list has loaded.
  // This also closes the sign-in loop — signInToContinue returns the user here.
  // (Declared after calculateJobMatchScore so it isn't referenced in its TDZ.)
  useEffect(() => {
    const vjk = searchParams.get('vjk')
    if (!vjk || jobs.length === 0 || openedVjkRef.current === vjk) return
    const job = jobs.find(j => j.id === vjk)
    if (!job) return
    openedVjkRef.current = vjk
    setSelectedJob(job)
    markAsVisited(job.id)
    setMatchScore(null)
    setMatchedProfileName(null)
    void calculateJobMatchScore(job)
    requestAnimationFrame(() => detailPanelRef.current?.scrollTo(0, 0))
  }, [jobs, searchParams, markAsVisited, calculateJobMatchScore])

  const handleJobClick = (job: Job) => {
    if (selectedJob?.id === job.id) {
      setSelectedJob(null)
      setMatchScore(null)
      setMatchedProfileName(null)
      return
    }
    setSelectedJob(job)
    markAsVisited(job.id)
    setMatchScore(null)
    setMatchedProfileName(null)
    void calculateJobMatchScore(job)
    requestAnimationFrame(() => detailPanelRef.current?.scrollTo(0, 0))
  }

  const handleCloseDetails = () => setSelectedJob(null)

  // Send a guest to sign in, returning them to exactly where they were.
  const signInToContinue = (jobId?: string) => {
    const here = jobId ? `/job-board?vjk=${jobId}` : `${window.location.pathname}${window.location.search}`
    window.location.href = `/auth/login?redirectTo=${encodeURIComponent(here)}`
  }

  const handleBookmark = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        signInToContinue(job.id)
        return
      }
      const isBookmarked = bookmarkedJobs.has(job.id)
      if (isBookmarked) {
        const response = await fetch(`/api/jobs/bookmark?jobId=${job.id}`, { method: 'DELETE' })
        if (response.ok) {
          setBookmarkedJobs(prev => {
            const updated = new Set(prev)
            updated.delete(job.id)
            return updated
          })
        }
      } else {
        const response = await fetch('/api/jobs/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, jobSnapshot: job, source: 'premium' }),
        })
        if (response.ok) {
          setBookmarkedJobs(prev => new Set(prev).add(job.id))
        }
      }
    } catch (e) {
      console.error('Error bookmarking job:', e)
    }
  }

  const getJobSnippet = (job: Job): string => {
    const desc = job.description || ''
    return desc.length > 160 ? desc.substring(0, 160).trimEnd() + '…' : desc
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const diffDays = Math.ceil(Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return 'Today'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const activeFilterCount =
    (dateFilter !== 'anytime' ? 1 : 0) + (remoteFilter !== 'all' ? 1 : 0) + (salaryFilter !== 'all' ? 1 : 0)

  const FilterButton = ({
    id,
    icon: Icon,
    label,
    active,
  }: {
    id: 'date' | 'remote' | 'salary'
    icon: typeof Clock
    label: string
    active: boolean
  }) => (
    <button
      type="button"
      onClick={() => setOpenFilter(openFilter === id ? null : id)}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-white text-text/70 hover:border-primary/30 hover:text-text'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openFilter === id && 'rotate-180')} />
    </button>
  )

  const FilterMenu = <T extends string>({
    id,
    options,
    value,
    labels,
    onPick,
  }: {
    id: 'date' | 'remote' | 'salary'
    options: T[]
    value: T
    labels: Record<T, string>
    onPick: (v: T) => void
  }) =>
    openFilter === id ? (
      <>
        <div className="fixed inset-0 z-30" onClick={() => setOpenFilter(null)} />
        <div className="absolute left-0 top-full z-40 mt-1.5 min-w-[170px] overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onPick(opt)
                setOpenFilter(null)
              }}
              className={cn(
                'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-background',
                value === opt ? 'font-medium text-primary' : 'text-text/70'
              )}
            >
              {labels[opt]}
            </button>
          ))}
        </div>
      </>
    ) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Job board</h1>
        <p className="text-sm text-text/55">
          Search live roles from the Rezzy board, filter by what matters, and apply in a couple of clicks.
        </p>
      </div>

      {/* Sticky search + filter bar (full-bleed within the padded dashboard main) */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/85 px-4 pb-4 pt-1 backdrop-blur-md md:-mx-8 md:px-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text/40" />
            <Input
              type="text"
              placeholder="Job title, keywords, or company"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-12 w-full min-w-0 border-border pl-10 text-base"
            />
          </div>
          <div className="relative min-w-0 sm:w-56">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text/40" />
            <Input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="h-12 w-full min-w-0 border-border pl-10 text-base"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-12 shrink-0 px-8">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Find jobs'}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-text/55">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 bg-primary px-1.5 text-[10px] text-white">{activeFilterCount}</Badge>
            )}
          </span>

          <div className="relative">
            <FilterButton id="date" icon={Clock} label={DATE_LABEL[dateFilter]} active={dateFilter !== 'anytime'} />
            <FilterMenu
              id="date"
              options={['anytime', 'today', '3days', 'week', 'month'] as DateFilter[]}
              value={dateFilter}
              labels={DATE_LABEL}
              onPick={setDateFilter}
            />
          </div>

          <div className="relative">
            <FilterButton id="remote" icon={MapPin} label={REMOTE_LABEL[remoteFilter]} active={remoteFilter !== 'all'} />
            <FilterMenu
              id="remote"
              options={['all', 'remote', 'hybrid', 'onsite'] as RemoteFilter[]}
              value={remoteFilter}
              labels={REMOTE_LABEL}
              onPick={setRemoteFilter}
            />
          </div>

          <div className="relative">
            <FilterButton id="salary" icon={DollarSign} label={SALARY_LABEL[salaryFilter]} active={salaryFilter !== 'all'} />
            <FilterMenu
              id="salary"
              options={['all', '40k', '60k', '80k', '100k', '120k'] as SalaryFilter[]}
              value={salaryFilter}
              labels={SALARY_LABEL}
              onPick={setSalaryFilter}
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setDateFilter('anytime')
                setRemoteFilter('all')
                setSalaryFilter('all')
              }}
              className="text-sm font-medium text-text/50 underline-offset-2 hover:text-text hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Body: list + detail */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Left: job list */}
        <div className={cn('min-w-0', selectedJob ? 'hidden lg:block' : 'block')}>
          {!loading && !error && (
            <p className="mb-3 text-sm text-text/55">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
            </p>
          )}

          {/* Guest / free-member upsell banner */}
          {!isAuthed ? (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Get the full Rezzy experience</p>
                  <p className="text-sm text-text/60">
                    Create a free account to save jobs, track applications, and see AI match scores.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" className="border-border" asChild>
                  <Link href="/plans">See plans</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Sign up free</Link>
                </Button>
              </div>
            </div>
          ) : !getPlanLimits(plan).canApplyDirectly ? (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">You&apos;re on the Free plan</p>
                  <p className="text-sm text-text/60">
                    Upgrade to apply directly, unlock more searches, AI matches, and job alerts.
                  </p>
                </div>
              </div>
              <Button className="shrink-0" onClick={() => setShowUpgrade(true)}>
                <Sparkles className="mr-2 h-4 w-4" /> See plans &amp; upgrade
              </Button>
            </div>
          ) : null}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-white p-5">
                  <div className="mb-3 h-5 w-3/4 rounded bg-gray-200" />
                  <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
                  <div className="mb-2 h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="rounded-xl border border-border bg-white p-12 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-text/30" />
              <h3 className="mb-2 text-lg font-semibold text-text">No jobs found</h3>
              <p className="text-sm text-text/55">
                {searchQuery || locationFilter || activeFilterCount > 0
                  ? 'Try adjusting your search or filters.'
                  : 'No jobs are currently available. Check back later!'}
              </p>
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
            <div className="space-y-3">
              {jobs.map((job, index) => {
                const isSelected = selectedJob?.id === job.id
                const isVisited = visitedJobs.has(job.id)
                const isBookmarked = bookmarkedJobs.has(job.id)
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.25) }}
                    onClick={() => handleJobClick(job)}
                    className={cn(
                      'group relative cursor-pointer rounded-xl border bg-white p-5 transition-all duration-200',
                      isSelected
                        ? 'border-primary ring-1 ring-primary shadow-md'
                        : 'border-border hover:border-primary/40 hover:shadow-md',
                      isVisited && !isSelected && 'bg-background/60'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                        {job.company?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={job.company.logo_url} alt="" className="max-h-full max-w-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-5 w-5 text-text/35" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3
                            className={cn(
                              'line-clamp-1 text-base font-semibold transition-colors',
                              isSelected ? 'text-primary' : 'text-text group-hover:text-primary'
                            )}
                          >
                            {job.title}
                          </h3>
                          {job.is_featured && (
                            <Badge className="shrink-0 bg-primary px-2 py-0.5 text-[10px] text-white">Featured</Badge>
                          )}
                        </div>
                        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text/60">
                          {job.company && <span className="font-medium text-text/80">{job.company.name}</span>}
                          <span className="text-text/30">•</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        </div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-text/60">
                          {job.salary_range && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5">
                              <DollarSign className="h-3.5 w-3.5" />
                              {job.salary_range}
                            </span>
                          )}
                          {job.job_type && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 capitalize">
                              <Briefcase className="h-3.5 w-3.5" />
                              {job.job_type.replace('-', ' ')}
                            </span>
                          )}
                          {job.remote_type && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {job.remote_type}
                            </Badge>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm text-text/65">{getJobSnippet(job)}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-text/45">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(job.created_at)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={e => handleBookmark(job, e)}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Save job'}
                        className={cn(
                          'shrink-0 rounded-full p-2 transition-colors',
                          isBookmarked
                            ? 'bg-primary/10 text-primary'
                            : 'text-text/35 hover:bg-background hover:text-primary'
                        )}
                      >
                        <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: detail panel (sticky on desktop, full-screen drawer on mobile) */}
        <AnimatePresence mode="wait">
          {selectedJob ? (
            <>
              {/* Mobile overlay */}
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseDetails}
                className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                key={selectedJob.id}
                ref={detailPanelRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'overflow-y-auto rounded-xl border border-border bg-white shadow-sm',
                  'fixed inset-x-3 bottom-3 top-16 z-50 lg:static lg:z-auto',
                  'lg:sticky lg:top-24 lg:max-h-[calc(100dvh-9rem)] lg:self-start lg:shadow-sm'
                )}
              >
                {/* Detail header */}
                <div className="sticky top-0 z-10 border-b border-border bg-white px-5 py-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                        {selectedJob.company?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedJob.company.logo_url} alt="" className="max-h-full max-w-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-6 w-6 text-text/35" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-text">{selectedJob.title}</h2>
                        {selectedJob.company && (
                          <p className="text-sm text-text/70">{selectedJob.company.name}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCloseDetails} className="shrink-0" type="button">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-text/60">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedJob.location}
                    </span>
                    {selectedJob.job_type && (
                      <Badge variant="outline" className="capitalize">
                        {selectedJob.job_type.replace('-', ' ')}
                      </Badge>
                    )}
                    {selectedJob.remote_type && (
                      <Badge variant="outline" className="capitalize">
                        {selectedJob.remote_type}
                      </Badge>
                    )}
                    {selectedJob.salary_range && <Badge variant="outline">{selectedJob.salary_range}</Badge>}
                  </div>

                  {/* Match score */}
                  {isAuthed && (
                    <div className="mb-3">
                      {matchScoreLoading ? (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm text-text/60">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Calculating match score…
                        </div>
                      ) : matchScore !== null ? (
                        <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary/5 p-3">
                          <div>
                            <p className="text-sm font-medium text-text">Match score</p>
                            {matchedProfileName && (
                              <p className="text-xs text-text/55">
                                Based on <span className="font-medium">{matchedProfileName}</span>
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary">{matchScore}%</span>
                            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="5" fill="none" className="text-border" />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - matchScore / 100)}
                                className={cn(
                                  'transition-all duration-500',
                                  matchScore >= 80 ? 'text-success' : matchScore >= 50 ? 'text-primary' : 'text-warning'
                                )}
                              />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-background p-3 text-sm text-text/55">
                          Add an active profile to see how well you match this role.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={async () => {
                        const { data: { session } } = await supabase.auth.getSession()
                        if (!session?.user) {
                          signInToContinue(selectedJob.id)
                          return
                        }
                        // Free members can't apply directly — send them to upgrade.
                        if (!getPlanLimits(plan).canApplyDirectly) {
                          setShowUpgrade(true)
                          return
                        }
                        setShowApplicationModal(true)
                      }}
                    >
                      {!isAuthed ? (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign in to apply
                        </>
                      ) : !getPlanLimits(plan).canApplyDirectly ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Upgrade to apply
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Apply now
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={e => handleBookmark(selectedJob, e)}
                      className={bookmarkedJobs.has(selectedJob.id) ? 'bg-primary/10 text-primary' : ''}
                    >
                      <Bookmark className={cn('h-4 w-4', bookmarkedJobs.has(selectedJob.id) && 'fill-current')} />
                    </Button>
                    <Button type="button" variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Detail body */}
                <div className="space-y-6 px-5 py-5">
                  <section>
                    <h3 className="mb-2 text-base font-semibold text-text">Job description</h3>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-text/75">{selectedJob.description}</div>
                  </section>

                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-text">
                        <GraduationCap className="h-5 w-5" /> Requirements
                      </h3>
                      <ul className="list-inside list-disc space-y-1.5 text-sm text-text/75">
                        {selectedJob.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-text">
                        <Users className="h-5 w-5" /> Benefits
                      </h3>
                      <ul className="list-inside list-disc space-y-1.5 text-sm text-text/75">
                        {selectedJob.benefits.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(selectedJob.work_schedule ||
                    selectedJob.experience_required ||
                    selectedJob.education_required ||
                    selectedJob.application_deadline) && (
                    <section className="rounded-lg bg-background p-4">
                      <h3 className="mb-3 text-base font-semibold text-text">Job details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedJob.work_schedule && (
                          <div>
                            <p className="mb-0.5 text-text/50">Work schedule</p>
                            <p className="font-medium text-text">{selectedJob.work_schedule}</p>
                          </div>
                        )}
                        {selectedJob.experience_required && (
                          <div>
                            <p className="mb-0.5 text-text/50">Experience</p>
                            <p className="font-medium text-text">{selectedJob.experience_required}</p>
                          </div>
                        )}
                        {selectedJob.education_required && (
                          <div>
                            <p className="mb-0.5 text-text/50">Education</p>
                            <p className="font-medium text-text">{selectedJob.education_required}</p>
                          </div>
                        )}
                        {selectedJob.application_deadline && (
                          <div>
                            <p className="mb-0.5 text-text/50">Apply by</p>
                            <p className="font-medium text-text">{formatFullDate(selectedJob.application_deadline)}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {selectedJob.application_instructions && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold text-text">How to apply</h3>
                      <div className="whitespace-pre-wrap rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm text-text/75">
                        {selectedJob.application_instructions}
                      </div>
                    </section>
                  )}

                  {selectedJob.company && (selectedJob.company.description || selectedJob.company.website) && (
                    <section className="rounded-lg border border-border bg-background p-4">
                      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-text">
                        <Building2 className="h-5 w-5" /> {selectedJob.company.name}
                      </h3>
                      {selectedJob.company.description && (
                        <p className="mb-2 text-sm text-text/70">{selectedJob.company.description}</p>
                      )}
                      {selectedJob.company.website && (
                        <a
                          href={selectedJob.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View company page <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </section>
                  )}

                  {(selectedJob.contact_email || selectedJob.contact_phone) && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold text-text">Contact</h3>
                      <div className="space-y-2 text-sm">
                        {selectedJob.contact_email && (
                          <a href={`mailto:${selectedJob.contact_email}`} className="flex items-center gap-2 text-primary hover:underline">
                            <Mail className="h-4 w-4 text-text/40" />
                            {selectedJob.contact_email}
                          </a>
                        )}
                        {selectedJob.contact_phone && (
                          <a href={`tel:${selectedJob.contact_phone}`} className="flex items-center gap-2 text-primary hover:underline">
                            <Phone className="h-4 w-4 text-text/40" />
                            {selectedJob.contact_phone}
                          </a>
                        )}
                      </div>
                    </section>
                  )}

                  {selectedJob.tags && selectedJob.tags.length > 0 && (
                    <section>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.tags.map((tag, i) => (
                          <Badge key={i} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="border-t border-border pt-4">
                    <button type="button" className="flex items-center gap-1 text-sm text-text/45 hover:text-text/70">
                      <Flag className="h-4 w-4" /> Report job
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            // Desktop empty state for the detail column
            <div className="hidden rounded-xl border border-dashed border-border bg-white/50 lg:flex lg:sticky lg:top-24 lg:h-[calc(100dvh-12rem)] lg:flex-col lg:items-center lg:justify-center lg:self-start lg:px-8 lg:text-center">
              <Briefcase className="mb-3 h-10 w-10 text-text/25" />
              <p className="font-medium text-text/70">Select a job to see the details</p>
              <p className="mt-1 max-w-xs text-sm text-text/45">
                Pick a role from the list to view the full description, requirements, and your match score.
              </p>
              {!isAuthed ? (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <Button asChild>
                    <Link href="/auth/register">
                      <LogIn className="mr-2 h-4 w-4" /> Create a free account
                    </Link>
                  </Button>
                  <Link href="/plans" className="text-sm font-medium text-primary hover:underline">
                    Compare plans &amp; pricing
                  </Link>
                </div>
              ) : !getPlanLimits(plan).canApplyDirectly ? (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <Button onClick={() => setShowUpgrade(true)}>
                    <Sparkles className="mr-2 h-4 w-4" /> Unlock direct apply
                  </Button>
                  <Link href="/plans" className="text-sm font-medium text-primary hover:underline">
                    See plans &amp; pricing
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Application modal */}
      {selectedJob && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          job={{
            id: selectedJob.id,
            title: selectedJob.title,
            company: selectedJob.company,
            contact_email: selectedJob.contact_email,
            contact_phone: selectedJob.contact_phone,
            application_instructions: selectedJob.application_instructions,
          }}
          onSuccess={() => void fetchJobs()}
        />
      )}

      {/* Upgrade / pricing modal for free members */}
      <UpgradePrompt
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Upgrade your plan"
        message="Direct apply, more job searches, AI match scores and job alerts are available on paid plans."
        feature="direct apply & AI tools"
        currentPlan={plan}
      />
    </div>
  )
}
