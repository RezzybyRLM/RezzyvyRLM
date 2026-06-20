import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/** Public preview of a Service Team signup invite (validity only, no PII beyond name). */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') || ''
    if (token.length < 16) return NextResponse.json({ ok: false, reason: 'invalid' })

    const admin = createServiceRoleClient()
    const { data: row } = await admin
      .from('service_invites')
      .select('invitee_name, used_at, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (!row) return NextResponse.json({ ok: false, reason: 'not_found' })
    if (row.used_at) return NextResponse.json({ ok: false, reason: 'used' })
    if (new Date(row.expires_at) < new Date()) return NextResponse.json({ ok: false, reason: 'expired' })

    return NextResponse.json({ ok: true, inviteeName: row.invitee_name ?? null })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, reason: 'error' })
  }
}
