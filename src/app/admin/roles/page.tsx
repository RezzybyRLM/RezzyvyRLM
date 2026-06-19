'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  canManageRoles,
  effectivePermissions,
  type AppRole,
} from '@/lib/auth/permissions'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Shield, ArrowLeft, Users, AlertCircle } from 'lucide-react'
import { formatAdminTableDate } from '@/components/admin/admin-role-badge'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  perm_manage_users: boolean
  perm_manage_content: boolean
  perm_manage_system: boolean
  created_at: string | null
}

type Draft = {
  role: AppRole
  perm_manage_users: boolean
  perm_manage_content: boolean
  perm_manage_system: boolean
}

function roleSyncPerms(role: AppRole): Pick<Draft, 'perm_manage_users' | 'perm_manage_content' | 'perm_manage_system'> {
  if (role === 'admin' || role === 'super_admin') {
    return {
      perm_manage_users: true,
      perm_manage_content: true,
      perm_manage_system: true,
    }
  }
  return {
    perm_manage_users: false,
    perm_manage_content: false,
    perm_manage_system: false,
  }
}

export default function AdminRolesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/admin/users')
    if (res.status === 403) {
      setForbidden(true)
      setLoading(false)
      return
    }
    if (!res.ok) {
      setError('Could not load users.')
      setLoading(false)
      return
    }
    const json = await res.json()
    const list = (json.users || []) as UserRow[]
    setUsers(list)
    const next: Record<string, Draft> = {}
    for (const u of list) {
      const r = (u.role || 'user') as AppRole
      const perms = roleSyncPerms(r)
      next[u.id] = {
        role: r,
        ...perms,
      }
    }
    setDrafts(next)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const gate = async () => {
      // Auth is already enforced by middleware for /admin/*; resolve the user
      // from the persisted session and never redirect to login on a transient
      // null (that bounces an authed admin to the overview).
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) {
        setLoading(false)
        return
      }
      const { data: me } = await supabase
        .from('users')
        .select('role')
        .eq('id', uid)
        .single()
      if (cancelled) return
      if (!canManageRoles(me?.role ?? null)) {
        setForbidden(true)
        setLoading(false)
        return
      }
      await load()
    }
    gate()
    return () => {
      cancelled = true
    }
  }, [router, supabase, load])

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => {
      const cur = prev[id]
      if (!cur) return prev
      let next: Draft = { ...cur, ...patch }
      if (patch.role !== undefined) {
        next = { ...next, ...roleSyncPerms(patch.role) }
      }
      return { ...prev, [id]: next }
    })
  }

  const save = async (id: string) => {
    const d = drafts[id]
    if (!d) return
    setSavingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: d.role,
          perm_manage_users: d.perm_manage_users,
          perm_manage_content: d.perm_manage_content,
          perm_manage_system: d.perm_manage_system,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Save failed')
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading role management…</p>
        </div>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <AlertCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Super admin only</h1>
          <p className="mb-6 text-gray-500">Role and permission changes are limited to super administrators.</p>
          <Button asChild className="bg-primary-600 text-white hover:bg-primary-700">
            <Link href="/admin/dashboard">Admin overview</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Role management</h1>
          <p className="mt-1 text-sm text-gray-500">Assign roles and permissions across the platform.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold text-primary-700">
            <Shield className="h-3 w-3" /> Super admin
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 p-4">
          <Users className="h-5 w-5 text-primary-600" />
          <p className="text-sm font-semibold text-gray-900">Users &amp; roles</p>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Role</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Name</th>
                <th className="min-w-[200px] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Email</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Joined</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Users</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Content</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">System</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const d = drafts[u.id]
                const staffLocked = d?.role === 'admin' || d?.role === 'super_admin'
                const effective = effectivePermissions(
                  d
                    ? {
                        role: d.role,
                        perm_manage_users: d.perm_manage_users,
                        perm_manage_content: d.perm_manage_content,
                        perm_manage_system: d.perm_manage_system,
                      }
                    : { role: u.role }
                )
                return (
                  <tr key={u.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/70">
                    <td className="px-3 py-4 align-top">
                      <select
                        className="w-full min-w-[9.5rem] rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-600/15"
                        value={d?.role ?? 'user'}
                        onChange={(e) =>
                          updateDraft(u.id, { role: e.target.value as AppRole })
                        }
                        aria-label={`Role for ${u.email}`}
                      >
                        <option value="user">User</option>
                        <option value="employer">Employer</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <span className="font-medium text-gray-900">{u.full_name || '—'}</span>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <span className="break-all text-gray-700">{u.email}</span>
                    </td>
                    <td className="px-3 py-4 align-middle tabular-nums text-gray-500">
                      {formatAdminTableDate(u.created_at)}
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-primary-600"
                        checked={effective.manageUsers}
                        disabled={staffLocked}
                        onChange={(e) => {
                          if (staffLocked) return
                          updateDraft(u.id, { perm_manage_users: e.target.checked })
                        }}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-primary-600"
                        checked={effective.manageContent}
                        disabled={staffLocked}
                        onChange={(e) => {
                          if (staffLocked) return
                          updateDraft(u.id, { perm_manage_content: e.target.checked })
                        }}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-primary-600"
                        checked={effective.manageSystem}
                        disabled={staffLocked}
                        onChange={(e) => {
                          if (staffLocked) return
                          updateDraft(u.id, { perm_manage_system: e.target.checked })
                        }}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <Button
                        size="sm"
                        className="bg-primary-600 text-white hover:bg-primary-700"
                        disabled={savingId === u.id}
                        onClick={() => save(u.id)}
                      >
                        {savingId === u.id ? 'Saving…' : 'Save'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="py-8 text-center text-gray-400">No users found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
