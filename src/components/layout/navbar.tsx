'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Search, Menu, X, ShoppingCart, LogOut, Settings, Briefcase } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCartItemCount } from '@/lib/cart/actions'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { signOut } from '@/lib/auth/signout'
import { canManageRoles } from '@/lib/auth/permissions'
import { getDashboardNavigation } from '@/lib/dashboard/navigation'

interface NavbarProps {
  user?: SupabaseUser | null
  /** Role resolved server-side so the account menu (e.g. the Admin console link)
   *  is correct on first paint without waiting on a client query. */
  role?: string | null
}

const NAV_LINKS = [
  { href: '/job-board', label: 'Find Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/services', label: 'Services' },
  { href: '/plans', label: 'Pricing' },
]

export function Navbar({ user: initialUser, role: initialRole = null }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(initialUser || null)
  const [cartCount, setCartCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(canManageRoles(initialRole))
  const [role, setRole] = useState<string | null>(initialRole)
  const [scrolled, setScrolled] = useState(false)

  // Compress + frost the navbar once the user scrolls past the hero fold.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const supabase = createClient()

  useEffect(() => {
    // Keep state in sync with the server-resolved props across navigations.
    setUser(initialUser ?? null)
    if (initialRole !== null) {
      setRole(initialRole)
      setIsSuperAdmin(canManageRoles(initialRole))
    }

    const getUser = async () => {
      // getSession() reads the proxy-refreshed cookie instantly — NEVER getUser()
      // here (it can hang when returning to a tab after inactivity).
      const currentUser = initialUser || (await supabase.auth.getSession()).data.session?.user || null
      if (!initialUser && currentUser) {
        setUser(currentUser)
      }

      if (currentUser) {
        try {
          const count = await getCartItemCount()
          setCartCount(count)

          // Only query the role if the server didn't already provide it.
          if (initialRole === null) {
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('id', currentUser.id)
              .single()
            setIsSuperAdmin(canManageRoles(userData?.role))
            setRole(userData?.role ?? 'user')
          }
        } catch (error) {
          console.error('Failed to get cart count:', error)
        }
      } else if (initialRole === null) {
        setIsSuperAdmin(false)
        setRole(null)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const count = await getCartItemCount()
            setCartCount(count)
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single()
            setIsSuperAdmin(canManageRoles(userData?.role))
            setRole(userData?.role ?? 'user')
          } catch (error) {
            console.error('Failed to get cart count:', error)
          }
        } else {
          setCartCount(0)
          setIsSuperAdmin(false)
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, initialUser, initialRole])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const target = event.target as Element
        if (!target.closest('[data-user-menu]')) {
          setIsUserMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  const handleSignOut = async () => {
    setIsUserMenuOpen(false)
    await signOut('/auth/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/job-board?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  // Full member navigation for logged-in users (Dashboard, Profile, Jobs,
  // Messages, Resume Manager, Bookmarks, Job Alerts, Interview Pro, plus
  // role-specific items). Regular members rely on this menu instead of a
  // sidebar, so it must expose every member destination.
  const memberNav = getDashboardNavigation(role)

  return (
    <nav
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ease-expo ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-md border-b border-border'
          : 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between gap-3 transition-[height] duration-300 ease-expo ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 group" aria-label="Rezzy home">
            <span className={`relative transition-all duration-300 group-hover:scale-105 ${scrolled ? 'w-9 h-9' : 'w-11 h-11'}`}>
              <Image
                src="/logo.png"
                alt="Rezzy"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search jobs, companies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border border-transparent text-sm text-gray-900 placeholder:text-xs placeholder:text-gray-400 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-colors"
              />
            </div>
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-semibold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate hidden lg:inline">
                    {user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-card-hover border border-border py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {memberNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4 mr-3 text-gray-400" />
                        {item.name}
                      </Link>
                    ))}
                    <Link href="/applications" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                      <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                      My Applications
                    </Link>
                    {isSuperAdmin && (
                      <Link href="/admin/roles" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        Role management
                      </Link>
                    )}
                    <hr className="my-1 border-border" />
                    <button onClick={handleSignOut} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-1 md:hidden">
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 rounded-full" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search jobs, companies…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-full bg-gray-100 text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
            </form>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-base font-medium text-gray-800 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-border space-y-1">
              {user ? (
                <>
                  {memberNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 text-gray-400" />
                      {item.name}
                    </Link>
                  ))}
                  <Link href="/applications" className="flex items-center gap-3 px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    My Applications
                  </Link>
                  {isSuperAdmin && (
                    <Link href="/admin/roles" className="block px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Role management</Link>
                  )}
                  <button onClick={() => { handleSignOut(); setIsMenuOpen(false) }} className="block w-full text-left px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg">Sign Out</button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-1 pt-1">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
