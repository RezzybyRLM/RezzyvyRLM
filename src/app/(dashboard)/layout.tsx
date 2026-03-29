'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/page-loader'
import {
  User as UserIcon,
  FileText,
  Bookmark,
  Bell,
  Mic,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MessageSquare,
  Home,
  Search,
  LayoutDashboard
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/signout'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '@supabase/supabase-js'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Resume Manager', href: '/resume-manager', icon: FileText },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'Job Alerts', href: '/job-alerts', icon: Bell },
  { name: 'Interview Pro', href: '/interview-pro', icon: Mic },
]

// Store sidebar state in localStorage for persistence
const SIDEBAR_STATE_KEY = 'dashboard-sidebar-collapsed'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Load sidebar state
  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_STATE_KEY) === 'true'
    setSidebarCollapsed(collapsed)
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState))
  }

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
    const initializeUser = async () => {
      try {
        let authUser: User | null = null
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            authUser = session.user
            break
          }
          const { data: { user: validated } } = await supabase.auth.getUser()
          if (validated) {
            authUser = validated
            break
          }
          await new Promise((r) => setTimeout(r, 80))
        }

        if (!mounted) return

        if (authUser) {
          setUser(authUser)

          const { data: profile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .single()

          if (profile && mounted) {
            setUserProfile(profile as any)
          }
        } else {
          const redirect = encodeURIComponent(pathname || '/dashboard')
          router.replace(`/auth/login?redirectTo=${redirect}`)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        if (mounted) setInitialLoad(false)
      }
    }

    initializeUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        router.replace('/auth/login')
      } else if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single()
        if (profile && mounted) setUserProfile(profile as any)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase, pathname])

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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-500">
          <div className="relative mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 animate-pulse"></div>
            <Image
              src="/logo.png"
              alt="Rezzy Logo"
              width={120}
              height={40}
              className="object-contain animate-bounce transition-all"
              priority
            />
          </div>
          <p className="text-gray-400 font-medium tracking-tight">Accessing Rezzy Dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0F172A] text-gray-300 transition-all duration-300 ease-in-out z-40 border-r border-white/5 relative shadow-2xl ${sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/" className={`flex items-center gap-2 transition-all ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            <Image
              src="/logo.png"
              alt="Rezzy Logo"
              width={80}
              height={24}
              className="object-contain brightness-0 invert"
              priority
            />
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-thin scrollbar-white/10">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group h-11 ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white transition-colors'}`} />
                </div>
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden">
                    {item.name}
                  </span>
                )}
                {item.name === 'Messages' && unreadCount > 0 && (
                  <span className={`static ml-auto flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 ${sidebarCollapsed ? 'absolute top-1 right-1' : ''}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {/* Tooltip for collapsed sidebar */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} className="w-9 h-9 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{userProfile?.full_name || 'User'}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-white transition-all ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <button
              className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto hover:bg-white/10 transition-colors"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <UserIcon className="w-6 h-6 text-gray-400" />
            </button>
          )}

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute bottom-full left-0 right-0 mb-4 mx-2 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden ${sidebarCollapsed ? 'w-48 -right-40' : ''}`}
              >
                <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                  <UserIcon className="w-4 h-4" /> View Profile
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => signOut('/auth/login')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="capitalize">{pathname.split('/')[1] || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1.5 w-72 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all group">
              <Search className="w-4 h-4 text-gray-400 mr-2 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm placeholder:text-gray-400 w-full text-gray-900"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 relative hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </motion.button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] scrollbar-thin scrollbar-gray-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 md:p-8 max-w-[1600px] mx-auto w-full"
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0F172A] z-[60] lg:hidden flex flex-col"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                <Image src="/logo.png" alt="Rezzy" width={100} height={32} className="brightness-0 invert" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-6 border-t border-white/5">
                <button
                  onClick={() => signOut('/auth/login')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 h-16 flex items-center justify-around px-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                {item.name === 'Messages' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">{item.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

