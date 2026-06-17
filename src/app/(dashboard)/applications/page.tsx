'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Briefcase,
  Building,
  Calendar,
  ExternalLink,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'

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

const STATUSES = ['applied', 'interview', 'offer', 'rejected', 'withdrawn'] as const

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const fetchApplications = async () => {
      try {
        // Robust on refresh; middleware already gated this route, so a null here
        // is transient — just stop, never redirect.
        const user = await resolveSessionUser(supabase)
        if (!user) return
        const response = await fetch('/api/jobs/applications')
        const data = await response.json()
        if (mounted && data.success) setApplications(data.applications || [])
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchApplications()
    return () => { mounted = false }
  }, [supabase])

  const filtered = useMemo(() => {
    let list = applications
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) => a.job_title.toLowerCase().includes(q) || a.company_name.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter)
    return list
  }, [applications, searchQuery, statusFilter])

  const updateApplication = async (id: string, patch: Partial<JobApplication>) => {
    const user = await resolveSessionUser(supabase)
    if (!user) return
    const { error } = await supabase
      .from('job_applications')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      alert('Could not save. Please try again.')
      return
    }
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      applied: 'bg-primary/10 text-primary',
      interview: 'bg-primary/10 text-primary',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-700',
    }
    return <Badge className={map[status] ?? 'bg-gray-100 text-gray-700'}>{status[0].toUpperCase() + status.slice(1)}</Badge>
  }

  const statusIcon = (status: string) => {
    if (status === 'offer') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === 'rejected' || status === 'withdrawn') return <XCircle className="h-4 w-4 text-text/40" />
    return <Clock className="h-4 w-4 text-primary" />
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">My applications</h1>
        <p className="mt-1 text-sm text-text/60">Track your job applications and their status.</p>
      </div>

      <Card className="border border-border bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
              <Input
                placeholder="Search applications…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-border pl-10 sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-text/55">
            {filtered.length} of {applications.length} applications
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border border-border bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-text/30" />
            <h3 className="mb-2 text-lg font-medium text-text">No applications found</h3>
            <p className="text-sm text-text/55">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Apply to jobs and track them here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <Card key={app.id} className="border border-border bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-text">{app.job_title}</h3>
                      {statusBadge(app.status)}
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/60">
                      <span className="inline-flex items-center gap-1.5"><Building className="h-4 w-4" />{app.company_name}</span>
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />Applied {new Date(app.application_date || app.created_at).toLocaleDateString()}</span>
                      <span className="capitalize">Source: {app.job_source}</span>
                    </div>
                    {app.application_url && (
                      <Button variant="outline" size="sm" className="border-border" onClick={() => window.open(app.application_url, '_blank')}>
                        <ExternalLink className="mr-1 h-4 w-4" /> View application
                      </Button>
                    )}

                    <div className="mt-4">
                      {editingNotes === app.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about this application…"
                            rows={3}
                            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={async () => { await updateApplication(app.id, { notes: notesText }); setEditingNotes(null); setNotesText('') }}>
                              Save notes
                            </Button>
                            <Button variant="outline" size="sm" className="border-border" onClick={() => { setEditingNotes(null); setNotesText('') }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-text/70">Notes</span>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(app.id); setNotesText(app.notes || '') }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-text/55">{app.notes || 'No notes added'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplication(app.id, { status: e.target.value })}
                      className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 text-xs text-text/50">
                      {statusIcon(app.status)}
                      <span className="capitalize">{app.status}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
