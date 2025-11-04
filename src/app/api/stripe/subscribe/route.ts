import { NextRequest, NextResponse } from 'next/server'
import { createSubscriptionCheckoutSession } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const subscriptionSchema = z.object({
  planType: z.enum(['basic', 'pro', 'enterprise']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to subscribe' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planType } = subscriptionSchema.parse(body)

    const session = await createSubscriptionCheckoutSession(
      planType,
      user.id,
      user.email || ''
    )

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    })

  } catch (error) {
    console.error('Subscription checkout API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subscription session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

