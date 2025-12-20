'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
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
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  
  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (selectedJob && detailPanelRef.current) {
      detailPanelRef.current.scrollTo(0, 0)
    }
  }, [selectedJob])

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
        if (data.length > 0 && !selectedJob) {
          setSelectedJob(data[0] as Job)
        }
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
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Search Bar */}
      <div className={`sticky top-0 z-40 bg-white border-b border-gray-200 transition-all duration-300 ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
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
              </div>
              </div>

      <div className="flex max-w-full">
        {/* Jobs List - Left Side */}
        <div className={`flex-1 transition-all duration-300 ${
          selectedJob ? 'lg:w-1/2' : 'w-full'
        }`}>
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

            {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-gray-600">Loading jobs...</p>
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
                  <div className="space-y-3">
                    {jobs.map((job, index) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 ${
                          selectedJob?.id === job.id
                            ? 'border-primary shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2">
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
                                {job.description}
                              </p>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatDate(job.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Job Details Panel - Right Side */}
        {selectedJob && (
          <div
            ref={detailPanelRef}
            className="fixed lg:relative top-0 right-0 w-full lg:w-1/2 h-screen lg:h-auto bg-white border-l border-gray-200 overflow-y-auto z-30 animate-slideInRight shadow-xl lg:shadow-none"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
              <div className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                    {selectedJob.company && (
                      <p className="text-lg text-gray-700">{selectedJob.company.name}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedJob(null)}
                    className="lg:hidden"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedJob.location}</span>
                  </div>
                  {selectedJob.job_type && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span className="capitalize">{selectedJob.job_type.replace('-', ' ')}</span>
                    </div>
                  )}
                  {selectedJob.salary_range && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{selectedJob.salary_range}</span>
                    </div>
                  )}
                  {selectedJob.remote_type && (
                    <Badge variant="outline">{selectedJob.remote_type}</Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  {selectedJob.contact_email && (
                    <Button
                      asChild
                      className="flex-1"
                      type="button"
                    >
                      <a href={`mailto:${selectedJob.contact_email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Apply Now
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="icon" type="button">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" type="button">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Job Details Content */}
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

              {/* Company Info */}
              {selectedJob.company && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    About {selectedJob.company.name}
                  </h3>
                  {selectedJob.company.description && (
                    <p className="text-gray-700 mb-3">{selectedJob.company.description}</p>
                  )}
                  {selectedJob.company.website && (
                    <a
                      href={selectedJob.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Visit company website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
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
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {selectedJob && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20 animate-fadeIn"
            onClick={() => setSelectedJob(null)}
          />
        )}
      </div>

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
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
