'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
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
  Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JobApplicationModal } from '@/components/ui/job-application-modal'

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

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [locationFilter, setLocationFilter] = useState(searchParams.get('l') || '')
  const [dateFilter, setDateFilter] = useState<DateFilter>('anytime')
  const [remoteFilter, setRemoteFilter] = useState<RemoteFilter>('all')
  const [salaryFilter, setSalaryFilter] = useState<SalaryFilter>('all')
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [visitedJobs, setVisitedJobs] = useState<Set<string>>(new Set())
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set())
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const [showRemoteDropdown, setShowRemoteDropdown] = useState(false)
  const [showSalaryDropdown, setShowSalaryDropdown] = useState(false)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const jobsListRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load visited jobs from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visited = sessionStorage.getItem('visitedJobs')
      if (visited) {
        setVisitedJobs(new Set(JSON.parse(visited)))
      }
      const bookmarked = sessionStorage.getItem('bookmarkedJobs')
      if (bookmarked) {
        setBookmarkedJobs(new Set(JSON.parse(bookmarked)))
      }
    }
  }, [])

  // Load selected job from URL
  useEffect(() => {
    const jobId = searchParams.get('vjk')
    if (jobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === jobId)
      if (job) {
        setSelectedJob(job)
        markAsVisited(job.id)
      }
    }
  }, [searchParams, jobs])

  // Save visited jobs to session storage
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

  // Update URL without page refresh
  const updateURL = useCallback((jobId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (jobId) {
      params.set('vjk', jobId)
    } else {
      params.delete('vjk')
    }
    router.replace(`/jobs?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    if (selectedJob && detailPanelRef.current) {
      detailPanelRef.current.scrollTo(0, 0)
      markAsVisited(selectedJob.id)
      updateURL(selectedJob.id)
    } else {
      updateURL(null)
    }
  }, [selectedJob, markAsVisited, updateURL])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            logo_url,
            description,
            website
          )
        `)
        .gte('expires_at', new Date().toISOString())
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply date filter
      if (dateFilter !== 'anytime') {
        const now = new Date()
        let cutoffDate = new Date()
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

      // Apply remote filter
      if (remoteFilter !== 'all') {
        query = query.eq('remote_type', remoteFilter === 'remote' ? 'Remote' : remoteFilter === 'hybrid' ? 'Hybrid' : 'On-site')
      }

      // Apply salary filter (if we have salary data)
      // Note: This is a simplified version - you'd need to parse salary ranges for real filtering

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      if (locationFilter.trim()) {
        query = query.ilike('location', `%${locationFilter}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      if (data) {
        setJobs(data as Job[])
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err)
      setError(err.message || 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJobs()
  }

  const handleJobClick = async (job: Job) => {
    // Toggle selection: if clicking the same job, deselect it
    if (selectedJob?.id === job.id) {
      setSelectedJob(null)
    } else {
      setDetailLoading(true)
      // Simulate loading for better UX
      setTimeout(() => {
        setSelectedJob(job)
        markAsVisited(job.id)
        setDetailLoading(false)
      }, 100)
    }
  }

  const handleCloseDetails = () => {
    setSelectedJob(null)
  }

  const handleBookmark = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to bookmark jobs')
        return
      }

      const isBookmarked = bookmarkedJobs.has(job.id)
      
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/jobs/bookmark?jobId=${job.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setBookmarkedJobs(prev => {
            const updated = new Set(prev)
            updated.delete(job.id)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('bookmarkedJobs', JSON.stringify(Array.from(updated)))
            }
            return updated
          })
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/jobs/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            jobSnapshot: job,
            source: 'premium',
          }),
        })
        if (response.ok) {
          setBookmarkedJobs(prev => {
            const updated = new Set(prev)
            updated.add(job.id)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('bookmarkedJobs', JSON.stringify(Array.from(updated)))
            }
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Error bookmarking job:', error)
    }
  }

  const getJobSnippet = (job: Job, query: string): string => {
    if (!query.trim()) {
      return job.description.substring(0, 150) + '...'
    }
    const lowerQuery = query.toLowerCase()
    const lowerDesc = job.description.toLowerCase()
    const index = lowerDesc.indexOf(lowerQuery)
    if (index !== -1) {
      const start = Math.max(0, index - 50)
      const end = Math.min(job.description.length, index + query.length + 100)
      return '...' + job.description.substring(start, end) + '...'
    }
    return job.description.substring(0, 150) + '...'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Just now'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 relative" style={{ zIndex: 0 }}>
      {/* Sticky Search Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm" style={{ zIndex: 30 }}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Job title, keywords, or company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="w-64 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 px-8">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Find jobs'
              )}
            </Button>
          </form>

          {/* Quick Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Filters:</span>
            
            {/* Date Posted Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDateDropdown(!showDateDropdown)
                  setShowRemoteDropdown(false)
                  setShowSalaryDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-4 w-4" />
                {dateFilter === 'anytime' ? 'Date posted' : dateFilter === 'today' ? 'Today' : dateFilter === '3days' ? '3 days' : dateFilter === 'week' ? 'Past week' : 'Past month'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showDateDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDateDropdown(false)}
                  />
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 min-w-[150px]">
                    {(['anytime', 'today', '3days', 'week', 'month'] as DateFilter[]).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setDateFilter(filter)
                          setShowDateDropdown(false)
                          fetchJobs()
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          dateFilter === filter ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {filter === 'anytime' ? 'Any time' : filter === 'today' ? 'Today' : filter === '3days' ? 'Past 3 days' : filter === 'week' ? 'Past week' : 'Past month'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Remote Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRemoteDropdown(!showRemoteDropdown)
                  setShowDateDropdown(false)
                  setShowSalaryDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                {remoteFilter === 'all' ? 'Remote' : remoteFilter === 'remote' ? 'Remote only' : remoteFilter === 'hybrid' ? 'Hybrid' : 'On-site'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showRemoteDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRemoteDropdown(false)}
                  />
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 min-w-[150px]">
                    {(['all', 'remote', 'hybrid', 'onsite'] as RemoteFilter[]).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setRemoteFilter(filter)
                          setShowRemoteDropdown(false)
                          fetchJobs()
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          remoteFilter === filter ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter === 'remote' ? 'Remote' : filter === 'hybrid' ? 'Hybrid' : 'On-site'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Salary Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSalaryDropdown(!showSalaryDropdown)
                  setShowDateDropdown(false)
                  setShowRemoteDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                {salaryFilter === 'all' ? 'Salary' : `$${salaryFilter}+`}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showSalaryDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSalaryDropdown(false)}
                  />
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 min-w-[150px]">
                    {(['all', '40k', '60k', '80k', '100k', '120k'] as SalaryFilter[]).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setSalaryFilter(filter)
                          setShowSalaryDropdown(false)
                          fetchJobs()
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          salaryFilter === filter ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {filter === 'all' ? 'Any salary' : `$${filter}+`}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-full h-[calc(100vh-200px)]">
        {/* Jobs List - Left Side */}
        <div className={`flex-1 transition-all duration-300 overflow-y-auto ${
          selectedJob ? 'lg:w-1/2' : 'w-full'
        }`} ref={jobsListRef}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Results Count */}
            {!loading && !error && (
              <div className="mb-4 text-sm text-gray-600">
                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Loading State with Skeleton */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Jobs List */}
            {!loading && !error && (
              <>
                {jobs.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600">
                      {searchQuery || locationFilter
                        ? 'Try adjusting your search criteria'
                        : 'No jobs are currently available. Check back later!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {jobs.map((job, index) => {
                      const isSelected = selectedJob?.id === job.id
                      const isVisited = visitedJobs.has(job.id)
                      const isBookmarked = bookmarkedJobs.has(job.id)
                      
                      return (
                        <div
                          key={job.id}
                          onClick={() => handleJobClick(job)}
                          className={`relative bg-white border-l-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                            isSelected
                              ? 'border-l-blue-600 bg-blue-50 shadow-md'
                              : 'border-l-transparent border-b border-gray-200'
                          } ${isVisited && !isSelected ? 'opacity-90' : ''}`}
                          style={{
                            animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                          }}
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className={`text-lg font-semibold line-clamp-2 transition-colors ${
                                    isVisited && !isSelected
                                      ? 'text-blue-600'
                                      : 'text-gray-900'
                                  } hover:text-blue-600`}>
                                    {job.title}
                                  </h3>
                                  {job.is_featured && (
                                    <Badge className="bg-primary text-white text-xs px-2 py-0.5">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                                  {job.company && (
                                    <span className="font-medium text-gray-900">{job.company.name}</span>
                                  )}
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{job.location}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                                  {job.salary_range && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-4 w-4" />
                                      <span>{job.salary_range}</span>
                                    </div>
                                  )}
                                  {job.job_type && (
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="h-4 w-4" />
                                      <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                                    </div>
                                  )}
                                  {job.remote_type && (
                                    <Badge variant="outline" className="text-xs">
                                      {job.remote_type}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-gray-700 line-clamp-2 text-sm mb-3">
                                  {getJobSnippet(job, searchQuery)}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatDate(job.created_at)}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleBookmark(job, e)}
                                className={`flex-shrink-0 p-2 rounded-md transition-colors ${
                                  isBookmarked
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                                type="button"
                              >
                                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Job Details Panel - Right Side */}
        {selectedJob && (
          <>
            {/* Mobile Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50"
              style={{ zIndex: 20 }}
              onClick={handleCloseDetails}
            />
            
            <div
              ref={detailPanelRef}
              className="fixed lg:relative top-0 right-0 w-full lg:w-1/2 h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)] bg-white border-l border-gray-200 overflow-y-auto shadow-xl lg:shadow-none"
              style={{ zIndex: 30 }}
            >
              {/* Sticky Header with Apply Button */}
              {detailLoading ? (
                <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm p-6" style={{ zIndex: 10 }}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ) : (
                <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm" style={{ zIndex: 10 }}>
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                        {selectedJob.company && (
                          <div className="flex items-center gap-2">
                            <p className="text-lg text-gray-700">{selectedJob.company.name}</p>
                            {/* Company Rating Placeholder */}
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>4.2</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseDetails}
                        className="flex-shrink-0"
                        type="button"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedJob.location}</span>
                      </div>
                      {selectedJob.job_type && (
                        <Badge variant="outline" className="text-xs">
                          {selectedJob.job_type.replace('-', ' ')}
                        </Badge>
                      )}
                      {selectedJob.remote_type && (
                        <Badge variant="outline" className="text-xs">
                          {selectedJob.remote_type}
                        </Badge>
                      )}
                      {selectedJob.salary_range && (
                        <Badge variant="outline" className="text-xs">
                          {selectedJob.salary_range}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowApplicationModal(true)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        type="button"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Apply Now
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => handleBookmark(selectedJob, e)}
                        className={bookmarkedJobs.has(selectedJob.id) ? 'text-yellow-500' : ''}
                        type="button"
                      >
                        <Bookmark className={`h-4 w-4 ${bookmarkedJobs.has(selectedJob.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Button variant="outline" size="icon" type="button">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Details Content */}
              {!detailLoading && (
                <div className="px-6 py-6 space-y-6">
                  {/* Job Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                      {selectedJob.description}
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Requirements
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits */}
                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Benefits
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {selectedJob.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedJob.work_schedule && (
                        <div>
                          <p className="text-gray-500 mb-1">Work Schedule</p>
                          <p className="text-gray-900 font-medium">{selectedJob.work_schedule}</p>
                        </div>
                      )}
                      {selectedJob.experience_required && (
                        <div>
                          <p className="text-gray-500 mb-1">Experience</p>
                          <p className="text-gray-900 font-medium">{selectedJob.experience_required}</p>
                        </div>
                      )}
                      {selectedJob.education_required && (
                        <div>
                          <p className="text-gray-500 mb-1">Education</p>
                          <p className="text-gray-900 font-medium">{selectedJob.education_required}</p>
                        </div>
                      )}
                      {selectedJob.application_deadline && (
                        <div>
                          <p className="text-gray-500 mb-1">Application Deadline</p>
                          <p className="text-gray-900 font-medium">{formatFullDate(selectedJob.application_deadline)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Instructions */}
                  {selectedJob.application_instructions && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Apply</h3>
                      <div className="text-gray-700 whitespace-pre-wrap bg-blue-50 border border-blue-200 rounded-lg p-4">
                        {selectedJob.application_instructions}
                      </div>
                    </div>
                  )}

                  {/* Company Card */}
                  {selectedJob.company && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-4 mb-3">
                        {selectedJob.company.logo_url && (
                          <Image
                            src={selectedJob.company.logo_url}
                            alt={selectedJob.company.name}
                            width={64}
                            height={64}
                            className="rounded-lg object-contain bg-white p-2"
                            loading="lazy"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {selectedJob.company.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>4.2 rating</span>
                            <span>•</span>
                            <span>1,234 reviews</span>
                          </div>
                          {selectedJob.company.description && (
                            <p className="text-gray-700 text-sm mb-3">{selectedJob.company.description}</p>
                          )}
                          {selectedJob.company.website && (
                            <a
                              href={selectedJob.company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium"
                            >
                              View company page
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(selectedJob.contact_email || selectedJob.contact_phone) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        {selectedJob.contact_email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${selectedJob.contact_email}`} className="text-primary hover:underline">
                              {selectedJob.contact_email}
                            </a>
                          </div>
                        )}
                        {selectedJob.contact_phone && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${selectedJob.contact_phone}`} className="text-primary hover:underline">
                              {selectedJob.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedJob.tags && selectedJob.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Report Job Link */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Flag className="h-4 w-4" />
                      Report job
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Application Modal */}
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
          onSuccess={() => {
            fetchJobs()
          }}
        />
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
