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
  Rss
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Feed', href: '/feed', icon: Rss },
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
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarCollapsed))
    }
  }, [sidebarCollapsed])

  // Timeout to show page after initial load period (even if user state not loaded)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setInitialLoad(false)
    }, 3000) // Show page after 3 seconds max, even if user state not loaded
    
    return () => clearTimeout(timeout)
  }, [])

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
          ;(async () => {
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
          ;(async () => {
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
          // No user found - middleware will handle redirect
          setInitialLoad(false)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
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

  // Show loading only during initial load
  // After initial load, trust middleware - if we're here, user is authenticated
  // The middleware already verified authentication, so show the page even if user state hasn't loaded yet
  if (initialLoad && !user) {
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
    <PageLoader>
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
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative z-10 ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0 pointer-events-none" />
                  <span className="truncate pointer-events-none">{item.name}</span>
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
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
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
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative z-10 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'} transition-all pointer-events-none`} />
                  {!sidebarCollapsed && <span className="truncate whitespace-nowrap pointer-events-none">{item.name}</span>}
                </Link>
              )
            })}
          </nav>
          <div className="border-t px-2 py-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-all z-10 relative ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
              title={sidebarCollapsed ? 'Sign Out' : ''}
              type="button"
            >
              <LogOut className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'} pointer-events-none`} />
              {!sidebarCollapsed && <span className="truncate whitespace-nowrap pointer-events-none">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Desktop header */}
        <div className="hidden lg:flex h-16 items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden xl:block">
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden xl:block" />
              </button>
              
              {/* Dropdown menu */}
              {profileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
          {children}
        </main>
      </div>
    </div>
    </PageLoader>
  )
}
