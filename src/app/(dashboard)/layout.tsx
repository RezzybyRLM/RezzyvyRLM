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
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let userLoaded = false
    
    const getUser = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && !userLoaded) {
            console.error('User fetch timeout - redirecting to login')
            router.push('/auth/login')
          }
        }, 10000) // 10 second timeout

        // Get session first to ensure cookies are synced
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          return
        }
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            if (timeoutId) clearTimeout(timeoutId)
            router.push('/auth/login')
          }
          return
        }
        
        const currentUser = session?.user
        if (!currentUser) {
          // Try to get user directly as fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (!mounted) {
            if (timeoutId) clearTimeout(timeoutId)
            return
          }

          if (userError || !user) {
            console.error('User not found:', userError)
            if (mounted) {
              if (timeoutId) clearTimeout(timeoutId)
              router.push('/auth/login')
            }
            return
          }

          if (mounted) {
            if (timeoutId) clearTimeout(timeoutId)
            userLoaded = true
            setUser(user)
            // Fetch user profile data
            const { data: profile } = await supabase
              .from('users')
              .select('full_name, avatar_url')
              .eq('id', user.id)
              .single()
            
            if (profile && mounted) {
              setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
            }
          }
          return
        }

        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          userLoaded = true
          setUser(currentUser)
          // Fetch user profile data
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', currentUser.id)
            .single()
          
          if (profile && mounted) {
            setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          router.push('/auth/login')
        }
      }
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      } else if (session?.user && mounted) {
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

  if (!user) {
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
