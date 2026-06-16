'use client'

import {
  stripePublishableConfigured,
  stripePublishableIsLive,
} from '@/lib/stripe/config'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function StripeStatusBanner() {
  const configured = stripePublishableConfigured()
  const live = stripePublishableIsLive()

  if (!configured) {
    return (
      <Alert className="border-amber-200 bg-amber-50/90 text-amber-950">
        <AlertDescription>
          Payments are not connected. Add Stripe keys in the environment before accepting live charges.
        </AlertDescription>
      </Alert>
    )
  }

  if (!live) {
    return (
      <Alert className="border-primary-200 bg-primary-50/90 text-primary-900">
        <AlertDescription>Stripe test keys are loaded. Card charges are simulated.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-emerald-200 bg-emerald-50/90 text-emerald-950">
      <AlertDescription>Stripe live publishable key is configured.</AlertDescription>
    </Alert>
  )
}
