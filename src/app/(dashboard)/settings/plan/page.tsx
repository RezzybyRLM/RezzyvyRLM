'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StripeStatusBanner } from '@/components/stripe/stripe-status-banner'
import { Sparkles, CreditCard, ExternalLink, Check } from 'lucide-react'
import { motion } from 'framer-motion'

const easeOut = [0.22, 1, 0.36, 1] as const

const perks = [
  'Browse and apply to every listing',
  'Unlimited tailored profiles & resumes',
  'Priority placement with featured plans',
]

export default function PlanSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.1] via-white to-white p-6 shadow-card">
        <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <CreditCard className="h-3 w-3" /> Billing
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Plan settings</h1>
        <p className="mt-1 text-sm text-text/55">Manage your subscription and explore upgrades.</p>
      </div>

      <StripeStatusBanner />

      <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-text">Billing &amp; plans</h2>
            <p className="mt-0.5 text-sm text-text/55">
              View all tiers, resume packages, and start Stripe checkout when you&apos;re ready.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2.5 text-sm text-text/75">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-3 w-3" />
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2 bg-primary text-white hover:bg-primary-600">
            <Link href="/plans">
              <Sparkles className="h-4 w-4" />
              Upgrade &amp; plans
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2 border-border">
            <Link href="/dashboard">
              <ExternalLink className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
