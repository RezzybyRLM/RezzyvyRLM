import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const ALLOWED = [
  'resume',
  'cover_letter',
  'bio',
  'templates',
  'coaching',
  'vcard',
  'linkedin',
  'application_processing',
]

const schema = z.object({
  serviceType: z.string(),
  title: z.string().min(1).max(160),
  notes: z.string().max(2000).optional(),
})

/**
 * A signed-in member requests a RezzyMeUp service. Creates a service_order in the
 * 'new' status for the Service Team queue. Uses the service role to insert (the
 * client-side RLS only lets members READ their own orders), with client_user_id
 * pinned to the authenticated user so a member can only order for themselves.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to request a service' }, { status: 401 })

    const { serviceType, title, notes } = schema.parse(await request.json())
    if (!ALLOWED.includes(serviceType)) {
      return NextResponse.json({ error: 'Unknown service' }, { status: 400 })
    }

    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from('service_orders')
      .insert({
        client_user_id: user.id,
        service_type: serviceType,
        title,
        status: 'new',
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('service order insert', error)
      return NextResponse.json({ error: 'Could not create your request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
