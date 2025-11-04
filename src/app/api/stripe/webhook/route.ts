import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
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
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.metadata?.type === 'subscription') {
          // Handle subscription checkout completion
          const userId = session.metadata.user_id
          const planType = session.metadata.plan_type || 'basic'
          
          if (userId) {
            // Get subscription details
            const subscriptionId = session.subscription as string
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            
            // Update user's plan
            await (supabase as any)
              .from('user_plans')
              .upsert({
                user_id: userId,
                plan_type: planType,
                stripe_subscription_id: subscriptionId,
                api_quota_remaining: planType === 'basic' ? 50 : planType === 'pro' ? 200 : -1,
                quota_reset_date: new Date(subscription.current_period_end * 1000).toISOString(),
              })
            
            console.log(`Subscription activated for user ${userId}: ${planType}`)
          }
        } else if (session.metadata?.type === 'donation') {
          // Handle donation completion
          console.log('Donation completed:', session.id)
        } else if (session.metadata?.type === 'job_posting') {
          // Handle premium job posting payment
          const jobId = session.metadata.jobId
          
          if (jobId) {
            await (supabase as any)
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
        
        // Get customer email from customer object
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        const customerEmail = customer.deleted ? null : customer.email
        
        if (customerEmail) {
          const planType = subscription.metadata?.plan_type || 'basic'
          
          const { data: user } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', customerEmail)
            .single()

          if (user) {
            await (supabase as any)
              .from('user_plans')
              .upsert({
                user_id: user.id,
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
        
        // Downgrade user to free plan
        await (supabase as any)
          .from('user_plans')
          .update({
            plan_type: 'free',
            stripe_subscription_id: null,
            api_quota_remaining: 10, // Free tier limit
          })
          .eq('stripe_subscription_id', subscription.id)
        
        console.log(`Subscription cancelled: ${subscription.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for invoice:', invoice.id)
        
        // You could send a payment failure email here
        // or suspend user's premium features
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
