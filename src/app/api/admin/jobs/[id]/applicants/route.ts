import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canAccessAdminConsole } from '@/lib/auth/permissions'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params
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
    const { data: rows, error } = await admin
      .from('job_applications_received')
      .select('id, applied_at, status, applicant_user_id')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('admin applicants', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = [...new Set((rows ?? []).map(r => r.applicant_user_id).filter(Boolean))] as string[]
    let userMap = new Map<string, { email: string | null; full_name: string | null }>()
    if (userIds.length > 0) {
      const { data: users } = await admin.from('users').select('id, email, full_name').in('id', userIds)
      for (const u of users ?? []) {
        userMap.set(u.id, { email: u.email, full_name: u.full_name })
      }
    }

    const applicants = (rows ?? []).map(r => {
      const u = userMap.get(r.applicant_user_id)
      return {
        id: r.id,
        applied_at: r.applied_at,
        status: r.status,
        applicant_user_id: r.applicant_user_id,
        email: u?.email ?? null,
        full_name: u?.full_name ?? null,
      }
    })

    return NextResponse.json({ success: true, applicants })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
