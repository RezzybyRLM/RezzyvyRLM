import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canAccessAdminConsole } from '@/lib/auth/permissions'

/**
 * Admin-only management of Service Team (RezzyMeUp) signup invites.
 * GET   → list recent invites
 * POST  → create a single-use signup link (returns the URL to share)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!canAccessAdminConsole(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createServiceRoleClient()
    const { data: rows, error } = await admin
      .from('service_invites')
      .select('id, invitee_name, invitee_email, created_at, expires_at, used_at, used_by_user_id')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('service_invites list', error)
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!canAccessAdminConsole(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const inviteeName = typeof body.inviteeName === 'string' ? body.inviteeName.trim() : ''
    const inviteeEmail = typeof body.inviteeEmail === 'string' ? body.inviteeEmail.trim() : ''
    const expiresInDays = typeof body.expiresInDays === 'number' ? body.expiresInDays : 14

    const token = randomBytes(24).toString('hex')
    const expires = new Date()
    expires.setDate(expires.getDate() + Math.min(Math.max(expiresInDays, 1), 90))

    const admin = createServiceRoleClient()
    const { data: row, error } = await admin
      .from('service_invites')
      .insert({
        token,
        created_by: user.id,
        invitee_name: inviteeName || null,
        invitee_email: inviteeEmail || null,
        expires_at: expires.toISOString(),
      })
      .select('id, invitee_name, invitee_email, expires_at')
      .single()

    if (error || !row) {
      console.error('service_invites insert', error)
      return NextResponse.json({ error: error?.message || 'Could not create invite' }, { status: 500 })
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || ''
    const url = `${base.replace(/\/$/, '')}/join/service/${token}`
    return NextResponse.json({ success: true, invite: row, url })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
