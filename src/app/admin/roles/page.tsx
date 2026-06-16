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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login?redirectTo=/admin/roles')
        return
      }
      const { data: me } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading role management…</p>
        </div>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Super admin only</h1>
          <p className="mb-6 text-gray-600">
            Role and permission changes are limited to super administrators.
          </p>
          <Button asChild>
            <Link href="/admin/dashboard">Admin overview</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Role management</h1>
            <p className="text-sm text-muted-foreground">Assign roles and permissions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </Button>
          <Badge className="bg-primary-100 text-primary-900">Super admin</Badge>
        </div>
      </div>

      <div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <Card className="glass-card border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Shield className="h-5 w-5" />
              Users &amp; roles
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/80 text-slate-600">
                  <th className="px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">Role</th>
                  <th className="px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">Name</th>
                  <th className="min-w-[200px] px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">Email</th>
                  <th className="px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">Joined</th>
                  <th className="px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">Users</th>
                  <th className="px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">Content</th>
                  <th className="px-3 py-3 pr-4 text-xs font-semibold uppercase tracking-wide">System</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">Actions</th>
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
                    <tr key={u.id} className="border-b border-slate-100/90 hover:bg-white/60">
                      <td className="py-4 pr-4 align-top">
                        <select
                          className="w-full min-w-[9.5rem] rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-900 shadow-sm"
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
                      <td className="py-4 pr-4 align-middle">
                        <span className="font-medium text-slate-900">{u.full_name || '—'}</span>
                      </td>
                      <td className="py-4 pr-4 align-middle">
                        <span className="break-all text-slate-800">{u.email}</span>
                      </td>
                      <td className="py-4 pr-4 align-middle tabular-nums text-slate-700">
                        {formatAdminTableDate(u.created_at)}
                      </td>
                      <td className="py-4 pr-4">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={effective.manageUsers}
                            disabled={staffLocked}
                            onChange={(e) => {
                              if (staffLocked) return
                              updateDraft(u.id, { perm_manage_users: e.target.checked })
                            }}
                          />
                        </label>
                      </td>
                      <td className="py-4 pr-4">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={effective.manageContent}
                            disabled={staffLocked}
                            onChange={(e) => {
                              if (staffLocked) return
                              updateDraft(u.id, { perm_manage_content: e.target.checked })
                            }}
                          />
                        </label>
                      </td>
                      <td className="py-4 pr-4">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={effective.manageSystem}
                            disabled={staffLocked}
                            onChange={(e) => {
                              if (staffLocked) return
                              updateDraft(u.id, { perm_manage_system: e.target.checked })
                            }}
                          />
                        </label>
                      </td>
                      <td className="py-4">
                        <Button
                          size="sm"
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
              <p className="py-8 text-center text-gray-500">No users found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
