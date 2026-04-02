import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

async function assertEmployerOwnsJob(userId: string, jobId: string) {
  const admin = createServiceRoleClient()
  const { data: row } = await admin.from('users').select('employer_company_id, role').eq('id', userId).single()
  if (row?.role !== 'employer' || !row.employer_company_id) {
    return { ok: false as const, status: 403 as const, message: 'Employer workspace required' }
  }
  const { data: job } = await admin.from('jobs').select('company_id').eq('id', jobId).maybeSingle()
  if (!job) {
    return { ok: false as const, status: 404 as const, message: 'Job not found' }
  }
  if (job.company_id !== row.employer_company_id) {
    return { ok: false as const, status: 403 as const, message: 'Not your listing' }
  }
  return { ok: true as const, admin }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = await params
    const gate = await assertEmployerOwnsJob(user.id, jobId)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const stringFields = ['title', 'location', 'description', 'salary_range', 'job_type'] as const
    for (const f of stringFields) {
      if (typeof body[f] === 'string') updates[f] = (body[f] as string).trim()
    }
    if (typeof body.is_featured === 'boolean') updates.is_featured = body.is_featured
    if (typeof body.expires_at === 'string') updates.expires_at = body.expires_at
    if (body.expires_at === null) updates.expires_at = null
    if (typeof body.application_deadline === 'string') updates.application_deadline = body.application_deadline
    if (body.application_deadline === null) updates.application_deadline = null

    const { error } = await gate.admin.from('jobs').update(updates).eq('id', jobId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('employer job patch', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: jobId } = await params
    const gate = await assertEmployerOwnsJob(user.id, jobId)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status })
    }

    const { error } = await gate.admin.from('jobs').delete().eq('id', jobId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}

