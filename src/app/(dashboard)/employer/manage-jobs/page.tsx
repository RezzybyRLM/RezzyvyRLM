'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

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

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch real data from Supabase
    // Mock data for now
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        salaryRange: '$120,000 - $180,000',
        jobType: 'Full-time',
        status: 'active',
        isFeatured: true,
        views: 156,
        applications: 8,
        createdAt: '2024-01-15',
        expiresAt: '2024-02-15',
        description: 'We are looking for a senior software engineer...',
      },
      {
        id: '2',
        title: 'Product Manager',
        company: 'TechCorp Inc.',
        location: 'Remote',
        salaryRange: '$100,000 - $140,000',
        jobType: 'Full-time',
        status: 'active',
        isFeatured: false,
        views: 89,
        applications: 5,
        createdAt: '2024-01-12',
        expiresAt: '2024-02-12',
        description: 'Join our product team to drive innovation...',
      },
      {
        id: '3',
        title: 'UX Designer',
        company: 'TechCorp Inc.',
        location: 'New York, NY',
        salaryRange: '$80,000 - $120,000',
        jobType: 'Full-time',
        status: 'expired',
        isFeatured: true,
        views: 234,
        applications: 12,
        createdAt: '2024-01-08',
        expiresAt: '2024-02-08',
        description: 'Create beautiful user experiences...',
      },
      {
        id: '4',
        title: 'Marketing Manager',
        company: 'TechCorp Inc.',
        location: 'Austin, TX',
        salaryRange: '$70,000 - $100,000',
        jobType: 'Full-time',
        status: 'draft',
        isFeatured: false,
        views: 0,
        applications: 0,
        createdAt: '2024-01-20',
        expiresAt: '2024-02-20',
        description: 'Lead our marketing initiatives...',
      },
    ]
    
    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
    setLoading(false)
  }, [])

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'paused':
        return <Badge className="bg-gray-100 text-gray-800">Paused</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'paused':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      // TODO: Implement delete functionality
      console.log('Delete job:', jobId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-600">Create, edit, and manage your job postings</p>
        </div>
        <Button asChild>
          <Link href="/employer/manage-jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredJobs.length} of {jobs.length} jobs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    {job.isFeatured && (
                      <Badge className="bg-primary text-white">Featured</Badge>
                    )}
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Company:</span>
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salaryRange}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Type:</span>
                        <span>{job.jobType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Expires {new Date(job.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{job.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{job.applications} applications</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(job.status)}
                      <span className="capitalize">{job.status}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {job.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employer/manage-jobs/${job.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/jobs/${job.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteJob(job.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by posting your first job.'
              }
            </p>
            <Button asChild>
              <Link href="/employer/manage-jobs/new">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
