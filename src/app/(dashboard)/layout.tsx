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

const navigation = [
  { name: 'Home', href: '/feed', icon: Home },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_STATE_KEY) === 'true'
    }
    return false
  })
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true) // Track if we're still doing initial load
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarCollapsed))
    }
  }, [sidebarCollapsed])

  // Timeout to show page after initial load period - trust middleware if we're here
  useEffect(() => {
    const timeout = setTimeout(() => {
      setInitialLoad(false)
    }, 1000) // Reduced to 1 second - middleware already verified auth

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

        // Get all conversations user is part of (including group chats)
        const { data: directConversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)

        // Get group conversations user is part of
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('conversation_id')
          .eq('user_id', currentUser.id)

        // Combine conversation IDs
        const conversationIds = [
          ...(directConversations?.map(c => c.id) || []),
          ...(groupMembers?.map(gm => gm.conversation_id) || [])
        ]

        if (conversationIds.length === 0) {
          if (mounted) setUnreadCount(0)
          return
        }

        // Get all messages in user's conversations that are not from the user
        const { data: messages } = await supabase
          .from('messages')
          .select('id, is_read, read_by, sender_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', currentUser.id)

        if (!messages) {
          if (mounted) setUnreadCount(0)
          return
        }

        // Count messages that are unread by this user
        // A message is unread if:
        // 1. is_read is false AND user is not in read_by array, OR
        // 2. is_read is true but user is not in read_by array (for backwards compatibility)
        const unreadCount = messages.filter(msg => {
          const readBy = Array.isArray(msg.read_by) ? msg.read_by : []
          const userHasRead = readBy.includes(currentUser.id)
          // Message is unread if user hasn't read it (not in read_by array)
          return !userHasRead
        }).length

        if (mounted) {
          console.log('📊 Unread count updated:', unreadCount)
          setUnreadCount(unreadCount)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
        if (mounted) setUnreadCount(0)
      }
    }

    fetchUnreadCount()

    // Set up realtime subscription for unread count
    // Listen to INSERT (new messages) and UPDATE (read status changes) events
    const channel = supabase
      .channel('unread_count_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        console.log('📨 New message inserted, updating unread count')
        if (mounted) fetchUnreadCount()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        // Only update if read_by or is_read changed
        const oldReadBy = Array.isArray(payload.old?.read_by) ? payload.old.read_by : []
        const newReadBy = Array.isArray(payload.new?.read_by) ? payload.new.read_by : []
        const readStatusChanged = payload.old?.is_read !== payload.new?.is_read ||
          JSON.stringify(oldReadBy) !== JSON.stringify(newReadBy)

        if (readStatusChanged) {
          console.log('👁️ Message read status changed, updating unread count')
          if (mounted) fetchUnreadCount()
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Unread count realtime subscription active')
        }
      })

    // Refresh every 30 seconds as backup
    const interval = setInterval(() => {
      if (mounted) fetchUnreadCount()
    }, 30000)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user, supabase])

  useEffect(() => {
    let mounted = true

    // Initialize user from session
    const initializeUser = async () => {
      try {
        // Get session first - this reads from cookies set by middleware
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user && !sessionError) {
          setUser(session.user)
          setInitialLoad(false)

            // Fetch user profile in background
            ; (async () => {
              try {
                const { data: profile } = await supabase
                  .from('users')
                  .select('full_name, avatar_url')
                  .eq('id', session.user.id)
                  .single()

                if (profile && mounted) {
                  setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
                }
              } catch {
                // Non-critical error, continue without profile
              }
            })()
          return
        }

        // If no session, try getUser as fallback
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (!mounted) return

        if (user && !userError) {
          setUser(user)
          setInitialLoad(false)

            // Fetch user profile in background
            ; (async () => {
              try {
                const { data: profile } = await supabase
                  .from('users')
                  .select('full_name, avatar_url')
                  .eq('id', user.id)
                  .single()

                if (profile && mounted) {
                  setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
                }
              } catch {
                // Non-critical error, continue without profile
              }
            })()
        } else {
          // No user found - but middleware already verified, so show page anyway
          // Middleware will handle redirect if truly unauthenticated
          setInitialLoad(false)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
        // Even on error, show the page - middleware already verified auth
        if (mounted) {
          setInitialLoad(false)
        }
      }
    }

    initializeUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          setInitialLoad(false)

          // Fetch user profile
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', session.user.id)
            .single()

          if (profile && mounted) {
            setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [profileMenuOpen])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect even if there's an error
      router.push('/auth/login')
    }
  }

  // Show loading only during very brief initial load
  // Trust middleware - if we're here, user is authenticated
  // The middleware already verified authentication, so show the page quickly
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={100}
                height={32}
                className="object-contain"
              />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative z-10 ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0 pointer-events-none" />
                  <span className="truncate pointer-events-none flex-1">{item.name}</span>
                  {item.name === 'Messages' && unreadCount > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
                      {unreadCount > 999 ? '999+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="border-t px-4 py-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-red-600 hover:text-red-700 relative z-10"
              type="button"
            >
              <LogOut className="mr-3 h-5 w-5 pointer-events-none" />
              <span className="pointer-events-none">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-50 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 relative">
          <div className="flex h-16 items-center px-4 justify-between relative">
            {!sidebarCollapsed ? (
              <Link href="/" className="flex items-center flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Rezzy Logo"
                  width={100}
                  height={32}
                  className="object-contain"
                  priority
                />
              </Link>
            ) : (
              <Link href="/" className="flex items-center justify-center w-full flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Rezzy Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 h-6 w-6 rounded-full p-0"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative cursor-pointer ${isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <div className="relative">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'} transition-all`} />
                    {item.name === 'Messages' && unreadCount > 0 && (
                      <span className={`absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ${sidebarCollapsed ? '' : '-right-0.5'}`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="truncate whitespace-nowrap flex-1 flex items-center">
                      {item.name}
                      {item.name === 'Messages' && unreadCount > 0 && (
                        <span className="ml-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {unreadCount > 999 ? '999+' : unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="border-t px-2 py-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
              title={sidebarCollapsed ? 'Sign Out' : ''}
              type="button"
            >
              <LogOut className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              {!sidebarCollapsed && <span className="truncate whitespace-nowrap">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 relative z-0 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Desktop header */}
        <div className="hidden lg:flex h-16 items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* Profile dropdown */}
            <div className="relative z-50" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setProfileMenuOpen(!profileMenuOpen)
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors relative z-50"
              >
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden xl:block pointer-events-none">
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden xl:block pointer-events-none" />
              </button>

              {/* Dropdown menu */}
              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation()
                      setProfileMenuOpen(false)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                  />
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href="/profile"
                      onClick={(e) => {
                        e.stopPropagation()
                        setProfileMenuOpen(false)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSignOut()
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex h-16 items-center justify-between px-4 bg-white border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Rezzy Logo"
              width={80}
              height={26}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-2">
            {/* Profile picture and sign out on mobile */}
            {userProfile?.avatar_url ? (
              <Link href="/profile">
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>
            ) : (
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <PageLoader>
            {children}
          </PageLoader>
        </main>
      </div>
    </div>
  )
}
