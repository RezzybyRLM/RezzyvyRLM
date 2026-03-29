import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canManageRoles, type AppRole } from '@/lib/auth/permissions'

const ALLOWED_ROLES: AppRole[] = ['user', 'admin', 'super_admin']

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await context.params
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

    const body = await request.json()
    const role = body.role as AppRole | undefined
    let permManageUsers = !!body.perm_manage_users
    let permManageContent = !!body.perm_manage_content
    let permManageSystem = !!body.perm_manage_system

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (role === 'admin' || role === 'super_admin') {
      permManageUsers = true
      permManageContent = true
      permManageSystem = true
    } else if (role === 'user') {
      permManageUsers = false
      permManageContent = false
      permManageSystem = false
    }

    const admin = createServiceRoleClient()
    const updates: Record<string, string | boolean> = {
      perm_manage_users: permManageUsers,
      perm_manage_content: permManageContent,
      perm_manage_system: permManageSystem,
      updated_at: new Date().toISOString(),
    }
    if (role !== undefined) {
      updates.role = role
    }

    const { data, error } = await admin
      .from('users')
      .update(updates)
      .eq('id', targetId)
      .select(
        'id, email, full_name, role, perm_manage_users, perm_manage_content, perm_manage_system, updated_at'
      )
      .single()

    if (error) {
      console.error('admin user patch:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
