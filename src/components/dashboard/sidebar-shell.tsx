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
  Search,
  CreditCard,
  Sparkles,
} from 'lucide-react'
import { signOut } from '@/lib/auth/signout'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { DashboardLogo } from '@/components/dashboard/dashboard-logo'

// WebGL ambient is client-only (three.js) and purely decorative — load it lazily
// so it never blocks first paint or SSR.
const DashboardAmbient = dynamic(
  () => import('@/components/dashboard/dashboard-ambient'),
  { ssr: false }
)
import { getDashboardNavigation, navGroupLabel } from '@/lib/dashboard/navigation'
import { cn } from '@/lib/utils'

const iconClass = 'h-[1.125rem] w-[1.125rem] shrink-0 stroke-[1.5]'
const SIDEBAR_STATE_KEY = 'dashboard-sidebar-collapsed'

type ShellProfile = {
  full_name: string | null
  avatar_url: string | null
  email: string | null
}

/**
 * The staff/employer dashboard chrome (sidebar + header + mobile drawer + bottom
 * nav). This is a pure presentational client island: role, profile and userId
 * are resolved server-side in the layout and passed in. It performs NO auth and
 * NO redirects — it just renders chrome and the live unread-message badge.
 */
export function SidebarShell({
  role,
  profile,
  userId,
  children,
}: {
  role: string
  profile: ShellProfile
  userId: string
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  const navigation = getDashboardNavigation(role)

  // Members get a distinct chrome: a warm coral-tinted sidebar with pill-style
  // active items (vs. the white-glass + left-accent look for employer/service).
  const isMember = role === 'user'
  // Employers get a bold, dark warm-brown "hiring command center" rail — clearly
  // distinct from the member's light coral rail and the admin AdminShell. Coral
  // active pills pop against the brown.
  const isEmployer = role === 'employer'
  // Service-team (RezzyMeUp fulfillment) get a warm-taupe "operator console" rail
  // with feather-red (accent) active pills — a fourth distinct identity.
  const isService = role === 'service_team'

  const sidebarAccent =
    role === 'admin' || role === 'super_admin'
      ? 'border-l-[3px] border-l-primary-500/25'
      : ''

  // Restore collapse preference.
  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem(SIDEBAR_STATE_KEY) === 'true')
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_STATE_KEY, next ? 'true' : 'false') } catch {}
      return next
    })
  }

  const headerSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = headerSearch.trim()
    if (q) router.push(`/job-board?q=${encodeURIComponent(q)}`)
  }

  const navIsActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  // Live unread message count (realtime). Re-counts on any message change and
  // when the tab regains focus after idle, so the badge stays correct.
  useEffect(() => {
    if (!userId) return
    let mounted = true

    const fetchUnreadCount = async () => {
      try {
        const { data: directConversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('conversation_id')
          .eq('user_id', userId)

        const conversationIds = [
          ...(directConversations?.map((c) => c.id) || []),
          ...(groupMembers?.map((gm) => gm.conversation_id) || []),
        ]
        if (conversationIds.length === 0) {
          if (mounted) setUnreadCount(0)
          return
        }

        const { data: messages } = await supabase
          .from('messages')
          .select('id, is_read, read_by, sender_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', userId)

        const count = (messages || []).filter((msg) => {
          const readBy = Array.isArray(msg.read_by) ? msg.read_by : []
          return !readBy.includes(userId)
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        if (mounted) fetchUnreadCount()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        if (mounted) fetchUnreadCount()
      })
      .subscribe()

    const onFocus = () => { if (mounted) fetchUnreadCount() }
    window.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      window.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [userId, supabase])

  // Close mobile drawer on navigation.
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

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

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Brand WebGL ambient — subtle coral/brown haze behind the glass chrome,
          shown to every user type. Fixed + low opacity so it never competes with
          content and stays cheap while scrolling. */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60" aria-hidden>
        <DashboardAmbient />
      </div>
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'relative z-40 hidden flex-col border-r shadow-sm backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex',
          isEmployer
            ? 'border-secondary-900/30 bg-gradient-to-b from-secondary-700 via-secondary-800 to-secondary-900'
            : isMember
              ? 'border-white/30 bg-primary-50/70'
              : isService
                ? 'border-secondary-200/70 bg-secondary-50/80'
                : 'border-white/30 bg-white/55',
          sidebarCollapsed ? 'w-[4.5rem]' : 'w-64',
          !isEmployer && sidebarAccent
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center gap-2 border-b px-3',
            isEmployer ? 'border-white/10' : 'border-white/25'
          )}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="min-w-0 flex-1">
                {isEmployer ? (
                  <span className="inline-flex rounded-lg bg-white px-2 py-1 shadow-sm">
                    <DashboardLogo href="/" priority />
                  </span>
                ) : (
                  <DashboardLogo href="/" priority />
                )}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'shrink-0 rounded-md p-1.5 transition-colors',
                  isEmployer
                    ? 'text-white/50 hover:bg-white/10 hover:text-white'
                    : 'text-text/50 hover:bg-background hover:text-text'
                )}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
              </button>
            </>
          ) : (
            // Collapsed: show only the logo; hovering the header reveals the
            // expand button (overlaid on the logo). The button stays
            // pointer-events-none until hover so the logo link works normally.
            <div className="group relative flex h-full w-full items-center justify-center">
              <div className="transition-opacity duration-200 group-hover:opacity-0">
                {isEmployer ? (
                  <span className="inline-flex rounded-lg bg-white p-1 shadow-sm">
                    <DashboardLogo href="/" compact priority />
                  </span>
                ) : (
                  <DashboardLogo href="/" compact priority />
                )}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-md opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
                  isEmployer
                    ? 'text-white/70 hover:bg-white/10 hover:text-white'
                    : 'text-text/60 hover:bg-background hover:text-text'
                )}
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>
          )}
        </div>

        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-4">
          {navigation.map((item, index) => {
            const Icon = item.icon
            const isActive = navIsActive(item.href)
            const prev = index > 0 ? navigation[index - 1] : undefined
            const label = navGroupLabel(item.group)
            const showSection =
              !!label && (index === 0 || item.group !== prev?.group)
            return (
              <Fragment key={`${item.href}-${item.name}`}>
                {!sidebarCollapsed && showSection && (
                  <div className="px-3 pb-1 pt-3 first:pt-0">
                    <p
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider',
                        isEmployer ? 'text-white/40' : 'text-text/45'
                      )}
                    >
                      {label}
                    </p>
                  </div>
                )}
                <Link
                  href={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200',
                    isEmployer
                      ? isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      : isMember
                        ? isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text/70 hover:bg-white/70 hover:text-text'
                        : isService
                          ? isActive
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-text/70 hover:bg-white/70 hover:text-text'
                          : isActive
                            ? 'rounded-md border-l-[3px] border-primary bg-primary/10 pl-[calc(0.75rem+3px)] text-primary -ml-[3px]'
                            : 'rounded-md border-l-[3px] border-transparent text-text/70 hover:bg-background hover:text-text'
                  )}
                >
                  <Icon
                    className={cn(
                      iconClass,
                      isActive
                        ? isMember || isEmployer || isService
                          ? 'text-white'
                          : 'text-primary'
                        : isEmployer
                          ? 'text-white/50 group-hover:text-white/80'
                          : 'text-text/45 group-hover:text-text/70'
                    )}
                  />
                  {!sidebarCollapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
                  {item.name === 'Messages' && unreadCount > 0 && (
                    <span
                      className={cn(
                        'flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white',
                        sidebarCollapsed ? 'absolute right-1 top-1' : 'ml-auto shrink-0'
                      )}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Fragment>
            )
          })}
        </nav>

        <div
          className={cn(
            'relative border-t p-3',
            isEmployer ? 'border-white/10' : 'border-border'
          )}
          ref={profileDropdownRef}
        >
          {!sidebarCollapsed ? (
            <button
              type="button"
              className={cn(
                'flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-colors',
                isEmployer ? 'hover:bg-white/10' : 'hover:bg-background'
              )}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className={cn('h-9 w-9 rounded-full border object-cover', isEmployer ? 'border-white/20' : 'border-border')} />
              ) : (
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full border', isEmployer ? 'border-white/20 bg-white/10' : 'border-border bg-background')}>
                  <UserRound className={cn('h-4 w-4 stroke-[1.5]', isEmployer ? 'text-white/70' : 'text-text/40')} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-semibold', isEmployer ? 'text-white' : 'text-text')}>{profile.full_name || 'Account'}</p>
                <p className={cn('truncate text-xs', isEmployer ? 'text-white/50' : 'text-text/50')}>{profile.email}</p>
              </div>
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isEmployer ? 'text-white/50' : 'text-text/40', profileMenuOpen && 'rotate-180')} />
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                'mx-auto flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                isEmployer ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-border bg-background hover:bg-background/80'
              )}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="Account menu"
            >
              <UserRound className={cn('h-5 w-5 stroke-[1.5]', isEmployer ? 'text-white/70' : 'text-text/50')} />
            </button>
          )}

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'absolute bottom-full z-50 mb-2 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg',
                  sidebarCollapsed ? 'left-1/2 w-48 -translate-x-1/2' : 'left-2 right-2'
                )}
              >
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-background" onClick={() => setProfileMenuOpen(false)}>
                  <UserRound className="h-4 w-4 stroke-[1.5]" /> Profile
                </Link>
                <Link href="/settings/plan" className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-background" onClick={() => setProfileMenuOpen(false)}>
                  <CreditCard className="h-4 w-4 stroke-[1.5]" /> Plan settings
                </Link>
                <Link href="/plans" className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-background" onClick={() => setProfileMenuOpen(false)}>
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
      <div className="relative z-10 flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
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
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto bg-background/70">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B6B' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative mx-auto w-full max-w-[1600px] p-4 pb-24 md:p-8 md:pb-8 lg:pb-8">
            {children}
          </div>
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
              className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm lg:hidden"
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
                    !!label && (index === 0 || item.group !== prev?.group)
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
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                          active
                            ? isService
                              ? 'bg-accent/10 text-accent'
                              : 'bg-primary/10 text-primary'
                            : 'text-text/70 hover:bg-background'
                        )}
                      >
                        <item.icon className={cn(iconClass, active ? (isService ? 'text-accent' : 'text-primary') : 'text-text/45')} />
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
              className={cn(
                'flex min-w-[3.5rem] flex-col items-center gap-0.5 py-1 transition-colors duration-200',
                isActive ? (isService ? 'text-accent' : 'text-primary') : 'text-text/45'
              )}
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
