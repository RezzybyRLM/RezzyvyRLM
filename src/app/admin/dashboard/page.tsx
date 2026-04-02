'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform totals and quick links. Data updates when you refresh.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Users className="h-4 w-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{metrics.users}</p>
            <Button variant="link" className="mt-2 h-auto p-0 text-sm" asChild>
              <Link href="/admin/users">Directory</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Briefcase className="h-4 w-4" /> Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{metrics.jobs}</p>
            <Button variant="link" className="mt-2 h-auto p-0 text-sm" asChild>
              <Link href="/admin/jobs">Manage</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Eye className="h-4 w-4" /> Job views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{metrics.jobViews}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Send className="h-4 w-4" /> Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Member-tracked</p>
            <p className="text-2xl font-semibold tabular-nums">{metrics.jobApplicationsMember}</p>
            <p className="mt-2 text-sm text-muted-foreground">Employer inbox</p>
            <p className="text-2xl font-semibold tabular-nums">{metrics.jobApplicationsReceived}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Mail className="h-4 w-4" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{metrics.contactMessages}</p>
            <Button variant="link" className="mt-2 h-auto p-0 text-sm" asChild>
              <Link href="/admin/inbox">Inbox</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <CreditCard className="h-4 w-4" /> Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Active Stripe links</p>
            <p className="text-2xl font-semibold tabular-nums">{metrics.payingSubscriptions}</p>
            <p className="mt-2 text-sm text-muted-foreground">MRR estimate (USD)</p>
            <p className="text-2xl font-semibold tabular-nums">${metrics.mrrEstimateUsd}</p>
            <Button variant="link" className="mt-2 h-auto p-0 text-sm" asChild>
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
