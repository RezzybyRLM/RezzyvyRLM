import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canAccessAdminConsole } from '@/lib/auth/permissions'
import { getStripeMode, isStripeConfigured } from '@/lib/stripe/config'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!canAccessAdminConsole(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createServiceRoleClient()

    const [
      usersCount,
      jobsCount,
      viewsCount,
      applicationsMember,
      applicationsReceived,
      plansRes,
      contactRes,
      stripeEventsRes,
    ] = await Promise.all([
      admin.from('users').select('*', { count: 'exact', head: true }),
      admin.from('jobs').select('*', { count: 'exact', head: true }),
      admin.from('job_views').select('*', { count: 'exact', head: true }),
      admin.from('job_applications').select('*', { count: 'exact', head: true }),
      admin.from('job_applications_received').select('*', { count: 'exact', head: true }),
      admin.from('user_plans').select('plan_type, stripe_subscription_id'),
      admin.from('contact_messages').select('*', { count: 'exact', head: true }),
      admin.from('stripe_events').select('created_at').order('created_at', { ascending: false }).limit(1),
    ])

    const plans = (plansRes.data || []) as Array<{ plan_type: string | null; stripe_subscription_id: string | null }>
    const byPlan: Record<string, number> = {}
    let paying = 0
    for (const p of plans) {
      const t = p.plan_type || 'free'
      byPlan[t] = (byPlan[t] || 0) + 1
      if (p.stripe_subscription_id) paying += 1
    }

    const basicMonthly = Number(process.env.STRIPE_BASIC_MONTHLY_CENTS || '999') / 100
    const proMonthly = Number(process.env.STRIPE_PRO_MONTHLY_CENTS || '1999') / 100
    const mrrEstimate =
      (byPlan.basic || 0) * basicMonthly + (byPlan.pro || 0) * proMonthly

    const lastWebhook =
      !stripeEventsRes.error && stripeEventsRes.data?.[0]
        ? (stripeEventsRes.data[0] as { created_at: string }).created_at
        : null

    return NextResponse.json({
      success: true,
      metrics: {
        users: usersCount.count ?? 0,
        jobs: jobsCount.count ?? 0,
        jobViews: viewsCount.count ?? 0,
        jobApplicationsMember: applicationsMember.count ?? 0,
        jobApplicationsReceived: applicationsReceived.count ?? 0,
        contactMessages: contactRes.count ?? 0,
        userPlansByType: byPlan,
        payingSubscriptions: paying,
        mrrEstimateUsd: Math.round(mrrEstimate * 100) / 100,
        lastStripeWebhookAt: lastWebhook,
        stripeConfigured: isStripeConfigured(),
        stripeMode: getStripeMode(),
      },
    })
  } catch (e) {
    console.error('admin metrics', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
