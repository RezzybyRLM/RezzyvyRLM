import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOneTimePackageCheckoutSession, getSamplePackageProduct } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  packageKey: z.enum(['essential', 'definitive', 'accelerated']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'You must be logged in' }, { status: 401 })
    }

    const json = await request.json()
    const { packageKey } = bodySchema.parse(json)

    if (!getSamplePackageProduct(packageKey)) {
      return NextResponse.json({ success: false, error: 'Invalid package' }, { status: 400 })
    }

    const session = await createOneTimePackageCheckoutSession(
      packageKey,
      user.id,
      user.email ?? ''
    )

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    })
  } catch (error) {
    console.error('checkout-package', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      },
      { status: 500 }
    )
  }
}
