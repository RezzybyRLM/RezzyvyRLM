'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { canAccessAdminConsole, canManageRoles } from '@/lib/auth/permissions'
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

const ADMIN_SIDEBAR_KEY = 'admin-sidebar-collapsed'

const nav = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { href: '/admin/org-invites', label: 'Org invites', icon: Link2 },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const v = localStorage.getItem(ADMIN_SIDEBAR_KEY) === 'true'
    setCollapsed(v)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(ADMIN_SIDEBAR_KEY, next ? 'true' : 'false')
  }

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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  const renderNav = (opts: { onNavigate?: () => void }) =>
    nav.map(({ href, label, icon: Icon }) => {
      const active =
        pathname === href || (href !== '/admin/dashboard' && pathname?.startsWith(href))
      return (
        <Link
          key={href}
          href={href}
          onClick={opts.onNavigate}
          className={cn(
            'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active ? 'bg-blue-600/15 text-blue-800' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
            collapsed && 'justify-center px-2 md:justify-center'
          )}
          title={collapsed ? label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0 opacity-85" />
          {!collapsed && <span>{label}</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg border border-[hsl(var(--glass-border))] bg-white/95 px-2 py-1 text-xs text-gray-800 shadow-lg backdrop-blur-md md:group-hover:block">
              {label}
            </span>
          )}
        </Link>
      )
    })

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-admin))] text-gray-900">
      {/* Mobile top bar */}
      <header className="glass-admin sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[hsl(var(--glass-border))] px-4 md:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 hover:bg-white/50"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="object-contain" />
          <span className="text-sm font-semibold">Admin</span>
        </Link>
        <span className="w-10" aria-hidden />
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-screen">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            'glass-admin relative z-20 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-[hsl(var(--glass-border))] py-6 transition-[width] duration-300 ease-out md:flex md:h-screen md:sticky md:top-0',
            collapsed ? 'w-[4.5rem] px-2' : 'w-60 px-3'
          )}
        >
          <div className={cn('mb-6 flex items-center gap-2 px-2', collapsed && 'justify-center px-0')}>
            {!collapsed ? (
              <>
                <Link href="/admin/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
                  <Image src="/logo.png" alt="" width={36} height={36} className="object-contain" />
                  <span className="truncate text-sm font-semibold tracking-tight">Admin</span>
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-white/50"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/admin/dashboard" className="flex justify-center">
                  <Image src="/logo.png" alt="" width={32} height={32} className="object-contain" />
                </Link>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="absolute right-1 top-6 rounded-lg p-1 text-gray-500 hover:bg-white/50"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">{renderNav({})}</nav>

          {isSuperAdmin && (
            <Link
              href="/admin/roles"
              className={cn(
                'mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/admin/roles'
                  ? 'bg-blue-600/15 text-blue-800'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Roles' : undefined}
            >
              <Shield className="h-4 w-4 shrink-0 opacity-85" />
              {!collapsed && 'Roles'}
            </Link>
          )}

          <div className="mt-4 space-y-1 border-t border-[hsl(var(--glass-border))] pt-4">
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-white/50 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Member site' : undefined}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {!collapsed && 'Member site'}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-white/50 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Sign out' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && 'Sign out'}
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-auto px-4 py-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="glass-admin fixed inset-y-0 left-0 z-50 flex w-[min(100vw-2.5rem,17.5rem)] flex-col border-r border-[hsl(var(--glass-border))] px-3 py-6 shadow-xl md:hidden"
            >
              <div className="mb-6 flex items-center justify-between gap-2">
                <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Image src="/logo.png" alt="" width={36} height={36} className="object-contain" />
                  <span className="text-sm font-semibold">Admin</span>
                </Link>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-500 hover:bg-white/50"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
                {nav.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href || (href !== '/admin/dashboard' && pathname?.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-blue-600/15 text-blue-800' : 'text-gray-600 hover:bg-white/50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-85" />
                      {label}
                    </Link>
                  )
                })}
                {isSuperAdmin && (
                  <Link
                    href="/admin/roles"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                      pathname === '/admin/roles'
                        ? 'bg-blue-600/15 text-blue-800'
                        : 'text-gray-600 hover:bg-white/50'
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    Roles
                  </Link>
                )}
              </nav>
              <div className="mt-4 space-y-1 border-t border-[hsl(var(--glass-border))] pt-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-white/50"
                  onClick={() => setMobileOpen(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Member site
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    void signOut()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-white/50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
