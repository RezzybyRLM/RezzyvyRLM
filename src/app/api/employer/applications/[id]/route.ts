import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateApplicationStatus, addApplicationNotes } from '@/lib/employer/applications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: applicationId } = await params
    const body = await request.json()
    const { status, notes } = body

    if (status) {
      await updateApplicationStatus(applicationId, status, notes)
    } else if (notes !== undefined) {
      await addApplicationNotes(applicationId, notes)
    } else {
      return NextResponse.json(
        { error: 'Status or notes required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update application' },
      { status: 500 }
    )
  }
}

