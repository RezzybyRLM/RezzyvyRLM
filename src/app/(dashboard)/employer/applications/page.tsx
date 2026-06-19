'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  FileText,
  Mail,
  User,
  Calendar,
  Loader2,
  Edit,
  Users,
  Clock,
  CheckCircle,
  MessageSquare,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { StartConversationButton } from '@/components/ui/start-conversation-button'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

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

const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  pending: { label: 'Pending', chip: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  interview: { label: 'Interview', chip: 'bg-secondary/10 text-secondary', dot: 'bg-secondary' },
  accepted: { label: 'Accepted', chip: 'bg-success/10 text-success', dot: 'bg-success' },
  rejected: { label: 'Rejected', chip: 'bg-accent/10 text-accent', dot: 'bg-accent' },
}

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, chip: 'bg-text/5 text-text/60', dot: 'bg-text/40' }
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

  // KPI counts + filter tabs — all from the real applications list.
  const counts = useMemo(() => {
    const by = (s: string) => applications.filter(a => a.status === s).length
    return {
      total: applications.length,
      pending: by('pending'),
      interview: by('interview'),
      accepted: by('accepted'),
      rejected: by('rejected'),
    }
  }, [applications])

  const statusTabs = useMemo(() => {
    const order = ['pending', 'interview', 'accepted', 'rejected']
    const present = order.filter(s => applications.some(a => a.status === s))
    return [
      { key: 'all', label: 'All', count: applications.length },
      ...present.map(s => ({ key: s, label: statusMeta(s).label, count: applications.filter(a => a.status === s).length })),
    ]
  }, [applications])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total', value: counts.total, icon: Users, tint: 'bg-secondary/10 text-secondary' },
    { label: 'Pending', value: counts.pending, icon: Clock, tint: 'bg-primary/10 text-primary' },
    { label: 'Interview', value: counts.interview, icon: MessageSquare, tint: 'bg-secondary/10 text-secondary' },
    { label: 'Accepted', value: counts.accepted, icon: CheckCircle, tint: 'bg-success/10 text-success' },
  ]

  const initials = (name: string) =>
    name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Command header */}
      <div>
        <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Hiring command center
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Candidate pipeline</h1>
        <p className="mt-1 text-sm text-text/55">Review applicants, move them through stages, and keep your notes in one place.</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map(k => (
          <div key={k.label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-card">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', k.tint)}>
              <k.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums text-text">{k.value.toLocaleString()}</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-text/45">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {statusTabs.map(tab => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white shadow-sm' : 'text-text/65 hover:bg-background'
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-1.5 text-[11px] font-semibold tabular-nums', isActive ? 'bg-white/25 text-white' : 'bg-text/5 text-text/50')}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="all">All jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <Input
              placeholder="Search applicants…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Applicant cards */}
      {filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-text">No applications found</h3>
          <p className="text-sm text-text/55">
            {searchQuery || statusFilter !== 'all' || jobFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Applications will appear here when candidates apply to your jobs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application, i) => {
            const meta = statusMeta(application.status)
            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut, delay: Math.min(i * 0.04, 0.3) }}
                className="rounded-2xl border border-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                      {initials(application.applicant_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-text">{application.applicant_name}</h3>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', meta.chip)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} /> {meta.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text/55">
                        <span className="inline-flex items-center gap-1.5 font-medium text-text/70">
                          <FileText className="h-3.5 w-3.5" /> {application.job_title}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> {application.applicant_email}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> Applied {new Date(application.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stage selector */}
                  <div className="flex shrink-0 items-center gap-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-text/45">Stage</label>
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    >
                      <option value="pending">Pending</option>
                      <option value="interview">Interview</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
                  <StartConversationButton
                    otherUserId={application.applicant_user_id}
                    otherUserName={application.applicant_name}
                    jobTitle={application.job_title}
                    variant="outline"
                    size="sm"
                  />
                  {application.resume_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={() => window.open(application.resume_url!, '_blank')}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Resume
                    </Button>
                  )}
                  {application.cover_letter_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={() => window.open(application.cover_letter_url!, '_blank')}
                    >
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                      Cover letter
                    </Button>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-4 rounded-xl bg-background/70 p-3">
                  {editingNotes === application.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add notes about this applicant…"
                        rows={3}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary-600" onClick={() => handleSaveNotes(application.id)}>
                          Save notes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border"
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-text/45">Notes</p>
                        <p className="mt-0.5 text-sm text-text/70">{application.notes || 'No notes added yet.'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotes(application.id)
                          setNotesText(application.notes || '')
                        }}
                        className="shrink-0 rounded-lg p-1.5 text-text/40 transition-colors hover:bg-white hover:text-secondary"
                        aria-label="Edit notes"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
