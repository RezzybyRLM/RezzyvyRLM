'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Users, Briefcase, Eye, Send, Mail, CreditCard, Inbox, Loader2 } from 'lucide-react'

type Metrics = {
  users: number
  jobs: number
  jobViews: number
  jobApplicationsMember: number
  jobApplicationsReceived: number
  contactMessages: number
  userPlansByType: Record<string, number>
  payingSubscriptions: number
  mrrEstimateUsd: number
  lastStripeWebhookAt: string | null
  stripeConfigured: boolean
  stripeMode: string
}

export default function AdminDashboardPage() {
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
        Loading overview…
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin console"
        title="Overview"
        subtitle="Platform totals and quick links. Data updates when you refresh."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard index={0} label="Users" value={metrics.users} icon={Users} href="/admin/users" hint="View directory" />
        <StatCard index={1} label="Jobs" value={metrics.jobs} icon={Briefcase} href="/admin/jobs" hint="Manage listings" />
        <StatCard index={2} label="Job views" value={metrics.jobViews} icon={Eye} />
        <StatCard index={3} label="Contact messages" value={metrics.contactMessages} icon={Mail} href="/admin/inbox" hint="Open inbox" />

        <Card className="rounded-2xl border border-border/70 bg-white/70 shadow-card backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-text/45">
              <Send className="h-4 w-4 text-primary" /> Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text/45">Member-tracked</p>
              <p className="text-2xl font-semibold tabular-nums text-text">{metrics.jobApplicationsMember}</p>
            </div>
            <div>
              <p className="text-xs text-text/45">Employer inbox</p>
              <p className="text-2xl font-semibold tabular-nums text-text">{metrics.jobApplicationsReceived}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/70 bg-white/70 shadow-card backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-text/45">
              <CreditCard className="h-4 w-4 text-primary" /> Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text/45">Active Stripe links</p>
                <p className="text-2xl font-semibold tabular-nums text-text">{metrics.payingSubscriptions}</p>
              </div>
              <div>
                <p className="text-xs text-text/45">MRR estimate (USD)</p>
                <p className="text-2xl font-semibold tabular-nums text-text">${metrics.mrrEstimateUsd}</p>
              </div>
            </div>
            <Button variant="link" className="mt-2 h-auto p-0 text-sm text-primary" asChild>
              <Link href="/admin/billing">Billing detail</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/inbox">
            <Inbox className="mr-2 h-4 w-4" />
            Inbox
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/jobs/new">New job</Link>
        </Button>
      </div>
    </div>
  )
}
