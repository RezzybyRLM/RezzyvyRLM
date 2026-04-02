import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createServiceRoleClient()
    const { data: row } = await admin
      .from('users')
      .select('role, employer_company_id')
      .eq('id', user.id)
      .single()

    if (row?.role !== 'employer' || !row.employer_company_id) {
      return NextResponse.json({ error: 'Employer workspace required' }, { status: 403 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const salary_range = typeof body.salary_range === 'string' ? body.salary_range.trim() : null
    const job_type = typeof body.job_type === 'string' ? body.job_type.trim() : 'Full-time'
    const is_featured = !!body.is_featured

    if (!title || !location || !description) {
      return NextResponse.json({ error: 'title, location, and description are required' }, { status: 400 })
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + 90)
    let application_deadline: string | null = null
    if (typeof body.application_deadline === 'string' && body.application_deadline) {
      application_deadline = new Date(body.application_deadline + 'T12:00:00').toISOString()
    }

    const { data: job, error } = await admin
      .from('jobs')
      .insert({
        company_id: row.employer_company_id,
        title,
        location,
        description,
        salary_range,
        job_type,
        is_featured,
        expires_at: expires.toISOString(),
        application_deadline,
        requirements: [],
        benefits: [],
        tags: [],
      })
      .select('id')
      .single()

    if (error || !job) {
      console.error('employer job insert', error)
      return NextResponse.json({ error: error?.message || 'Could not create job' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: job.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
