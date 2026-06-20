import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canAccessAdminConsole } from '@/lib/auth/permissions'
import { emailService } from '@/lib/email/client'

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
    const { data: rows, error } = await admin
      .from('employer_invites')
      .select('id, company_name, created_at, expires_at, used_at, used_by_user_id')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('employer_invites list', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, invites: rows ?? [] })
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
    const inviteeEmail = typeof body.inviteeEmail === 'string' ? body.inviteeEmail.trim() : ''
    const expiresInDays = typeof body.expiresInDays === 'number' ? body.expiresInDays : 14

    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 })
    }

    const token = randomBytes(24).toString('hex')
    const expires = new Date()
    expires.setDate(expires.getDate() + Math.min(Math.max(expiresInDays, 1), 90))

    const admin = createServiceRoleClient()
    const { data: row, error } = await admin
      .from('employer_invites')
      .insert({
        token,
        created_by: user.id,
        company_name: companyName,
        expires_at: expires.toISOString(),
      })
      .select('id, token, company_name, expires_at')
      .single()

    if (error || !row) {
      console.error('employer_invites insert', error)
      return NextResponse.json({ error: error?.message || 'Could not create invite' }, { status: 500 })
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || ''
    const url = `${base.replace(/\/$/, '')}/join/employer/${token}`

    // One-click send: email the link to the org contact when an address was given.
    let emailed = false
    if (inviteeEmail) {
      emailed = await emailService.sendInvite({
        to: inviteeEmail,
        url,
        kind: 'employer',
        orgName: companyName,
      })
    }

    return NextResponse.json({ success: true, invite: row, url, emailed })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
