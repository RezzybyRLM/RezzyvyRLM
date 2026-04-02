import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canAccessAdminConsole } from '@/lib/auth/permissions'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!canAccessAdminConsole(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createServiceRoleClient()
    const { data: job, error } = await admin
      .from('jobs')
      .select(
        'id, title, location, description, salary_range, job_type, is_featured, expires_at, application_deadline, company_id, companies(name)'
      )
      .eq('id', id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!canAccessAdminConsole(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createServiceRoleClient()
    const { error } = await admin.from('jobs').delete().eq('id', id)

    if (error) {
      console.error('admin job delete', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!canAccessAdminConsole(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const admin = createServiceRoleClient()
    const { data, error } = await admin.from('jobs').update(updates).eq('id', id).select('id').single()

    if (error) {
      console.error('admin job patch', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, job: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
