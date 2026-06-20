'use client'

import { useEffect, useState } from 'react'
import { StripeStatusBanner } from '@/components/stripe/stripe-status-banner'
import { Loader2, CreditCard, DollarSign, Server, CheckCircle2, XCircle } from 'lucide-react'

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
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Stripe connection status and rough subscription estimates from plan assignments.</p>
      </div>

      <StripeStatusBanner />

      {error ? (
        <p className="text-sm text-accent">{error}</p>
      ) : !stripe ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          {/* Headline estimates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums text-gray-900">{stripe.payingSubscriptions.toLocaleString()}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Paying subscriptions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <DollarSign className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums text-gray-900">${stripe.mrrEstimateUsd.toLocaleString()}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">MRR estimate (USD)</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
              <Server className="h-4 w-4 text-primary-600" /> Server configuration
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Secret key loaded</span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${stripe.stripeConfigured ? 'text-success' : 'text-accent'}`}>
                  {stripe.stripeConfigured ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {stripe.stripeConfigured ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Mode</span>
                <span className="font-medium capitalize text-gray-900">{stripe.stripeMode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Last webhook stored</span>
                <span className="max-w-[220px] truncate text-right font-medium text-gray-900">
                  {stripe.lastStripeWebhookAt ? new Date(stripe.lastStripeWebhookAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
              MRR uses STRIPE_BASIC_MONTHLY_CENTS and STRIPE_PRO_MONTHLY_CENTS when set (defaults 999 / 1999 cents).
            </p>
          </div>
        </>
      )}
    </div>
  )
}
