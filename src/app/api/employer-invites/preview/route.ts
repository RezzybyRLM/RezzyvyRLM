import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/** Public: validate token exists and is unused (for join page copy). */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')?.trim()
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const admin = createServiceRoleClient()
    const { data: row } = await admin
      .from('employer_invites')
      .select('company_name, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (!row || row.used_at) {
      return NextResponse.json({ ok: false, reason: 'invalid_or_used' })
    }

    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, reason: 'expired' })
    }

    return NextResponse.json({
      ok: true,
      companyName: row.company_name,
      expiresAt: row.expires_at,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
