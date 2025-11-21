import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus, updateOnboardingStep, markOnboardingComplete } from '@/lib/onboarding/status'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const status = await getOnboardingStatus(user.id)

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Error getting onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { step, complete } = body

    if (complete) {
      await markOnboardingComplete(user.id)
      return NextResponse.json({ success: true, message: 'Onboarding marked as complete' })
    }

    if (typeof step === 'number') {
      await updateOnboardingStep(user.id, step)
      return NextResponse.json({ success: true, message: 'Onboarding step updated' })
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    )
  }
}

