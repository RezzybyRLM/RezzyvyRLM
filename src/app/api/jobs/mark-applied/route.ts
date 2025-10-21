import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction, trackUsage } from '@/lib/plans/usage-tracking'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, jobTitle, companyName, applicationUrl, jobSource } = body

    if (!jobId || !jobTitle || !companyName || !applicationUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user can make application
    const { allowed, reason } = await canPerformAction(user.id, 'application')
    
    if (!allowed) {
      return NextResponse.json(
        { error: reason, requiresUpgrade: true },
        { status: 403 }
      )
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { message: 'Already marked as applied', applied: true },
        { status: 200 }
      )
    }

    // Record application
    const { error } = await (supabase as any)
      .from('job_applications')
      .insert({
        user_id: user.id,
        job_id: jobId,
        job_source: jobSource || 'indeed',
        job_title: jobTitle,
        company_name: companyName,
        application_url: applicationUrl,
        status: 'applied',
      })

    if (error) {
      console.error('Error marking job as applied:', error)
      return NextResponse.json(
        { error: 'Failed to mark job as applied' },
        { status: 500 }
      )
    }

    // Track usage
    await trackUsage(user.id, 'application', { jobId, jobTitle })

    return NextResponse.json({
      success: true,
      message: 'Job marked as applied',
    })
  } catch (error) {
    console.error('Error in mark-applied:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

