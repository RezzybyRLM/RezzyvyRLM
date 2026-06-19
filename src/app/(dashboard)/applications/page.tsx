'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Briefcase,
  Building,
  Calendar,
  ExternalLink,
  Edit,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

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

const STATUS_META: Record<string, { label: string; chip: string; stripe: string; dot: string }> = {
  applied: { label: 'Applied', chip: 'bg-primary/10 text-primary', stripe: 'border-l-primary', dot: 'bg-primary' },
  interview: { label: 'Interview', chip: 'bg-secondary/10 text-secondary', stripe: 'border-l-secondary', dot: 'bg-secondary' },
  offer: { label: 'Offer', chip: 'bg-success/10 text-success', stripe: 'border-l-success', dot: 'bg-success' },
  rejected: { label: 'Rejected', chip: 'bg-accent/10 text-accent', stripe: 'border-l-accent', dot: 'bg-accent' },
  withdrawn: { label: 'Withdrawn', chip: 'bg-text/5 text-text/55', stripe: 'border-l-text/20', dot: 'bg-text/40' },
}

function meta(status: string) {
  return STATUS_META[status] ?? STATUS_META.withdrawn
}

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

  // Status counts for the summary strip + filter tabs (real data).
  const tabs = useMemo(() => {
    const present = STATUSES.filter((s) => applications.some((a) => a.status === s))
    return [
      { key: 'all', label: 'All', count: applications.length },
      ...present.map((s) => ({ key: s, label: meta(s).label, count: applications.filter((a) => a.status === s).length })),
    ]
  }, [applications])

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Tracker hero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.1] via-white to-white p-6 shadow-card">
        <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Your job hunt
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">My applications</h1>
        <p className="mt-1 text-sm text-text/55">Track every role you&apos;ve applied to and keep the momentum going.</p>
        {applications.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {STATUSES.filter((s) => applications.some((a) => a.status === s)).map((s) => {
              const m = meta(s)
              const count = applications.filter((a) => a.status === s).length
              return (
                <span key={s} className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium', m.chip)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
                  {count} {m.label.toLowerCase()}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
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
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
          <Input
            placeholder="Search applications…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-text">No applications found</h3>
          <p className="text-sm text-text/55">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Apply to jobs and track them here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app, i) => {
            const m = meta(app.status)
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut, delay: Math.min(i * 0.04, 0.3) }}
                className={cn('rounded-2xl border border-l-4 border-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover', m.stripe)}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-text">{app.job_title}</h3>
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', m.chip)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} /> {m.label}
                      </span>
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

                    <div className="mt-4 rounded-xl bg-background/70 p-3">
                      {editingNotes === app.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about this application…"
                            rows={3}
                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-primary text-white hover:bg-primary-600" onClick={async () => { await updateApplication(app.id, { notes: notesText }); setEditingNotes(null); setNotesText('') }}>
                              Save notes
                            </Button>
                            <Button variant="outline" size="sm" className="border-border" onClick={() => { setEditingNotes(null); setNotesText('') }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text/45">Notes</p>
                            <p className="mt-0.5 text-sm text-text/60">{app.notes || 'No notes added yet.'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setEditingNotes(app.id); setNotesText(app.notes || '') }}
                            className="shrink-0 rounded-lg p-1.5 text-text/40 transition-colors hover:bg-white hover:text-primary"
                            aria-label="Edit notes"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-text/45">Status</label>
                    <select
                      value={app.status}
                      onChange={(e) => updateApplication(app.id, { status: e.target.value })}
                      className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{meta(s).label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
