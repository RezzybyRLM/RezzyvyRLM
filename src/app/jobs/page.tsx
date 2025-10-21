'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobCard } from '@/components/ui/job-card'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'
import { Search, MapPin, Settings, Loader2, AlertCircle } from 'lucide-react'
import { TransformedJob } from '@/lib/types/indeed-job'
import GeoJobManager from '@/components/ui/geo-job-manager'
import { JobLocation } from '@/lib/location/service'
import { createClient } from '@/lib/supabase/client'
import { canPerformAction } from '@/lib/plans/usage-tracking'

function JobsPageContent() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<TransformedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set())
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [currentPlan, setCurrentPlan] = useState('Free')
  const supabase = createClient()
  
  const [filters, setFilters] = useState({
    jobType: '',
    salary: '',
    datePosted: '',
  })

  // Load user's bookmarks and applications
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get bookmarks
      const { data: bookmarks } = await (supabase as any)
        .from('bookmarks')
        .select('job_id')
        .eq('user_id', user.id)

      if (bookmarks) {
        setBookmarkedJobs(new Set(bookmarks.map((b: any) => b.job_id).filter(Boolean)))
      }

      // Get applications
      const { data: applications } = await (supabase as any)
        .from('job_applications')
        .select('job_id')
        .eq('user_id', user.id)

      if (applications) {
        setAppliedJobs(new Set(applications.map((a: any) => a.job_id).filter(Boolean)))
      }

      // Get user plan
      const { data: plan } = await (supabase as any)
        .from('user_plans')
        .select('plan_type')
        .eq('user_id', user.id)
        .single()

      if (plan) {
        setCurrentPlan(plan.plan_type || 'Free')
      }
    }

    loadUserData()
  }, [supabase])

  const fetchJobs = async (position: string, location?: string) => {
    setLoading(true)
    setError(null)

    try {
      // Check if user can search
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { allowed, reason } = await canPerformAction(user.id, 'jobSearch')
        if (!allowed) {
          setError(reason || 'Search limit reached')
          setUpgradeMessage(reason || '')
          setShowUpgradePrompt(true)
          setLoading(false)
          return
        }
      }

      const params = new URLSearchParams({
        position,
        country: 'us',
        maxItems: '20',
        date: '7',
      })
      
      if (location) {
        params.set('location', location)
      }

      const response = await fetch(`/api/fetch-indeed-jobs?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setJobs(data.jobs)
      } else {
        setError(data.error || 'Failed to fetch jobs')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchJobs(searchQuery.trim(), location.trim() || undefined)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleBookmark = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    try {
      const response = await fetch('/api/jobs/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobSnapshot: job,
          source: job.source || 'indeed',
        }),
      })

      const data = await response.json()

      if (data.requiresUpgrade) {
        setUpgradeMessage(data.error)
        setShowUpgradePrompt(true)
        return
      }

      if (data.success) {
        setBookmarkedJobs(prev => new Set(prev).add(jobId))
      }
    } catch (error) {
      console.error('Error bookmarking job:', error)
    }
  }

  const handleMarkApplied = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    try {
      const response = await fetch('/api/jobs/mark-applied', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobTitle: job.title,
          companyName: job.company_name,
          applicationUrl: job.apply_url,
          jobSource: job.source || 'indeed',
        }),
      })

      const data = await response.json()

      if (data.requiresUpgrade) {
        setUpgradeMessage(data.error)
        setShowUpgradePrompt(true)
        return
      }

      if (data.success) {
        setAppliedJobs(prev => new Set(prev).add(jobId))
      }
    } catch (error) {
      console.error('Error marking job as applied:', error)
    }
  }

  // Apply filters to jobs
  const filteredJobs = jobs.filter(job => {
    if (filters.jobType && job.job_type !== filters.jobType) return false
    if (filters.datePosted) {
      const jobDate = new Date(job.scraped_at || '')
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (filters.datePosted) {
        case 'today':
          return daysDiff === 0
        case 'week':
          return daysDiff <= 7
        case 'month':
          return daysDiff <= 30
        default:
          return true
      }
    }
    return true
  })

  // Load jobs on component mount if search params exist
  useEffect(() => {
    const q = searchParams.get('q')
    const loc = searchParams.get('location')
    
    if (q) {
      fetchJobs(q, loc || undefined)
    }
  }, [searchParams])

  const handleJobsFiltered = (filteredJobs: JobLocation[]) => {
    // Convert JobLocation back to TransformedJob format
    const convertedJobs = filteredJobs.map(job => ({
      id: job.id,
      title: job.title,
      company_name: job.company,
      location: job.location,
      description: '', // JobLocation doesn't have description
      apply_url: job.applyUrl,
      salary_range: job.salary || '',
      job_type: 'Full-time', // Default value
      source: job.source,
      scraped_at: new Date().toISOString(),
    }))
    setJobs(convertedJobs)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto container-padding section-padding">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-responsive-xl font-bold text-gray-900 mb-4">Find Your Next Job</h1>
          <p className="text-responsive-md text-gray-600">Discover opportunities from Indeed and premium employers</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 card-professional">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Job title, keywords, or company"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-professional pl-10"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input-professional pl-10"
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search Jobs'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8 card-professional">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange('jobType', e.target.value)}
                  className="input-professional"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Posted
                </label>
                <select
                  value={filters.datePosted}
                  onChange={(e) => handleFilterChange('datePosted', e.target.value)}
                  className="input-professional"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <div className="flex space-x-2">
                  <Badge variant="outline">Indeed</Badge>
                  <Badge variant="featured">Featured</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 card-professional">
              <CardContent className="p-6">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-gray-600">Searching for jobs...</p>
            </div>
          )}

          {!loading && !error && jobs.length === 0 && searchQuery && (
            <Card className="card-professional">
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">No jobs found for "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search terms or location
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && jobs.length > 0 && (
            <GeoJobManager
              jobs={jobs.map(job => ({
                id: job.id,
                title: job.title,
                company: job.company_name,
                location: job.location,
                description: job.description,
                applyUrl: job.apply_url,
                salary: job.salary_range,
                source: job.source as 'indeed' | 'premium',
              }))}
              onJobsFiltered={handleJobsFiltered}
            />
          )}

          {!loading && !error && !searchQuery && (
            <Card className="card-professional">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start Your Job Search
                </h3>
                <p className="text-gray-600 mb-4">
                  Enter a job title or keywords to find relevant opportunities
                </p>
                <div className="text-sm text-gray-500">
                  <p>• Search from thousands of Indeed job listings</p>
                  <p>• Find premium featured positions</p>
                  <p>• Get AI-powered career insights</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title="Upgrade Your Plan"
        message={upgradeMessage}
        feature="Enhanced Job Search"
        currentPlan={currentPlan}
      />
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  )
}
