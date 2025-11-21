'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Briefcase,
  Building,
  Calendar,
  MapPin,
  ExternalLink,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface JobApplication {
  id: string
  job_id: string | null
  job_source: string
  job_title: string
  company_name: string
  application_url: string
  status: string
  notes: string | null
  application_date: string
  created_at: string
  updated_at: string
  profile_id: string | null
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch applications from API
        const response = await fetch('/api/jobs/applications')
        const data = await response.json()
        
        if (data.success) {
          setApplications(data.applications)
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [supabase])

  useEffect(() => {
    let filtered = applications

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchQuery, statusFilter])

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (error) {
        alert('Failed to update status')
        return
      }

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleSaveNotes = async (applicationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('job_applications')
        .update({
          notes: notesText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (error) {
        alert('Failed to save notes')
        return
      }

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, notes: notesText } : app
      ))
      setEditingNotes(null)
      setNotesText('')
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>
      case 'interview':
        return <Badge className="bg-purple-100 text-purple-800">Interview</Badge>
      case 'offer':
        return <Badge className="bg-green-100 text-green-800">Offer</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'withdrawn':
        return <Badge className="bg-gray-100 text-gray-800">Withdrawn</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'interview':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'offer':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600">Track your job applications and their status</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
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
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
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
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start applying to jobs to track your applications here.'
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
                      <h3 className="text-lg font-semibold text-gray-900">{application.job_title}</h3>
                      {getStatusBadge(application.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <span>{application.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {new Date(application.application_date || application.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Source:</span>
                          <span className="capitalize">{application.job_source}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(application.application_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Application
                        </Button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      {editingNotes === application.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about this application..."
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
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {getStatusIcon(application.status)}
                      <span className="capitalize">{application.status}</span>
                    </div>
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

