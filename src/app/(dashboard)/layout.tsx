'use client'

import { useState, useEffect, useRef, Fragment, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  UserRound,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  CreditCard,
  Sparkles,
  BellRing,
} from 'lucide-react'
import { signOut } from '@/lib/auth/signout'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { DashboardLogo } from '@/components/dashboard/dashboard-logo'
import { getDashboardNavigation, navGroupLabel } from '@/lib/dashboard/navigation'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { BrandLoader } from '@/components/ui/page-loader'

const iconClass = 'h-[1.125rem] w-[1.125rem] shrink-0 stroke-[1.5]'

// Store sidebar state in localStorage for persistence
const SIDEBAR_STATE_KEY = 'dashboard-sidebar-collapsed'
// Cache of the signed-in user's profile for instant render on refresh
const PROFILE_CACHE_KEY = 'rezzy:profile'
// Routes inside the dashboard group that are browsable without signing in
const PUBLIC_PREFIXES = ['/jobs']

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [appRole, setAppRole] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [publicMode, setPublicMode] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  const isPublicPath = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  // Load sidebar state
  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true'
    setSidebarCollapsed(collapsed)
  }, [])

  // Instant hydrate from cached profile so a refresh renders immediately
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY)
      if (raw) {
        const c = JSON.parse(raw)
        setUserProfile({ full_name: c.full_name ?? null, avatar_url: c.avatar_url ?? null })
        setAppRole(c.role ?? 'user')
        setUser((prev: any) => prev ?? (c.email ? { email: c.email, id: c.id } : prev))
        setInitialLoad(false)
      }
    } catch {
      /* ignore malformed cache */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem(SIDEBAR_STATE_KEY, newState ? 'true' : 'false')
  }

  const [headerSearch, setHeaderSearch] = useState('')
  const headerSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = headerSearch.trim()
    if (q) router.push(`/jobs?q=${encodeURIComponent(q)}`)
  }

  const navIsActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  const navigation = getDashboardNavigation(appRole)

  const sidebarAccent =
    appRole === 'admin' || appRole === 'super_admin'
      ? 'border-l-[3px] border-l-primary-500/25'
      : appRole === 'employer'
        ? 'border-l-[3px] border-l-emerald-500/25'
        : ''

  // Fetch unread message count
  useEffect(() => {
    if (!user) return

    let mounted = true
    const fetchUnreadCount = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser || !mounted) return

        const { data: directConversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)

        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('conversation_id')
          .eq('user_id', currentUser.id)

        const conversationIds = [
          ...(directConversations?.map(c => c.id) || []),
          ...(groupMembers?.map(gm => gm.conversation_id) || [])
        ]

        if (conversationIds.length === 0) {
          if (mounted) setUnreadCount(0)
          return
        }

        const { data: messages } = await supabase
          .from('messages')
          .select('id, is_read, read_by, sender_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', currentUser.id)

        if (!messages) {
          if (mounted) setUnreadCount(0)
          return
        }

        const count = messages.filter(msg => {
          const readBy = Array.isArray(msg.read_by) ? msg.read_by : []
          return !readBy.includes(currentUser.id)
        }).length

        if (mounted) setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching unread count:', error)
        if (mounted) setUnreadCount(0)
      }
    }

    fetchUnreadCount()

    const channel = supabase
      .channel('unread_count_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        if (mounted) fetchUnreadCount()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, () => {
        if (mounted) fetchUnreadCount()
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  useEffect(() => {
    let mounted = true

    // Fetch profile in the background — never blocks the shell from rendering.
    const loadProfile = async (authUser: User) => {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, avatar_url, role')
        .eq('id', authUser.id)
        .single()
      if (!profile || !mounted) return
      setUserProfile(profile as any)
      setAppRole((profile as { role?: string }).role ?? 'user')
      try {
        localStorage.setItem(
          PROFILE_CACHE_KEY,
          JSON.stringify({
            id: authUser.id,
            email: authUser.email,
            full_name: (profile as any).full_name ?? null,
            avatar_url: (profile as any).avatar_url ?? null,
            role: (profile as { role?: string }).role ?? 'user',
          })
        )
      } catch {
        /* storage may be unavailable */
      }
    }

    const onAuthed = (authUser: User) => {
      if (!mounted) return
      setUser(authUser)
      setPublicMode(false)
      setInitialLoad(false) // render immediately; profile hydrates in the background
      void loadProfile(authUser)
    }

    const onNoSession = () => {
      if (!mounted) return
      setUser(null)
      setUserProfile(null)
      setAppRole(null)
      try { localStorage.removeItem(PROFILE_CACHE_KEY) } catch {}
      if (isPublicPath) {
        setPublicMode(true)
        setInitialLoad(false)
      } else {
        const redirect = encodeURIComponent(pathname || '/dashboard')
        router.replace(`/auth/login?redirectTo=${redirect}`)
      }
    }

    // 1) Source of truth: getSession() reads the persisted session from storage
    //    (refreshing if needed). Only this decides the "no session" path, so a
    //    transient INITIAL_SESSION(null) during navigation can't false-redirect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) onAuthed(session.user)
      else onNoSession()
    })

    // 2) React to live auth changes only (never treat a null here as logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        onNoSession()
      } else if (session?.user) {
        onAuthed(session.user)
      }
    })

    // 3) Safety net: never let the workspace hang on the loader.
    const safety = setTimeout(() => {
      if (mounted) setInitialLoad(false)
    }, 2500)

    return () => {
      mounted = false
      clearTimeout(safety)
      subscription.unsubscribe()
    }
  }, [router, supabase, pathname, isPublicPath])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  if (initialLoad) {
    return <BrandLoader />
  }

  // Public browsing (e.g. /jobs while signed out): marketing chrome instead of the app shell
  if (publicMode && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar user={null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop (light shell aligned with marketing site) */}
      <aside
        className={cn(
          'relative z-40 hidden flex-col border-r border-white/30 bg-white/55 shadow-sm backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex',
          sidebarCollapsed ? 'w-[4.5rem]' : 'w-64',
          sidebarAccent
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/25 px-3">
          {!sidebarCollapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <DashboardLogo href="/" priority />
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 rounded-md p-1.5 text-text/50 transition-colors hover:bg-background hover:text-text"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-1 justify-center">
                <DashboardLogo href="/" compact priority />
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 rounded-md p-1.5 text-text/50 transition-colors hover:bg-background hover:text-text"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5 stroke-[1.5]" />
              </button>
            </>
          )}
        </div>

        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {navigation.map((item, index) => {
            const Icon = item.icon
            const isActive = navIsActive(item.href)
            const prev = index > 0 ? navigation[index - 1] : undefined
            const label = navGroupLabel(item.group)
            const showSection =
              !!label &&
              (index === 0 ? item.group !== 'main' : item.group !== prev?.group)
            return (
              <Fragment key={`${item.href}-${item.name}`}>
                {!sidebarCollapsed && showSection && (
                  <div className="px-3 pb-1 pt-3 first:pt-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text/45">{label}</p>
                  </div>
                )}
                <Link
                  href={item.href}
                  className={`group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'border-l-[3px] border-primary bg-primary/10 pl-[calc(0.75rem+3px)] text-primary -ml-[3px]'
                      : 'border-l-[3px] border-transparent text-text/70 hover:bg-background hover:text-text'
                  }`}
                >
                  <Icon className={`${iconClass} ${isActive ? 'text-primary' : 'text-text/45 group-hover:text-text/70'}`} />
                  {!sidebarCollapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
                  {item.name === 'Messages' && unreadCount > 0 && (
                    <span
                      className={`flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white ${
                        sidebarCollapsed ? 'absolute right-1 top-1' : 'ml-auto shrink-0'
                      }`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {sidebarCollapsed && (
                    <div className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md border border-border bg-white px-2 py-1 text-xs text-text opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
                      {item.name}
                    </div>
                  )}
                </Link>
              </Fragment>
            )
          })}
        </nav>

        <div className="relative border-t border-border p-3">
          {!sidebarCollapsed ? (
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-background"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="" className="h-9 w-9 rounded-full border border-border object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
                  <UserRound className="h-4 w-4 text-text/40 stroke-[1.5]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{userProfile?.full_name || 'Account'}</p>
                <p className="truncate text-xs text-text/50">{user?.email}</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-text/40 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              type="button"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-background/80"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="Account menu"
            >
              <UserRound className="h-5 w-5 text-text/50 stroke-[1.5]" />
            </button>
          )}

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute bottom-full z-50 mb-2 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg ${
                  sidebarCollapsed ? 'left-1/2 w-48 -translate-x-1/2' : 'left-2 right-2'
                }`}
              >
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-background" onClick={() => setProfileMenuOpen(false)}>
                  <UserRound className="h-4 w-4 stroke-[1.5]" /> Profile
                </Link>
                <Link
                  href="/settings/plan"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-background"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <CreditCard className="h-4 w-4 stroke-[1.5]" /> Plan settings
                </Link>
                <Link
                  href="/plans"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-background"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Sparkles className="h-4 w-4 stroke-[1.5]" /> Upgrade
                </Link>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => signOut('/auth/login')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 stroke-[1.5]" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/25 bg-white/70 px-4 shadow-sm backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-text/55 transition-colors hover:bg-background lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 stroke-[1.5]" />
            </button>
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <DashboardLogo href="/" compact />
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium capitalize text-text/60">
                {pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <form
              onSubmit={headerSearchSubmit}
              className="hidden min-w-0 items-center rounded-lg border border-border bg-background px-3 py-1.5 transition-shadow focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/15 md:flex md:w-56 lg:w-72"
            >
              <Search className="mr-2 h-4 w-4 shrink-0 text-text/40 stroke-[1.5]" />
              <input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search jobs…"
                className="w-full border-0 bg-transparent text-sm text-text placeholder:text-text/40 outline-none"
                aria-label="Search jobs"
              />
            </form>
            <Link
              href="/job-alerts"
              className="rounded-lg p-2 text-text/50 transition-colors hover:bg-background hover:text-primary"
              aria-label="Job alerts"
            >
              <BellRing className="h-5 w-5 stroke-[1.5]" />
            </Link>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto bg-background">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B6B' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[1600px] p-4 pb-24 md:p-8 md:pb-8 lg:pb-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[min(100vw-3rem,18rem)] flex-col border-r border-white/30 bg-white/85 shadow-xl backdrop-blur-xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
                <DashboardLogo href="/" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-text/50 transition-colors hover:bg-background"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 stroke-[1.5]" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                {navigation.map((item, index) => {
                  const active = navIsActive(item.href)
                  const prev = index > 0 ? navigation[index - 1] : undefined
                  const label = navGroupLabel(item.group)
                  const showSection =
                    !!label &&
                    (index === 0 ? item.group !== 'main' : item.group !== prev?.group)
                  return (
                    <Fragment key={`${item.href}-${item.name}`}>
                      {showSection && (
                        <div className="px-3 pb-1 pt-3 first:pt-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-text/45">{label}</p>
                        </div>
                      )}
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                          active ? 'bg-primary/10 text-primary' : 'text-text/70 hover:bg-background'
                        }`}
                      >
                        <item.icon className={`${iconClass} ${active ? 'text-primary' : 'text-text/45'}`} />
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      </Link>
                    </Fragment>
                  )
                })}
              </nav>
              <div className="border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => signOut('/auth/login')}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 stroke-[1.5]" /> Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/30 bg-white/80 px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl lg:hidden">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = navIsActive(item.href)
          return (
            <Link
              key={`${item.href}-${item.name}`}
              href={item.href}
              className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 py-1 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-text/45'
              }`}
            >
              <div className="relative">
                <Icon className="h-[1.125rem] w-[1.125rem] stroke-[1.5]" />
                {item.name === 'Messages' && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="max-w-[4.25rem] truncate text-[10px] font-medium">{item.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

