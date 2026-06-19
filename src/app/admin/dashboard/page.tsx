'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, Send, CreditCard, Inbox, Loader2, Link2, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const MANAGE = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { href: '/admin/org-invites', label: 'Org invites', icon: Link2 },
  { href: '/admin/service-invites', label: 'Service invites', icon: Sparkles },
]

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then((j) => {
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

  if (error) return <p className="text-sm text-red-600">{error}</p>

  if (!metrics) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading overview…
      </div>
    )
  }

  const health = [
    { label: 'Users', value: metrics.users.toLocaleString() },
    { label: 'Jobs', value: metrics.jobs.toLocaleString() },
    { label: 'Job views', value: metrics.jobViews.toLocaleString() },
    { label: 'MRR (USD)', value: `$${metrics.mrrEstimateUsd.toLocaleString()}` },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 md:text-[2.1rem]">Platform overview</h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-gray-500">
            <span
              className={cn('inline-flex h-2 w-2 rounded-full', metrics.stripeConfigured ? 'bg-emerald-500' : 'bg-amber-500')}
              aria-hidden
            />
            {metrics.stripeConfigured ? `All systems operational · Stripe ${metrics.stripeMode}` : 'Stripe not configured'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/jobs/new">New job</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary-600 text-white hover:bg-primary-700">
            <Link href="/admin/inbox">Open inbox</Link>
          </Button>
        </div>
      </div>

      {/* Dark platform-health command bar */}
      <div className="overflow-hidden rounded-3xl bg-[#241813] p-6 text-white shadow-lg md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Platform health</p>
        <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {health.map((m) => (
            <div key={m.label}>
              <p className="text-3xl font-bold tabular-nums">{m.value}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-white/50">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-4 text-sm text-white/70">
          <span>
            Paying subscriptions: <span className="font-semibold text-white">{metrics.payingSubscriptions}</span>
          </span>
          <span>
            Applications:{' '}
            <span className="font-semibold text-white">
              {metrics.jobApplicationsMember + metrics.jobApplicationsReceived}
            </span>
          </span>
          <span>
            Contact messages: <span className="font-semibold text-white">{metrics.contactMessages}</span>
          </span>
        </div>
      </div>

      {/* Detail tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
            <Send className="h-4 w-4 text-primary-600" /> Applications
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Member-tracked</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.jobApplicationsMember}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Employer inbox</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.jobApplicationsReceived}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
            <CreditCard className="h-4 w-4 text-primary-600" /> Subscriptions
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Active Stripe links</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{metrics.payingSubscriptions}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">MRR estimate (USD)</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">${metrics.mrrEstimateUsd}</p>
            </div>
          </div>
          <Link href="/admin/billing" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">
            Billing detail
          </Link>
        </div>
      </div>

      {/* Manage tiles */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Manage</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MANAGE.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group flex flex-col gap-3 rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <span className="inline-flex w-fit rounded-xl bg-primary-50 p-2.5 text-primary-600">
                <tile.icon className="h-5 w-5" />
              </span>
              <span className="flex items-center justify-between text-sm font-semibold text-gray-900">
                {tile.label}
                <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-primary-500" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
