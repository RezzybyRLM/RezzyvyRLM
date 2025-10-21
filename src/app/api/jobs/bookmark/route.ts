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
    const { jobId, jobSnapshot, source } = body

    if (!jobId || !jobSnapshot || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user can bookmark
    const { allowed, reason } = await canPerformAction(user.id, 'bookmark')
    
    if (!allowed) {
      return NextResponse.json(
        { error: reason, requiresUpgrade: true },
        { status: 403 }
      )
    }

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { message: 'Already bookmarked', bookmarked: true },
        { status: 200 }
      )
    }

    // Add bookmark
    const { error } = await (supabase as any)
      .from('bookmarks')
      .insert({
        user_id: user.id,
        job_id: jobId,
        source: source,
        job_snapshot: jobSnapshot,
      })

    if (error) {
      console.error('Error bookmarking job:', error)
      return NextResponse.json(
        { error: 'Failed to bookmark job' },
        { status: 500 }
      )
    }

    // Track usage
    await trackUsage(user.id, 'bookmark', { jobId })

    return NextResponse.json({
      success: true,
      message: 'Job bookmarked',
    })
  } catch (error) {
    console.error('Error in bookmark:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      )
    }

    const { error } = await (supabase as any)
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)

    if (error) {
      console.error('Error removing bookmark:', error)
      return NextResponse.json(
        { error: 'Failed to remove bookmark' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark removed',
    })
  } catch (error) {
    console.error('Error in bookmark delete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

