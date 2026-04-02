'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StripeStatusBanner } from '@/components/stripe/stripe-status-banner'
import { Loader2 } from 'lucide-react'

export default function AdminBillingPage() {
  const [stripe, setStripe] = useState<{
    payingSubscriptions: number
    mrrEstimateUsd: number
    lastStripeWebhookAt: string | null
    stripeConfigured: boolean
    stripeMode: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(j => {
        if (cancelled) return
        if (j.success && j.metrics) {
          setStripe({
            payingSubscriptions: j.metrics.payingSubscriptions,
            mrrEstimateUsd: j.metrics.mrrEstimateUsd,
            lastStripeWebhookAt: j.metrics.lastStripeWebhookAt,
            stripeConfigured: j.metrics.stripeConfigured,
            stripeMode: j.metrics.stripeMode,
          })
        } else setError(j.error || 'Failed to load')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stripe connection status and rough subscription estimates from plan assignments.
        </p>
      </div>

      <StripeStatusBanner />

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !stripe ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Server configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Secret key loaded</span>
                <span className="font-medium">{stripe.stripeConfigured ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium capitalize">{stripe.stripeMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last webhook stored</span>
                <span className="max-w-[200px] truncate text-right font-medium">
                  {stripe.lastStripeWebhookAt
                    ? new Date(stripe.lastStripeWebhookAt).toLocaleString()
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Estimates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rows with Stripe subscription id</span>
                <span className="font-semibold tabular-nums">{stripe.payingSubscriptions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MRR (USD, env-priced)</span>
                <span className="font-semibold tabular-nums">${stripe.mrrEstimateUsd}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                MRR uses STRIPE_BASIC_MONTHLY_CENTS and STRIPE_PRO_MONTHLY_CENTS when set (defaults
                999 / 1999 cents).
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
