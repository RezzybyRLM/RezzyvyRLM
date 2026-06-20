import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const bodySchema = z.object({ token: z.string().min(16) })

/** Claim a single-use Service Team invite → promote the signed-in user to service_team. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to accept this invite' }, { status: 401 })

    const { token } = bodySchema.parse(await request.json())
    const admin = createServiceRoleClient()

    const { data: existingUser } = await admin.from('users').select('id, role').eq('id', user.id).single()
    if (existingUser?.role === 'admin' || existingUser?.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Staff accounts cannot claim service invites with this flow' },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()

    // Atomically claim the single-use token.
    const { data: lockedRows, error: lockErr } = await admin
      .from('service_invites')
      .update({ used_at: nowIso, used_by_user_id: user.id })
      .eq('token', token)
      .is('used_at', null)
      .gte('expires_at', nowIso)
      .select('id')

    if (lockErr) {
      console.error('service invite lock', lockErr)
      return NextResponse.json({ error: 'Could not accept invite' }, { status: 500 })
    }

    const locked = Array.isArray(lockedRows) ? lockedRows[0] : lockedRows
    if (!locked) {
      const { data: anyRow } = await admin
        .from('service_invites')
        .select('used_at')
        .eq('token', token)
        .maybeSingle()
      if (!anyRow) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      if (anyRow.used_at) return NextResponse.json({ error: 'This invite link has already been used' }, { status: 410 })
      return NextResponse.json({ error: 'This invite has expired' }, { status: 410 })
    }

    const { error: uErr } = await admin
      .from('users')
      .update({
        role: 'service_team',
        onboarding_completed: true,
        onboarding_completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', user.id)

    if (uErr) {
      console.error('service role update', uErr)
      return NextResponse.json({ error: 'Could not set up your service account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
