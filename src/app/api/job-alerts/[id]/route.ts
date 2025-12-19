import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { is_active, search_query, location, frequency } = body

    // First verify the alert belongs to the user
    const { data: existingAlert, error: fetchError } = await (supabase as any)
      .from('job_alerts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAlert || existingAlert.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Job alert not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (typeof is_active === 'boolean') updateData.is_active = is_active
    if (search_query) updateData.search_query = search_query.trim()
    if (location !== undefined) updateData.location = location?.trim() || null
    if (frequency) updateData.frequency = frequency

    const { data: alert, error } = await (supabase as any)
      .from('job_alerts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job alert:', error)
      return NextResponse.json(
        { error: 'Failed to update job alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alert
    })
  } catch (error) {
    console.error('Error in job alerts PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify the alert belongs to the user
    const { data: existingAlert, error: fetchError } = await (supabase as any)
      .from('job_alerts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingAlert || existingAlert.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Job alert not found' },
        { status: 404 }
      )
    }

    const { error } = await (supabase as any)
      .from('job_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting job alert:', error)
      return NextResponse.json(
        { error: 'Failed to delete job alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job alert deleted successfully'
    })
  } catch (error) {
    console.error('Error in job alerts DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

