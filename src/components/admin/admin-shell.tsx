'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  canAccessAdminConsole,
  canManageRoles,
} from '@/lib/auth/permissions'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  CreditCard,
  Inbox,
  Shield,
  LogOut,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login?redirectTo=' + encodeURIComponent(pathname || '/admin/dashboard'))
        return
      }
      const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (cancelled) return
      if (!row?.role || !canAccessAdminConsole(row.role)) {
        setForbidden(true)
        setReady(true)
        return
      }
      setIsSuperAdmin(canManageRoles(row.role))
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase, router, pathname])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-admin))]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--surface-admin))] px-4">
        <p className="text-lg font-medium text-gray-900">You do not have access to the admin console.</p>
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
          Go to member dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-admin))] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="glass-admin fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-[hsl(var(--glass-border))] px-3 py-6 md:sticky md:top-0">
          <Link href="/admin/dashboard" className="mb-8 flex items-center gap-2 px-2">
            <Image src="/logo.png" alt="" width={36} height={36} className="object-contain" />
            <span className="text-sm font-semibold tracking-tight">Admin</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-0.5">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === href || (href !== '/admin/dashboard' && pathname?.startsWith(href))
                    ? 'bg-blue-600/10 text-blue-700'
                    : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {label}
              </Link>
            ))}
            {isSuperAdmin && (
              <Link
                href="/admin/roles"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === '/admin/roles'
                    ? 'bg-blue-600/10 text-blue-700'
                    : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                )}
              >
                <Shield className="h-4 w-4 shrink-0 opacity-80" />
                Roles
              </Link>
            )}
          </nav>
          <div className="mt-4 space-y-1 border-t border-[hsl(var(--glass-border))] pt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-white/40 hover:text-gray-900"
            >
              <ExternalLink className="h-4 w-4" />
              Member site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-white/40 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto px-4 py-8 md:px-10 lg:pl-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
