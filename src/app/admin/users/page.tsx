'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { canManageRoles } from '@/lib/auth/permissions'

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading users…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Directory of accounts. Role changes are limited to super administrators.
          </p>
        </div>
        {superAdmin ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/roles">Edit roles</Link>
          </Button>
        ) : null}
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">{users.length} accounts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium">{u.email}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{u.full_name || '—'}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="secondary" className="font-normal">
                      {u.role || 'user'}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
