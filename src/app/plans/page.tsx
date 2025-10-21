'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, TrendingUp, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PlansPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
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

  const plans = [
    {
      name: 'Free Plan',
      price: '$0',
      interval: '/month',
      features: [
        '1 AI Interview Session per month',
        '5 Resume uploads total',
        '10 Job Searches per month',
        '5 Applications per month',
        '20 Bookmarks per month',
        '2 AI Resume Matches',
        '1 Job Alert',
        'Basic support',
      ],
      highlight: false,
      popular: false,
      isFree: true,
    },
    {
      name: 'Essential Package',
      price: '$200',
      interval: '',
      features: [
        'One-on-One Consultation with Our Resume Writer (Email or zoom call 20 min)',
        'One Page Resume (Career, Federal, and Curriculum Vitae)',
        'One Page Bio',
        'Cover Letter',
        'Unlimited Revisions for 14 Days',
        'Vcard plus QR code',
      ],
      highlight: false,
      popular: false,
      link: 'https://rezzybyrlm.com/product/rezzyme/',
    },
    {
      name: 'Definitive Package',
      price: '$500',
      interval: '/month',
      features: [
        'One-on-One Consultation with Our Resume Writer (Email or Zoom call 1hr)',
        'One Page Resume (Career, Federal, and Curriculum Vitae)',
        'One Page Bio',
        'Cover Letter',
        'Unlimited Revisions for 14 Days',
        'Vcard plus QR code',
        'Reference List',
        'Thank You Letter (3 Options)',
        'One Additional Resume',
        'LinkedIn Optimization',
        'Career Interview Coaching',
      ],
      highlight: true,
      popular: true,
      link: 'https://rezzybyrlm.com/product/rezzy-definitive/',
    },
    {
      name: 'Accelerated Package',
      price: '$300',
      interval: '/month',
      features: [
        'One-on-One Consultation with Our Resume Writer (Email or Zoom call 30 minutes)',
        'One Page Resume (Career, Federal, and Curriculum Vitae)',
        'One Page Bio',
        'Cover Letter',
        'Unlimited Revisions for 14 Days',
        'Vcard plus QR code',
        'Reference List',
        'Thank You Letter (3 Options)',
        'One Additional Resume',
      ],
      highlight: false,
      popular: false,
      link: 'https://rezzybyrlm.com/product/rezzy-accelerated/',
    },
  ]

  const handleSelectPlan = async (plan: any) => {
    if (plan.isFree) {
      // Set free plan and redirect
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
    } else if (plan.link) {
      // Redirect to external product pages
      window.location.href = plan.link
    } else {
      // Fallback: go to cart with package
      router.push(`/cart?package=${plan.name.toLowerCase().replace(/\s+/g, '-')}`)
    }
  }

  const handleSkip = () => {
    router.push(redirectTo)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Resume Package
          </h1>
          <p className="text-xl text-gray-600">
            Professional resume writing services tailored to your needs
          </p>
          {redirectTo !== '/dashboard' && (
            <p className="text-sm text-gray-500 mt-2">
              After purchasing, you'll have access to <span className="font-semibold">{redirectTo}</span>
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlight
                  ? 'border-blue-500 border-2 shadow-xl transform scale-105'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 min-h-[400px]">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.isFree
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loading || currentPlan === plan.name.toLowerCase().replace(/\s+/g, '-')}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : currentPlan === plan.name.toLowerCase().replace(/\s+/g, '-') ? (
                    'Current Plan'
                  ) : plan.isFree ? (
                    'Start Free'
                  ) : (
                    'View Package'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-900"
          >
            Skip for now and explore
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Features Comparison */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Professional Writers
            </h3>
            <p className="text-gray-600">
              Expert resume writers with years of experience in your industry
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Comprehensive Packages
            </h3>
            <p className="text-gray-600">
              Everything you need from resume to LinkedIn optimization
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlimited Revisions
            </h3>
            <p className="text-gray-600">
              14 days of unlimited revisions to ensure perfection
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

