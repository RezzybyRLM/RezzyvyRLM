import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const bodySchema = z.object({
  token: z.string().min(16),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sign in to accept this invite' }, { status: 401 })
    }

    const json = await request.json()
    const { token } = bodySchema.parse(json)

    const admin = createServiceRoleClient()

    const { data: existingUser } = await admin.from('users').select('id, role').eq('id', user.id).single()

    if (existingUser?.role === 'admin' || existingUser?.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Staff accounts cannot claim employer invites with this flow' },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()

    const { data: lockedRows, error: lockErr } = await admin
      .from('employer_invites')
      .update({
        used_at: nowIso,
        used_by_user_id: user.id,
      })
      .eq('token', token)
      .is('used_at', null)
      .gte('expires_at', nowIso)
      .select('id, company_name')

    if (lockErr) {
      console.error('invite lock', lockErr)
      return NextResponse.json({ error: 'Could not accept invite' }, { status: 500 })
    }

    const locked = Array.isArray(lockedRows) ? lockedRows[0] : lockedRows
    if (!locked) {
      const { data: anyRow } = await admin
        .from('employer_invites')
        .select('used_at, expires_at')
        .eq('token', token)
        .maybeSingle()
      if (!anyRow) {
        return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      }
      if (anyRow.used_at) {
        return NextResponse.json({ error: 'This invite link has already been used' }, { status: 410 })
      }
      return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
    }

    const { data: company, error: cErr } = await admin
      .from('companies')
      .insert({
        name: locked.company_name,
        location: '—',
      })
      .select('id')
      .single()

    if (cErr || !company) {
      console.error('claim company', cErr)
      return NextResponse.json({ error: 'Could not create organization' }, { status: 500 })
    }

    const { error: uErr } = await admin
      .from('users')
      .update({
        role: 'employer',
        employer_company_id: company.id,
        onboarding_completed: true,
        onboarding_completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', user.id)

    if (uErr) {
      console.error('user employer update', uErr)
      return NextResponse.json({ error: 'Could not attach you to the organization' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      companyId: company.id,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
