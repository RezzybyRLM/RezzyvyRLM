'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Clock, Mail, Phone, Loader2, AlertCircle } from 'lucide-react'
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

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (jobId) {
      fetchJob()
    }
  }, [jobId])

  const fetchJob = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
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
        .eq('id', jobId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (data) {
        setJob(data as Job)
      } else {
        setError('Job not found')
      }
    } catch (err: any) {
      console.error('Error fetching job:', err)
      setError(err.message || 'Failed to fetch job details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center text-red-800">
                <AlertCircle className="mr-2 h-5 w-5" />
                <span>{error || 'Job not found'}</span>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/jobs')}
                type="button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/jobs')}
          className="mb-6"
          type="button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      {job.is_featured && (
                        <Badge className="bg-primary text-white">Featured</Badge>
                      )}
                    </div>
                    {job.company && (
                      <p className="text-lg text-gray-700 mb-4">{job.company.name}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.job_type && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.job_type}</span>
                        </div>
                      )}
                      {job.salary_range && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                      {job.created_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Posted {formatDate(job.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">{job.description}</div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Application Instructions */}
            {job.application_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>How to Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {job.application_instructions}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.contact_email && (
                  <Button
                    asChild
                    className="w-full"
                    type="button"
                  >
                    <a href={`mailto:${job.contact_email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Application
                    </a>
                  </Button>
                )}
                {job.company?.website && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    type="button"
                  >
                    <a href={job.company.website} target="_blank" rel="noopener noreferrer">
                      Visit Company Website
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/jobs')}
                  type="button"
                >
                  Save for Later
                </Button>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.work_schedule && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Work Schedule</p>
                    <p className="text-gray-900">{job.work_schedule}</p>
                  </div>
                )}
                {job.remote_type && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Remote Type</p>
                    <p className="text-gray-900 capitalize">{job.remote_type}</p>
                  </div>
                )}
                {job.experience_required && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience Required</p>
                    <p className="text-gray-900">{job.experience_required}</p>
                  </div>
                )}
                {job.education_required && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Education Required</p>
                    <p className="text-gray-900">{job.education_required}</p>
                  </div>
                )}
                {job.application_deadline && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Application Deadline</p>
                    <p className="text-gray-900">{formatDate(job.application_deadline)}</p>
                  </div>
                )}
                {job.expires_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Job Expires</p>
                    <p className="text-gray-900">{formatDate(job.expires_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            {job.company && (
              <Card>
                <CardHeader>
                  <CardTitle>About the Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{job.company.name}</p>
                  {job.company.description && (
                    <p className="text-gray-700 mb-4">{job.company.description}</p>
                  )}
                  {job.company.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Visit Website →
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            {(job.contact_email || job.contact_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {job.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${job.contact_email}`} className="text-primary hover:underline">
                        {job.contact_email}
                      </a>
                    </div>
                  )}
                  {job.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${job.contact_phone}`} className="text-primary hover:underline">
                        {job.contact_phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

