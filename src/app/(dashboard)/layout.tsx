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
  User,
  FileText,
  Bookmark,
  Bell,
  Mic,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MessageSquare,
  Home
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/signout'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
  { name: 'Profile', href: '/profile', icon: User },
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
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Timeout to show page after initial load period
  useEffect(() => {
    const timeout = setTimeout(() => {
      setInitialLoad(false)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [])

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
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          setInitialLoad(false)

          const { data: profile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', session.user.id)
            .single()

          if (profile && mounted) {
            setUserProfile(profile as any)
          }
        } else {
          setInitialLoad(false)
        }
      } catch (error) {
        console.error('Error:', error)
        if (mounted) setInitialLoad(false)
      }
    }

    initializeUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        router.push('/auth/login')
      } else if (session?.user) {
        setUser(session.user)
        setInitialLoad(false)
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
  }, [router, supabase])

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
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
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
          <p className="text-gray-500 font-medium tracking-tight">Loading Rezzy</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo & Search */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/" className="transition-transform active:scale-95">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={90}
                height={28}
                className="object-contain"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center bg-[#EDF3F8] rounded px-3 py-1.5 w-64 group focus-within:w-72 transition-all border-transparent border focus-within:border-primary/30">
              <Menu className="w-4 h-4 text-gray-600 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent border-none outline-none text-sm placeholder:text-gray-600 w-full"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center h-full">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[80px] h-full px-2 transition-colors relative group ${isActive ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                >
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                    {item.name === 'Messages' && unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 border-2 border-white"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                  <span className="text-xs mt-1 font-normal">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-gray-200 transition-colors" />
                  )}
                </Link>
              )
            })}

            {/* Profile Dropdown */}
            <div className="relative h-full flex items-center ml-4 pl-4 border-l border-gray-100" ref={profileDropdownRef}>
              <motion.button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex flex-col items-center justify-center transition-colors group text-gray-500 hover:text-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt="Me"
                    className="w-6 h-6 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="flex items-center gap-0.5 mt-1">
                  <span className="text-xs">Me</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </motion.button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-14 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-3 z-50 origin-top-right"
                  >
                    <div className="px-4 pb-3 border-b border-gray-100 mb-2">
                      <div className="flex gap-2">
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-6 h-6 text-gray-400" /></div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <h3 className="text-sm font-semibold truncate">{userProfile?.full_name || 'User'}</h3>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="mt-3 block text-center w-full py-1 text-sm font-semibold text-primary border border-primary rounded-full hover:bg-primary/5 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          signOut('/auth/login')
                          setProfileMenuOpen(false)
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navigation.map((item, idx) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                        {item.name === 'Messages' && unreadCount > 0 && (
                          <span className="ml-auto bg-red-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <button
                    onClick={() => signOut('/auth/login')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 py-6"
      >
        <PageLoader>
          {children}
        </PageLoader>
      </motion.main>

      {/* Bottom Nav for Mobile (Optional but good for premium feel) */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 px-4 h-16 flex items-center justify-around z-50 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-black' : 'text-gray-500'}`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                {item.name === 'Messages' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

