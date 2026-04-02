'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Zap, TrendingUp, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { StripeStatusBanner } from '@/components/stripe/stripe-status-banner'

type PlanDef = {
  name: string
  price: string
  interval: string
  features: string[]
  highlight?: boolean
  popular?: boolean
  isFree?: boolean
  subscriptionType?: 'basic' | 'pro' | 'enterprise'
  checkoutPackageKey?: 'essential' | 'definitive' | 'accelerated'
  chip?: string
}

export default function PlansPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  useEffect(() => {
    const checkCurrentPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: plan } = await (supabase as any)
          .from('user_plans')
          .select('plan_type')
          .eq('user_id', user.id)
          .single()

        if (plan) {
          setCurrentPlan(plan.plan_type)
        }
      }
    }
    checkCurrentPlan()
  }, [supabase])

  const subscriptionPlans: PlanDef[] = [
    {
      name: 'Basic',
      price: '$9.99',
      interval: '/month',
      chip: 'Starter',
      subscriptionType: 'basic',
      features: [
        '50 job searches / month',
        '20 applications / month',
        '100 bookmarks',
        '10 AI resume matches',
        '5 AI interview sessions',
        '3 job alerts',
      ],
      highlight: false,
      popular: false,
    },
    {
      name: 'Pro',
      price: '$19.99',
      interval: '/month',
      chip: 'Most popular',
      subscriptionType: 'pro',
      features: [
        '200 job searches / month',
        '100 applications / month',
        '500 bookmarks',
        '50 AI resume matches',
        '25 AI interview sessions',
        '10 job alerts',
        'Priority support',
      ],
      highlight: true,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$49.99',
      interval: '/month',
      chip: 'Teams',
      subscriptionType: 'enterprise',
      features: [
        'Highest platform limits',
        'Dedicated support',
        'Custom onboarding',
        'Usage reporting',
      ],
      highlight: false,
      popular: false,
    },
  ]

  const resumePackages: PlanDef[] = [
    {
      name: 'Essential Package',
      price: '$200',
      interval: 'one-time',
      chip: 'Resume writing',
      checkoutPackageKey: 'essential',
      features: [
        'Consultation (email or 20 min Zoom)',
        'One-page resume, bio, cover letter',
        '14 days unlimited revisions',
        'vCard + QR code',
      ],
      highlight: false,
      popular: false,
    },
    {
      name: 'Accelerated Package',
      price: '$300',
      interval: 'one-time',
      chip: 'Expanded',
      checkoutPackageKey: 'accelerated',
      features: [
        '30-minute writer consultation',
        'Resume, bio, cover letter',
        'References & thank-you letters',
        'One additional resume format',
      ],
      highlight: false,
      popular: false,
    },
    {
      name: 'Definitive Package',
      price: '$500',
      interval: 'one-time',
      chip: 'Full service',
      checkoutPackageKey: 'definitive',
      features: [
        '1-hour consultation',
        'Full resume suite + LinkedIn polish',
        'Career interview coaching',
        'All Accelerated deliverables',
      ],
      highlight: true,
      popular: true,
    },
  ]

  const freePlan: PlanDef = {
    name: 'Free Plan',
    price: '$0',
    interval: '/month',
    chip: 'Get started',
    features: [
      '1 AI interview / month',
      '5 resume uploads (total)',
      '10 job searches / month',
      'Core bookmarks & alerts',
    ],
    isFree: true,
  }

  const handleSelectPlan = async (plan: PlanDef) => {
    setError(null)
    if (plan.isFree) {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await (supabase as any)
          .from('user_plans')
          .upsert({
            user_id: user.id,
            plan_type: 'free',
            api_quota_remaining: 10,
            quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
      }
      router.push(redirectTo)
      setLoading(false)
      return
    }

    if (plan.subscriptionType) {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?redirectTo=/plans')
          setLoading(false)
          return
        }

        const response = await fetch('/api/stripe/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: plan.subscriptionType }),
        })

        const data = await response.json()

        if (data.success && data.sessionUrl) {
          window.location.href = data.sessionUrl
        } else {
          setError(data.error || 'Failed to start checkout')
          setLoading(false)
        }
      } catch {
        setError('Network error occurred')
        setLoading(false)
      }
      return
    }

    if (plan.checkoutPackageKey) {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?redirectTo=/plans')
          setLoading(false)
          return
        }

        const response = await fetch('/api/stripe/checkout-package', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageKey: plan.checkoutPackageKey }),
        })

        const data = await response.json()

        if (data.success && data.sessionUrl) {
          window.location.href = data.sessionUrl
        } else {
          setError(data.error || 'Failed to start checkout')
          setLoading(false)
        }
      } catch {
        setError('Network error occurred')
        setLoading(false)
      }
    }
  }

  const chipClass =
    'inline-flex items-center rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm'

  const renderCard = (plan: PlanDef) => {
    const isCurrentSubscription =
      !!plan.subscriptionType && currentPlan === plan.subscriptionType

    return (
      <Card
        key={plan.name}
        className={`glass-card relative flex flex-col border-0 shadow-lg transition-shadow hover:shadow-xl ${
          plan.highlight ? 'ring-2 ring-blue-500/40 md:scale-[1.02]' : ''
        }`}
      >
        {plan.popular ? (
          <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
            <span className={chipClass + ' bg-blue-600 text-white border-blue-500/30'}>Most popular</span>
          </div>
        ) : null}
        <CardHeader className="pb-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl font-semibold text-slate-900">{plan.name}</CardTitle>
            {plan.chip ? <span className={chipClass}>{plan.chip}</span> : null}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{plan.price}</span>
            <span className="text-sm font-medium text-slate-600">{plan.interval}</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col pt-0">
          <ul className="mb-6 flex-1 space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm leading-snug text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            className={`w-full font-semibold ${
              plan.isFree
                ? 'bg-slate-700 hover:bg-slate-800'
                : plan.highlight
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-900 hover:bg-slate-800'
            }`}
            onClick={() => handleSelectPlan(plan)}
            disabled={loading || isCurrentSubscription}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : isCurrentSubscription ? (
              'Current plan'
            ) : plan.isFree ? (
              'Start free'
            ) : (
              'Buy with Stripe'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleSkip = () => {
    router.push(redirectTo)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100/90 via-white to-blue-50/80">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-2xl mx-auto">
          <StripeStatusBanner />
        </div>

        {error ? (
          <p className="mb-6 text-center text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Plans &amp; services</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
            Platform subscriptions for job seekers, plus optional resume packages billed securely through Stripe.
          </p>
          {redirectTo !== '/dashboard' ? (
            <p className="mt-2 text-sm text-slate-500">
              After checkout you can continue to{' '}
              <span className="font-semibold text-slate-800">{redirectTo}</span>
            </p>
          ) : null}
          <p className="mt-3 text-sm text-slate-500">
            <Link href="/settings/plan" className="font-medium text-blue-600 underline-offset-4 hover:underline">
              Plan settings
            </Link>
            {' · '}
            <Link href="/dashboard" className="font-medium text-blue-600 underline-offset-4 hover:underline">
              Back to dashboard
            </Link>
          </p>
        </div>

        <section className="mb-14">
          <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">Member subscriptions</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{subscriptionPlans.map(renderCard)}</div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">Resume packages (sample pricing)</h2>
          <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-slate-600">
            One-time checkout for professional writing services. You can adjust amounts in Stripe later; these match the
            sample tiers wired in the app.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{resumePackages.map(renderCard)}</div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">Free tier</h2>
          <div className="mx-auto max-w-md">{renderCard(freePlan)}</div>
        </section>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="border-slate-300/80 bg-white/60 text-slate-700 shadow-sm backdrop-blur-md hover:bg-white"
          >
            Skip for now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-slate-900">Fast checkout</h3>
            <p className="text-sm text-slate-600">Stripe-hosted payment page; cards handled by Stripe.</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-slate-900">Clear tiers</h3>
            <p className="text-sm text-slate-600">Labels and chips use high-contrast text for readability.</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Shield className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-slate-900">Secure</h3>
            <p className="text-sm text-slate-600">Subscriptions and one-time packages both use Checkout.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
