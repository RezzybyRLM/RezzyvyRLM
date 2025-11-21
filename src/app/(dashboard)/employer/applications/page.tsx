'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  FileText,
  Mail,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Application {
  id: string
  job_id: string
  job_title: string
  applicant_user_id: string
  applicant_name: string
  applicant_email: string
  resume_id: string | null
  resume_url: string | null
  cover_letter_id: string | null
  cover_letter_url: string | null
  status: string
  notes: string | null
  applied_at: string
}

export default function ApplicationsReceivedPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([])
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get company
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .limit(1)

        if (companies && companies.length > 0) {
          const compId = companies[0].id
          setCompanyId(compId)

          // Fetch jobs for filter
          const { data: jobsData } = await supabase
            .from('jobs')
            .select('id, title')
            .eq('company_id', compId)

          if (jobsData) {
            setJobs(jobsData)
          }

          // Fetch applications
          const response = await fetch(`/api/employer/applications?companyId=${compId}`)
          const data = await response.json()
          if (data.success) {
            setApplications(data.applications)
          }
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    let filtered = applications

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant_email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Filter by job
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.job_id === jobFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchQuery, statusFilter, jobFilter])

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        ))
      } else {
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleSaveNotes = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      })

      const data = await response.json()
      if (data.success) {
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, notes: notesText } : app
        ))
        setEditingNotes(null)
        setNotesText('')
      } else {
        alert(data.error || 'Failed to save notes')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'interview':
        return <Badge className="bg-blue-100 text-blue-800">Interview</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications Received</h1>
        <p className="text-gray-600">Review and manage job applications</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applicants..."
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
                <option value="pending">Pending</option>
                <option value="interview">Interview</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' || jobFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Applications will appear here when candidates apply to your jobs.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{application.applicant_name}</h3>
                      {getStatusBadge(application.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Job:</span>
                          <span>{application.job_title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{application.applicant_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {application.resume_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.resume_url!, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Resume
                            </Button>
                          )}
                          {application.cover_letter_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(application.cover_letter_url!, '_blank')}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              View Cover Letter
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      {editingNotes === application.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about this applicant..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveNotes(application.id)}>
                              Save Notes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingNotes(null)
                                setNotesText('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Notes</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNotes(application.id)
                                setNotesText(application.notes || '')
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">
                            {application.notes || 'No notes added'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="interview">Interview</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

