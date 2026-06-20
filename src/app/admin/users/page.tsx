'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Users, Shield, Building2, Headphones, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { canManageRoles } from '@/lib/auth/permissions'
import { AdminRoleBadge, formatAdminTableDate } from '@/components/admin/admin-role-badge'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  created_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [superAdmin, setSuperAdmin] = useState(false)
  const [query, setQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single()
        setSuperAdmin(canManageRoles(row?.role ?? null))
      }
    })()
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/users')
      .then(async r => {
        const j = await r.json()
        if (cancelled) return
        if (r.status === 403) {
          setError('You do not have access to the user directory.')
          return
        }
        if (!r.ok) {
          setError(j.error || 'Failed to load')
          return
        }
        setUsers((j.users || []) as UserRow[])
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const is = (...roles: string[]) => users.filter(u => roles.includes(u.role ?? 'user')).length
    return [
      { label: 'Total accounts', value: users.length, icon: Users },
      { label: 'Admins', value: is('admin', 'super_admin'), icon: Shield },
      { label: 'Employers', value: is('employer'), icon: Building2 },
      { label: 'Service team', value: is('service_team'), icon: Headphones },
    ]
  }, [users])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => (u.full_name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, query])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading users…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-accent">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Directory of accounts. Role changes are limited to super administrators.</p>
        </div>
        {superAdmin ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/roles">Edit roles</Link>
          </Button>
        ) : null}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums text-gray-900">{s.value.toLocaleString()}</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-900">{filtered.length} of {users.length} accounts</p>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or email…" className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-gray-400">
                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Role</th>
                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Name</th>
                <th scope="col" className="min-w-[200px] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Email</th>
                <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/70">
                  <td className="px-3 py-3 align-middle"><AdminRoleBadge role={u.role} /></td>
                  <td className="px-3 py-3 align-middle"><span className="font-medium text-gray-900">{u.full_name || '—'}</span></td>
                  <td className="px-3 py-3 align-middle"><span className="break-all text-gray-700 tabular-nums">{u.email}</span></td>
                  <td className="px-3 py-3 align-middle text-gray-500 tabular-nums">{formatAdminTableDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">No accounts match your search.</p> : null}
        </div>
      </div>
    </div>
  )
}
