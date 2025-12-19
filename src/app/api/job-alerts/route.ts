import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { data: alerts, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching job alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job alerts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    })
  } catch (error) {
    console.error('Error in job alerts GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { search_query, location, frequency } = body

    if (!search_query || !search_query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const { data: alert, error } = await (supabase as any)
      .from('job_alerts')
      .insert({
        user_id: user.id,
        search_query: search_query.trim(),
        location: location?.trim() || null,
        frequency: frequency || 'daily',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating job alert:', error)
      return NextResponse.json(
        { error: 'Failed to create job alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alert
    })
  } catch (error) {
    console.error('Error in job alerts POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

