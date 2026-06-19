'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, Briefcase, Eye, Send, Inbox, PieChart } from 'lucide-react'

type Metrics = {
  users: number
  jobs: number
  jobViews: number
  jobApplicationsMember: number
  jobApplicationsReceived: number
  userPlansByType: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(j => {
        if (cancelled) return
        if (j.success) setMetrics(j.metrics)
        else setError(j.error || 'Failed to load')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <p className="text-sm text-accent">{error}</p>
  }

  if (!metrics) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  const totalPlans = Object.values(metrics.userPlansByType).reduce((s, v) => s + v, 0) || 1
  const health = [
    { label: 'Registered users', value: metrics.users, icon: Users },
    { label: 'Open roles', value: metrics.jobs, icon: Briefcase },
    { label: 'Job views', value: metrics.jobViews, icon: Eye },
    { label: 'Applications', value: metrics.jobApplicationsMember + metrics.jobApplicationsReceived, icon: Send },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Aggregate counts across the platform (not employer-scoped).</p>
      </div>

      {/* Dark platform-health command bar */}
      <div className="overflow-hidden rounded-3xl bg-[#241813] p-6 text-white shadow-lg md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Platform totals</p>
        <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {health.map(m => (
            <div key={m.label}>
              <m.icon className="mb-2 h-5 w-5 text-white/40" />
              <p className="text-3xl font-bold tabular-nums">{m.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-white/50">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
            <Users className="h-4 w-4 text-primary-600" /> Acquisition
          </p>
          <div className="mt-4 space-y-2.5 text-sm">
            <Row label="Registered users" value={metrics.users} />
            <Row label="Open roles" value={metrics.jobs} />
          </div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
            <Inbox className="h-4 w-4 text-primary-600" /> Engagement
          </p>
          <div className="mt-4 space-y-2.5 text-sm">
            <Row label="Job detail views" value={metrics.jobViews} />
            <Row label="Member applications tracked" value={metrics.jobApplicationsMember} />
            <Row label="Applications to employers" value={metrics.jobApplicationsReceived} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
          <PieChart className="h-4 w-4 text-primary-600" /> Plans
        </p>
        <div className="mt-4 space-y-3">
          {Object.entries(metrics.userPlansByType).map(([k, v]) => (
            <div key={k}>
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-600">{k}</span>
                <span className="font-semibold tabular-nums text-gray-900">{v}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary-600/10">
                <div className="h-full rounded-full bg-primary-600" style={{ width: `${(v / totalPlans) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold tabular-nums text-gray-900">{value.toLocaleString()}</span>
    </div>
  )
}
