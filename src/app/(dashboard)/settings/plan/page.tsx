'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StripeStatusBanner } from '@/components/stripe/stripe-status-banner'
import { Sparkles, CreditCard, ExternalLink } from 'lucide-react'

export default function PlanSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Plan settings</h1>
        <p className="text-sm text-text/60">Manage your subscription and explore upgrades.</p>
      </div>

      <StripeStatusBanner />

      <Card className="border-border/80 bg-white/70 shadow-md backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Billing &amp; plans
          </CardTitle>
          <CardDescription>
            View all tiers, resume packages, and start Stripe checkout when you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/plans">
              <Sparkles className="h-4 w-4" />
              Upgrade &amp; plans
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard">
              <ExternalLink className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
