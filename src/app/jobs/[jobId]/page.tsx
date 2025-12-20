'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, MapPin, Clock, DollarSign, Bookmark, Share2, ArrowLeft, CheckCircle, Mail, Phone, Briefcase, GraduationCap, FileText, Calendar, Users } from 'lucide-react'
import { formatRelativeTime, formatSalary } from '@/lib/utils'
import { TransformedJob } from '@/lib/types/indeed-job'
import { createClient } from '@/lib/supabase/client'
import { ProfileSelector } from '@/components/ui/profile-selector'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const [job, setJob] = useState<TransformedJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const [isApplied, setIsApplied] = useState(false)
  const [jobDetails, setJobDetails] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Try to fetch from premium jobs table first
        const { data: premiumJob, error: premiumError } = await supabase
          .from('jobs')
          .select(`
            *,
            companies (
              name,
              description,
              website,
              industry,
              size,
              location
            )
          `)
          .eq('id', jobId)
          .single()

        if (!premiumError && premiumJob) {
          setJobDetails(premiumJob)
          const transformedJob: TransformedJob = {
            id: premiumJob.id,
            title: premiumJob.title,
            company_name: premiumJob.companies?.name || 'Unknown Company',
            location: premiumJob.location,
            description: premiumJob.description || '',
            apply_url: `/jobs/${premiumJob.id}`,
            salary_range: premiumJob.salary_range || '',
            job_type: premiumJob.job_type || 'full-time',
            source: 'premium' as const,
            scraped_at: premiumJob.created_at || new Date().toISOString(),
          }
          setJob(transformedJob)
          setLoading(false)
          return
        }

        // If not found in premium jobs, try cached Indeed jobs
        const { data: indeedJob, error: indeedError } = await supabase
          .from('cached_indeed_jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (!indeedError && indeedJob) {
          const transformedJob: TransformedJob = {
            id: indeedJob.id,
            title: indeedJob.title,
            company_name: indeedJob.company,
            location: indeedJob.location,
            description: indeedJob.description || '',
            apply_url: indeedJob.apply_url,
            salary_range: indeedJob.salary || '',
            job_type: indeedJob.job_type || 'full-time',
            source: 'indeed' as const,
            scraped_at: indeedJob.scraped_at || new Date().toISOString(),
          }
          setJob(transformedJob)
          setLoading(false)
          return
        }

        setError('Job not found')
        setLoading(false)
      } catch (err) {
        console.error('Error fetching job:', err)
        setError('Failed to load job')
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, supabase])

  const handleApply = () => {
    if (job?.source === 'indeed') {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer')
      // Show profile selector for marking as applied
      setShowProfileSelector(true)
    } else {
      // For premium jobs, show profile selector first
      setShowProfileSelector(true)
    }
  }

  const handleProfileSelected = async (profileId: string) => {
    if (!job) return

    try {
      const response = await fetch('/api/jobs/mark-applied', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.company_name,
          applicationUrl: job.apply_url,
          jobSource: job.source || 'premium',
          profileId: profileId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsApplied(true)
        setShowProfileSelector(false)
      }
    } catch (error) {
      console.error('Error marking job as applied:', error)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: Implement bookmark functionality
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: `Check out this job: ${job?.title} at ${job?.company_name}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has expired.</p>
          <Button asChild>
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                      {job.source === 'premium' && (
                        <Badge variant="featured">Featured</Badge>
                      )}
                    </div>
                    <p className="text-xl text-primary font-medium">{job.company_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBookmark}
                      className={isBookmarked ? 'text-accent' : 'text-gray-400'}
                      type="button"
                    >
                      <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleShare}
                      type="button"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    <span>{job.location}</span>
                    {jobDetails?.remote_type && (
                      <Badge variant="outline" className="ml-2">
                        {jobDetails.remote_type === 'remote' ? 'Remote' : jobDetails.remote_type === 'hybrid' ? 'Hybrid' : 'On-site'}
                      </Badge>
                    )}
                  </div>
                  {jobDetails?.min_salary && jobDetails?.max_salary ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-5 w-5" />
                      <span>
                        ${jobDetails.min_salary.toLocaleString()} - ${jobDetails.max_salary.toLocaleString()} {jobDetails.salary_currency || 'USD'}
                        {jobDetails.work_schedule && ` (${jobDetails.work_schedule})`}
                      </span>
                    </div>
                  ) : job.salary_range ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-5 w-5" />
                      <span>{formatSalary(job.salary_range)}</span>
                    </div>
                  ) : null}
                  {job.scraped_at && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-5 w-5" />
                      <span>Posted {formatRelativeTime(job.scraped_at)}</span>
                    </div>
                  )}
                </div>

                {job.job_type && (
                  <Badge variant="outline" className="mb-6">
                    {job.job_type}
                  </Badge>
                )}

                {isApplied ? (
                  <Button size="lg" className="w-full md:w-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100" disabled>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Applied
                  </Button>
                ) : (
                  <Button 
                    onClick={handleApply} 
                    size="lg" 
                    className="w-full md:w-auto"
                    type="button"
                  >
                    {job.source === 'indeed' ? (
                      <>
                        Apply on Indeed
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Apply Now'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information */}
            {jobDetails && (
              <>
                {jobDetails.requirements && jobDetails.requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {jobDetails.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {jobDetails.benefits && jobDetails.benefits.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Benefits & Perks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {jobDetails.benefits.map((benefit: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(jobDetails.experience_required || jobDetails.education_required) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Qualifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {jobDetails.experience_required && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Experience Required</h4>
                          <p className="text-gray-700">{jobDetails.experience_required}</p>
                        </div>
                      )}
                      {jobDetails.education_required && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Education Required</h4>
                          <p className="text-gray-700">{jobDetails.education_required}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {jobDetails.application_instructions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        How to Apply
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{jobDetails.application_instructions}</p>
                    </CardContent>
                  </Card>
                )}

                {(jobDetails.contact_email || jobDetails.contact_phone) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {jobDetails.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <a href={`mailto:${jobDetails.contact_email}`} className="text-primary hover:underline">
                            {jobDetails.contact_email}
                          </a>
                        </div>
                      )}
                      {jobDetails.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a href={`tel:${jobDetails.contact_phone}`} className="text-primary hover:underline">
                            {jobDetails.contact_phone}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* AI Resume Suggestion */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">AI Resume Suggestion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 mb-4">
                  Which of your resumes fits this job best? Our AI can analyze your resumes 
                  and match them to this job description.
                </p>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => router.push('/resume-optimizer')}
                  type="button"
                >
                  Analyze My Resumes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.company_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobDetails?.companies?.description && (
                  <p className="text-gray-600 text-sm">
                    {jobDetails.companies.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  {jobDetails?.companies?.industry && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{jobDetails.companies.industry}</span>
                    </div>
                  )}
                  {jobDetails?.companies?.size && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{jobDetails.companies.size} employees</span>
                    </div>
                  )}
                  {jobDetails?.companies?.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                      <a href={jobDetails.companies.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/companies?company=${encodeURIComponent(job.company_name)}`)}
                  type="button"
                >
                  View Company Profile
                </Button>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-medium text-gray-900">Frontend Developer</h4>
                    <p className="text-sm text-gray-600">Tech Startup</p>
                    <p className="text-sm text-gray-500">San Francisco, CA</p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-medium text-gray-900">Full Stack Engineer</h4>
                    <p className="text-sm text-gray-600">Digital Agency</p>
                    <p className="text-sm text-gray-500">Remote</p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-medium text-gray-900">Software Developer</h4>
                    <p className="text-sm text-gray-600">Enterprise Corp</p>
                    <p className="text-sm text-gray-500">New York, NY</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push(`/jobs?q=${encodeURIComponent(job.title)}`)}
                  type="button"
                >
                  View All Similar Jobs
                </Button>
              </CardContent>
            </Card>

            {/* Job Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Get Job Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Get notified when similar jobs are posted.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/job-alerts')}
                  type="button"
                >
                  Create Job Alert
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ProfileSelector
        isOpen={showProfileSelector}
        onClose={() => setShowProfileSelector(false)}
        onSelect={handleProfileSelected}
        jobTitle={job?.title}
        companyName={job?.company_name}
      />
    </div>
  )
}
