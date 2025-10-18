import { NextRequest, NextResponse } from 'next/server'
import { createDonationCheckoutSession } from '@/lib/stripe/client'
import { z } from 'zod'

const checkoutSchema = z.object({
  amount: z.number().min(100, 'Minimum donation is $1.00'),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  type: z.enum(['donation', 'job_posting']).default('donation'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, donorName, donorEmail, type } = checkoutSchema.parse(body)

    let session

    if (type === 'donation') {
      session = await createDonationCheckoutSession(
        amount,
        donorEmail,
        donorName
      )
    } else {
      return NextResponse.json(
        { success: false, error: 'Job posting checkout not implemented yet' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    })

  } catch (error) {
    console.error('Checkout API error:', error)

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
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
