import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canAccessAdminConsole } from '@/lib/auth/permissions'

export async function GET() {
  try {
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
    const { data: jobs, error } = await admin
      .from('jobs')
      .select(
        'id, title, location, salary_range, job_type, is_featured, expires_at, application_deadline, created_at, company_id, companies(name)'
      )
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) {
      console.error('admin jobs list', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, jobs: jobs ?? [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const salary_range = typeof body.salary_range === 'string' ? body.salary_range.trim() : null
    const job_type = typeof body.job_type === 'string' ? body.job_type.trim() : 'Full-time'
    const is_featured = !!body.is_featured

    if (!companyName || !title || !location || !description) {
      return NextResponse.json({ error: 'companyName, title, location, and description are required' }, { status: 400 })
    }

    const admin = createServiceRoleClient()

    let companyId: string | null = null
    const { data: existing } = await admin.from('companies').select('id').eq('name', companyName).maybeSingle()
    if (existing?.id) {
      companyId = existing.id
    } else {
      const { data: created, error: cErr } = await admin
        .from('companies')
        .insert({ name: companyName, location })
        .select('id')
        .single()
      if (cErr || !created) {
        console.error('company insert', cErr)
        return NextResponse.json({ error: cErr?.message || 'Could not create company' }, { status: 500 })
      }
      companyId = (created as { id: string }).id
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + 90)

    const { data: job, error: jErr } = await admin
      .from('jobs')
      .insert({
        company_id: companyId,
        title,
        location,
        description,
        salary_range,
        job_type,
        is_featured,
        expires_at: expires.toISOString(),
        requirements: [],
        benefits: [],
        tags: [],
      })
      .select('id')
      .single()

    if (jErr || !job) {
      console.error('job insert', jErr)
      return NextResponse.json({ error: jErr?.message || 'Could not create job' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: (job as { id: string }).id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
