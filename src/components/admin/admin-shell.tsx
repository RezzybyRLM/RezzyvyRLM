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
  MessageSquare,
  Shield,
  LogOut,
  ExternalLink,
  Loader2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Link2,
  Compass,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

const ADMIN_SIDEBAR_KEY = 'admin-sidebar-collapsed'
const ADMIN_ROLE_KEY = 'rezzy:adminRole'

const nav = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/inbox', label: 'Inbox', icon: Inbox },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/job-board', label: 'Job board', icon: Compass },
  { href: '/admin/org-invites', label: 'Org invites', icon: Link2 },
  { href: '/admin/service-invites', label: 'Service invites', icon: Sparkles },
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
    // Instant render from a cached admin role (validated in the background below)
    try {
      const cachedRole = localStorage.getItem(ADMIN_ROLE_KEY)
      if (cachedRole && canAccessAdminConsole(cachedRole)) {
        setIsSuperAdmin(canManageRoles(cachedRole))
        setReady(true)
      }
    } catch {
      /* storage unavailable */
    }
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(ADMIN_SIDEBAR_KEY, next ? 'true' : 'false')
  }

  useEffect(() => {
    let cancelled = false

    // Validate the session's role in the background. We resolve auth from the
    // persisted session (getSession / INITIAL_SESSION) — no blocking network
    // getUser() — so a refresh never hangs on the loader.
    const validate = async (sessionUserId: string | null) => {
      // Middleware already gates /admin/* for authenticated users, so a falsy
      // session here is a transient client race — never redirect to login on it
      // (that would bounce an authed admin to the overview). Genuine sign-out is
      // handled by the SIGNED_OUT event below.
      if (sessionUserId === null) {
        return
      }
      const { data: row } = await supabase.from('users').select('role').eq('id', sessionUserId).single()
      if (cancelled) return
      const role = row?.role
      if (!role || !canAccessAdminConsole(role)) {
        try { localStorage.removeItem(ADMIN_ROLE_KEY) } catch {}
        setForbidden(true)
        setReady(true)
        return
      }
      try { localStorage.setItem(ADMIN_ROLE_KEY, role) } catch {}
      setForbidden(false)
      setIsSuperAdmin(canManageRoles(role))
      setReady(true)
    }

    // 1) Source of truth for logged-in/out: getSession() reads the persisted
    //    session from storage (and refreshes if needed). Only this decides the
    //    "no session -> redirect" case, so a transient INITIAL_SESSION(null)
    //    during client navigation can't bounce an authed admin to login.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      void validate(session?.user?.id ?? null)
    })

    // 2) React to live auth changes only (never redirect on a null here).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT') {
        try { localStorage.removeItem(ADMIN_ROLE_KEY) } catch {}
        router.replace('/auth/login')
      } else if (session?.user) {
        void validate(session.user.id)
      }
    })

    // 3) Safety net: never hang on the loader.
    const safety = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 2500)

    return () => {
      cancelled = true
      clearTimeout(safety)
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const signOut = async () => {
    // Authoritative server-side sign-out (clears SSR cookies; never hangs).
    try { void supabase.auth.signOut({ scope: 'local' }).catch(() => {}) } catch { /* ignore */ }
    window.location.href = '/auth/signout?next=/auth/login'
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-admin))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--surface-admin))] px-4">
        <p className="text-lg font-medium text-gray-900">You do not have access to the admin console.</p>
        <Link href="/dashboard" className="text-sm font-medium text-primary-600 hover:underline">
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
            active ? 'bg-primary-600/15 text-primary-800' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
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
            collapsed ? 'w-[4.5rem] px-2' : 'w-64 px-3'
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
                  ? 'bg-primary-600/15 text-primary-800'
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
                        active ? 'bg-primary-600/15 text-primary-800' : 'text-gray-600 hover:bg-white/50'
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
                        ? 'bg-primary-600/15 text-primary-800'
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
