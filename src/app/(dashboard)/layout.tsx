'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Resume Manager', href: '/resume-manager', icon: FileText },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'Job Alerts', href: '/job-alerts', icon: Bell },
  { name: 'Interview Pro', href: '/interview-pro', icon: Mic },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true) // Track if we're still doing initial load
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let userLoaded = false
    
    // Helper to check if Supabase auth cookies exist
    // Supabase SSR uses cookies like: sb-<project-ref>-auth-token
    const hasAuthCookies = () => {
      if (typeof document === 'undefined') return false
      const cookies = document.cookie
      if (!cookies) return false
      
      // Check for Supabase auth cookies
      // Pattern: sb-<project>-auth-token or similar
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      if (supabaseUrl) {
        try {
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || ''
          if (projectRef) {
            // Look for cookies with the project ref
            return cookies.includes(`sb-${projectRef}`) || 
                   cookies.includes('sb-') ||
                   cookies.includes('supabase')
          }
        } catch (e) {
          // Fallback to simple check
        }
      }
      
      // Fallback: check for any sb- cookie
      return cookies.includes('sb-')
    }
    
    // Wait for cookies to be available (middleware sets them on refresh)
    const waitForCookies = async (maxWait = 2000) => {
      const start = Date.now()
      while (!hasAuthCookies() && (Date.now() - start) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const getUser = async (retryCount = 0) => {
      try {
        // Wait for cookies to sync after page load (middleware sets them)
        // Shorter wait since getSession() is fast and reads from cookies
        if (retryCount === 0) {
          await waitForCookies(1000) // Wait up to 1 second for cookies
        } else {
          // On retry, wait a bit longer
          await new Promise(resolve => setTimeout(resolve, 300 + (retryCount * 200)))
        }
        
        // Set a timeout to prevent infinite loading
        // DON'T redirect on timeout - just log it and keep trying
        // The middleware will handle redirects if user is truly not authenticated
        timeoutId = setTimeout(() => {
          if (mounted && !userLoaded) {
            console.warn('User fetch taking longer than expected, but continuing...')
            console.warn('Debug info:', {
              hasCookies: hasAuthCookies(),
              cookies: typeof document !== 'undefined' ? document.cookie.substring(0, 200) : 'N/A',
              retryCount,
              timestamp: new Date().toISOString()
            })
            // Don't redirect - let middleware handle it or keep trying
            // router.push('/auth/login') // REMOVED - don't redirect on timeout
          }
        }, 10000) // Increased to 10 seconds - give it more time

        // Try getSession first (faster, reads from cookies directly)
        // This is more reliable on page refresh when middleware just set cookies
        const sessionStart = Date.now()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        const sessionTime = Date.now() - sessionStart
        
        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          return
        }
        
        // If we have a session, use it immediately
        if (session?.user && !sessionError) {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          userLoaded = true
          if (mounted) {
            console.log('User loaded from session:', { 
              userId: session.user.id, 
              sessionTime: `${sessionTime}ms`,
              hasCookies: hasAuthCookies()
            })
            setUser(session.user)
            setInitialLoad(false) // Mark initial load as complete
            // Fetch user profile data (don't await, load in background)
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
              } catch (err) {
                console.warn('Failed to fetch user profile:', err)
                // Non-critical, continue without profile
              }
            })()
          }
          return
        }
        
        // Log if session failed
        if (sessionError) {
          console.warn('getSession failed:', {
            error: sessionError.message,
            hasCookies: hasAuthCookies(),
            retryCount
          })
        }
        
        // If no session, try getUser as fallback (validates JWT)
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
        
        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          return
        }
        
        if (userError) {
          // If it's a JWT/token error and we haven't retried much, try again
          const isTokenError = userError.message.includes('JWT') || 
                              userError.message.includes('token') ||
                              userError.message.includes('expired') ||
                              userError.status === 401
          
          if (isTokenError && retryCount < 3) {
            console.warn(`Token error (attempt ${retryCount + 1}/4):`, userError.message)
            if (timeoutId) clearTimeout(timeoutId)
            // Wait a bit longer before retry
            await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 300)))
            return getUser(retryCount + 1)
          }
          
          console.error('Auth error after retries:', {
            message: userError.message,
            status: userError.status,
            name: userError.name,
            hasCookies: hasAuthCookies(),
            retryCount
          })
          
          // Final attempt: check if cookies exist but auth failed
          if (hasAuthCookies() && retryCount < 2) {
            console.warn('Cookies exist but auth failed, retrying once more...')
            if (timeoutId) clearTimeout(timeoutId)
            await new Promise(resolve => setTimeout(resolve, 1000))
            return getUser(retryCount + 1)
          }
          
          // Only redirect if we're absolutely sure there's no valid session
          // Check one more time with getSession before redirecting
          const { data: { session: finalSession } } = await supabase.auth.getSession()
          if (!finalSession?.user && mounted) {
            if (timeoutId) clearTimeout(timeoutId)
            console.error('No valid session found after all retries, redirecting to login')
            router.push('/auth/login')
          } else if (finalSession?.user && mounted) {
            // We found a session! Use it
            if (timeoutId) {
              clearTimeout(timeoutId)
              timeoutId = null
            }
            userLoaded = true
            setInitialLoad(false)
            setUser(finalSession.user)
            // Fetch profile in background
            ;(async () => {
              try {
                const { data: profile } = await supabase
                  .from('users')
                  .select('full_name, avatar_url')
                  .eq('id', finalSession.user.id)
                  .single()
                
                if (profile && mounted) {
                  setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
                }
              } catch (err) {
                console.warn('Failed to fetch user profile:', err)
              }
            })()
          }
          return
        }

        if (!userData) {
          // Retry if no user found - might be a timing issue
          if (retryCount < 2) {
            console.warn('No user found, retrying...', { retryCount })
            if (timeoutId) clearTimeout(timeoutId)
            await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 300)))
            return getUser(retryCount + 1)
          }
          
          // Last attempt: try getSession one more time
          const { data: { session: lastSession } } = await supabase.auth.getSession()
          if (lastSession?.user && mounted) {
            if (timeoutId) {
              clearTimeout(timeoutId)
              timeoutId = null
            }
            userLoaded = true
            setInitialLoad(false)
            setUser(lastSession.user)
            // Fetch profile in background
            ;(async () => {
              try {
                const { data: profile } = await supabase
                  .from('users')
                  .select('full_name, avatar_url')
                  .eq('id', lastSession.user.id)
                  .single()
                
                if (profile && mounted) {
                  setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
                }
              } catch (err) {
                console.warn('Failed to fetch user profile:', err)
              }
            })()
            return
          }
          
          console.error('No user found after all retries')
          // Only redirect if middleware hasn't already (middleware will handle it)
          // Don't redirect here - let the middleware handle authentication
          if (mounted) {
            if (timeoutId) clearTimeout(timeoutId)
            // Don't redirect - middleware will handle it if needed
            // router.push('/auth/login')
          }
          return
        }

        if (mounted) {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          userLoaded = true
          setInitialLoad(false) // Mark initial load as complete
          console.log('User loaded from getUser:', { 
            userId: userData.id,
            retryCount
          })
          setUser(userData)
          // Fetch user profile data (don't await, load in background)
          ;(async () => {
            try {
              const { data: profile } = await supabase
                .from('users')
                .select('full_name, avatar_url')
                .eq('id', userData.id)
                .single()
              
              if (profile && mounted) {
                setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
              }
            } catch (err) {
              console.warn('Failed to fetch user profile:', err)
              // Non-critical, continue without profile
            }
          })()
        }
      } catch (error) {
        console.error('Error getting user:', error)
        // Retry on network errors
        if (retryCount < 3 && error instanceof Error && (
          error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('Failed to fetch')
        )) {
          console.warn(`Network error, retrying (attempt ${retryCount + 1}/4)...`)
          if (timeoutId) clearTimeout(timeoutId)
          await new Promise(resolve => setTimeout(resolve, 500 + (retryCount * 300)))
          return getUser(retryCount + 1)
        }
        
        // Last attempt: try getSession
        try {
          const { data: { session: errorSession } } = await supabase.auth.getSession()
          if (errorSession?.user && mounted) {
            if (timeoutId) {
              clearTimeout(timeoutId)
              timeoutId = null
            }
            userLoaded = true
            setInitialLoad(false)
            setUser(errorSession.user)
            // Fetch profile in background
            ;(async () => {
              try {
                const { data: profile } = await supabase
                  .from('users')
                  .select('full_name, avatar_url')
                  .eq('id', errorSession.user.id)
                  .single()
                
                if (profile && mounted) {
                  setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
                }
              } catch (err) {
                console.warn('Failed to fetch user profile:', err)
              }
            })()
            return
          }
        } catch (sessionErr) {
          console.error('Failed to get session in error handler:', sessionErr)
        }
        
        // Don't redirect on error - let middleware handle authentication
        // The middleware will redirect if user is truly not authenticated
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          // Don't redirect - middleware handles it
          // router.push('/auth/login')
        }
      }
    }

    getUser()

    // Listen for auth state changes - this fires when cookies sync
    // This is crucial for handling page refreshes where middleware sets cookies
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      // Clear any existing timeout since we got an auth event
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      if (event === 'SIGNED_OUT') {
        userLoaded = false
        router.push('/auth/login')
      } else if (session?.user && mounted && !userLoaded) {
        // Only update if we haven't loaded the user yet
        // This prevents unnecessary updates after initial load
        userLoaded = true
        setInitialLoad(false)
        setUser(session.user)
        // Fetch user profile data
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single()
        
        if (profile && mounted) {
          setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user && mounted) {
        // Update user on token refresh
        setInitialLoad(false)
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
  
  // After a reasonable time, show the page anyway (middleware verified auth)
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (initialLoad) {
        setInitialLoad(false)
      }
    }, 3000) // Show page after 3 seconds max, even if user state not loaded
    
    return () => clearTimeout(timeout)
  }, [])

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
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t px-4 py-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-red-600 hover:text-red-700"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={100}
                height={32}
                className="object-contain"
              />
            </Link>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t px-4 py-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-red-600 hover:text-red-700"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
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
  )
}
