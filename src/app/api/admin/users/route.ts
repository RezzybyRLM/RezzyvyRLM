import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canManageRoles } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!canManageRoles(me?.role ?? null)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createServiceRoleClient()
    const { data: rows, error } = await admin
      .from('users')
      .select(
        'id, email, full_name, role, perm_manage_users, perm_manage_content, perm_manage_system, created_at, updated_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('admin users list:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: rows ?? [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
