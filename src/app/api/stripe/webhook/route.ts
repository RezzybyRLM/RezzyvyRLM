import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import Stripe from 'stripe'

async function logStripeEventHandled(event: Stripe.Event) {
  try {
    const svc = createServiceRoleClient()
    const { error } = await svc.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      payload_summary: {
        livemode: event.livemode,
        objectId: (event.data.object as { id?: string }).id,
      },
    })
    if (error && error.code !== '23505' && !String(error.message).toLowerCase().includes('duplicate')) {
      console.error('stripe_events insert', error)
    }
  } catch (e) {
    console.warn('stripe_events table may be missing; run migrations', e)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.metadata?.type === 'subscription') {
          const userId = session.metadata.user_id
          const planType = session.metadata.plan_type || 'basic'

          if (userId) {
            const subscriptionId = session.subscription as string
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)

            await supabase.from('user_plans').upsert({
              user_id: userId,
              plan_type: planType,
              stripe_subscription_id: subscriptionId,
              api_quota_remaining: planType === 'basic' ? 50 : planType === 'pro' ? 200 : -1,
              quota_reset_date: new Date(subscription.current_period_end * 1000).toISOString(),
            })
          }
        } else if (session.metadata?.type === 'donation') {
          console.log('Donation completed:', session.id)
        } else if (session.metadata?.type === 'job_posting') {
          const jobId = session.metadata.jobId

          if (jobId) {
            await supabase
              .from('jobs')
              .update({
                is_featured: true,
                featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq('id', jobId)
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const customer = await stripe.customers.retrieve(subscription.customer as string)
        const customerEmail = customer.deleted ? null : customer.email

        if (customerEmail) {
          const planType = subscription.metadata?.plan_type || 'basic'

          const { data: user } = await supabase.from('users').select('id').eq('email', customerEmail).single()

          if (user) {
            await supabase.from('user_plans').upsert({
              user_id: (user as { id: string }).id,
              stripe_subscription_id: subscription.id,
              plan_type: planType,
              api_quota_remaining: planType === 'basic' ? 50 : planType === 'pro' ? 200 : -1,
              quota_reset_date: new Date(subscription.current_period_end * 1000).toISOString(),
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('user_plans')
          .update({
            plan_type: 'free',
            stripe_subscription_id: null,
            api_quota_remaining: 10,
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for invoice:', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    await logStripeEventHandled(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
