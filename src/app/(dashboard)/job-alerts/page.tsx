'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Bell, MapPin, Calendar, Trash2, Mail, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

interface JobAlert {
  id: string
  search_query: string
  location: string
  frequency: 'daily' | 'weekly'
  is_active: boolean
  last_sent_at: string | null
  created_at: string
}

const fieldClass =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text/40 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15'

export default function JobAlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlert, setNewAlert] = useState({ search_query: '', location: '', frequency: 'daily' as 'daily' | 'weekly' })
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const fetchAlerts = async () => {
      try {
        const user = await resolveSessionUser(supabase)
        if (!user) return
        const response = await fetch('/api/job-alerts')
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to fetch job alerts')
        if (mounted && result.success) setAlerts(result.alerts || [])
      } catch (error) {
        console.error('Error fetching job alerts:', error)
        if (mounted) setAlerts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchAlerts()
    return () => { mounted = false }
  }, [supabase])

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlert.search_query.trim()) { alert('Please enter a job title or keywords'); return }
    try {
      setSaving(true)
      const response = await fetch('/api/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create job alert')
      if (result.success && result.alert) {
        setAlerts((prev) => [result.alert, ...prev])
        setNewAlert({ search_query: '', location: '', frequency: 'daily' })
        setShowCreateForm(false)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create job alert.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAlert = async (alertId: string) => {
    try {
      const a = alerts.find((x) => x.id === alertId)
      if (!a) return
      const response = await fetch(`/api/job-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !a.is_active }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update job alert')
      if (result.success && result.alert) setAlerts((prev) => prev.map((x) => (x.id === alertId ? result.alert : x)))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update job alert')
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Delete this job alert?')) return
    try {
      const response = await fetch(`/api/job-alerts/${alertId}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete job alert')
      if (result.success) setAlerts((prev) => prev.filter((x) => x.id !== alertId))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete job alert')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeCount = alerts.filter((a) => a.is_active).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.1] via-white to-white p-6 shadow-card sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Bell className="h-3 w-3" /> Alerts
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Job alerts</h1>
          <p className="mt-1 text-sm text-text/55">
            Get notified when new jobs match your criteria · {activeCount} active.
          </p>
        </div>
        {!showCreateForm && (
          <Button className="bg-primary text-white hover:bg-primary-600" onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create alert
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-text">Create a new job alert</h2>
          <form onSubmit={handleCreateAlert} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text/70">Job title or keywords *</label>
                <Input
                  value={newAlert.search_query}
                  onChange={(e) => setNewAlert((p) => ({ ...p, search_query: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                  className="border-border"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text/70">Location</label>
                <Input
                  value={newAlert.location}
                  onChange={(e) => setNewAlert((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Remote or San Francisco, CA"
                  className="border-border"
                />
              </div>
            </div>
            <div className="md:w-1/2">
              <label className="mb-1 block text-sm font-medium text-text/70">Frequency</label>
              <select
                value={newAlert.frequency}
                onChange={(e) => setNewAlert((p) => ({ ...p, frequency: e.target.value as 'daily' | 'weekly' }))}
                className={fieldClass}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" className="bg-primary text-white hover:bg-primary-600" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : <><Bell className="mr-2 h-4 w-4" />Create alert</>}
              </Button>
              <Button type="button" variant="outline" className="border-border" onClick={() => setShowCreateForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-text">No job alerts yet</h3>
          <p className="mb-4 text-sm text-text/55">Create your first alert to get notified about new opportunities.</p>
          <Button className="bg-primary text-white hover:bg-primary-600" onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create your first alert
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: easeOut, delay: Math.min(i * 0.04, 0.3) }}
              className={cn(
                'flex flex-col gap-4 rounded-2xl border border-l-4 border-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover sm:flex-row sm:items-start sm:justify-between',
                a.is_active ? 'border-l-success' : 'border-l-text/20'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-text">{a.search_query}</h3>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', a.frequency === 'daily' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary')}>
                    {a.frequency === 'daily' ? 'Daily' : 'Weekly'}
                  </span>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', a.is_active ? 'bg-success/10 text-success' : 'bg-text/5 text-text/55')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', a.is_active ? 'bg-success' : 'bg-text/40')} />
                    {a.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/60">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.location || 'Anywhere'}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Created {new Date(a.created_at).toLocaleDateString()}</span>
                  {a.last_sent_at && (
                    <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Last sent {new Date(a.last_sent_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" className="border-border" onClick={() => handleToggleAlert(a.id)}>
                  {a.is_active ? 'Pause' : 'Activate'}
                </Button>
                <button
                  type="button"
                  onClick={() => handleDeleteAlert(a.id)}
                  className="rounded-lg p-2 text-text/40 transition-colors hover:bg-accent/10 hover:text-accent"
                  aria-label="Delete alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
