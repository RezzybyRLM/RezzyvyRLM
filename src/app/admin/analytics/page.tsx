'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

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
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!metrics) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate counts across the platform (not employer-scoped).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Acquisition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered users</span>
              <span className="font-semibold tabular-nums">{metrics.users}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open roles</span>
              <span className="font-semibold tabular-nums">{metrics.jobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job detail views</span>
              <span className="font-semibold tabular-nums">{metrics.jobViews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member applications tracked</span>
              <span className="font-semibold tabular-nums">{metrics.jobApplicationsMember}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applications to employers</span>
              <span className="font-semibold tabular-nums">{metrics.jobApplicationsReceived}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {Object.entries(metrics.userPlansByType).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-border/50 py-2 last:border-0">
                <span className="capitalize text-muted-foreground">{k}</span>
                <span className="font-medium tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
