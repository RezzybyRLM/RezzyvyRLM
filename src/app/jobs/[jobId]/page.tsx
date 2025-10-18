'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, MapPin, Clock, DollarSign, Bookmark, Share2, ArrowLeft } from 'lucide-react'
import { formatRelativeTime, formatSalary } from '@/lib/utils'
import { TransformedJob } from '@/lib/types/indeed-job'

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.jobId as string
  const [job, setJob] = useState<TransformedJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    // In a real app, you'd fetch the job by ID from your API
    // For now, we'll simulate with a mock job
    const mockJob: TransformedJob = {
      id: jobId,
      title: 'Senior Software Engineer',
      company_name: 'Tech Corp',
      location: 'San Francisco, CA',
      description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing and implementing scalable web applications using modern technologies.',
      apply_url: 'https://indeed.com/viewjob?jk=123456',
      salary_range: '$120,000 - $150,000',
      job_type: 'full-time',
      source: 'indeed',
      scraped_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      search_query: 'software engineer',
    }

    setTimeout(() => {
      setJob(mockJob)
      setLoading(false)
    }, 1000)
  }, [jobId])

  const handleApply = () => {
    if (job?.source === 'indeed') {
      window.open(job.apply_url, '_blank', 'noopener,noreferrer')
    } else {
      // For premium jobs, navigate to internal application
      window.location.href = `/jobs/${jobId}/apply`
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
                    >
                      <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleShare}>
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
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-5 w-5" />
                      <span>{formatSalary(job.salary_range)}</span>
                    </div>
                  )}
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

                <Button onClick={handleApply} size="lg" className="w-full md:w-auto">
                  {job.source === 'indeed' ? (
                    <>
                      Apply on Indeed
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </Button>
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
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
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
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Learn more about this company and their culture.
                </p>
                <Button variant="outline" className="w-full">
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
                <Button variant="outline" className="w-full mt-4">
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
                <Button variant="outline" className="w-full">
                  Create Job Alert
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
