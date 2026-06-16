'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Search, User, Menu, X, ShoppingCart, LogOut, Settings, Shield, Briefcase, LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCartItemCount } from '@/lib/cart/actions'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { signOut } from '@/lib/auth/signout'
import { canAccessAdminConsole, canManageRoles } from '@/lib/auth/permissions'

interface NavbarProps {
  user?: SupabaseUser | null
}

const NAV_LINKS = [
  { href: '/jobs', label: 'Find Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/resume-services', label: 'Resume Services' },
  { href: '/plans', label: 'Pricing' },
]

export function Navbar({ user: initialUser }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(initialUser || null)
  const [cartCount, setCartCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser)
    }

    const getUser = async () => {
      const currentUser = initialUser || (await supabase.auth.getUser()).data.user
      if (!initialUser && currentUser) {
        setUser(currentUser)
      }

      if (currentUser) {
        try {
          const count = await getCartItemCount()
          setCartCount(count)

          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single()

          setIsAdmin(canAccessAdminConsole(userData?.role))
          setIsSuperAdmin(canManageRoles(userData?.role))
        } catch (error) {
          console.error('Failed to get cart count:', error)
        }
      } else {
        setIsAdmin(false)
        setIsSuperAdmin(false)
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
            setIsAdmin(canAccessAdminConsole(userData?.role))
            setIsSuperAdmin(canManageRoles(userData?.role))
          } catch (error) {
            console.error('Failed to get cart count:', error)
          }
        } else {
          setCartCount(0)
          setIsAdmin(false)
          setIsSuperAdmin(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

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
      window.location.href = `/jobs?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 group" aria-label="Rezzy home">
            <span className="relative w-11 h-11 transition-transform duration-300 group-hover:scale-105">
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card-hover border border-border py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400" />
                      Dashboard
                    </Link>
                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      Profile
                    </Link>
                    <Link href="/applications" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                      <Briefcase className="h-4 w-4 mr-3 text-gray-400" />
                      My Applications
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                        <Shield className="h-4 w-4 mr-3 text-gray-400" />
                        Admin Panel
                      </Link>
                    )}
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
                  <Link href="/dashboard" className="block px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  <Link href="/profile" className="block px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                  <Link href="/applications" className="block px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>My Applications</Link>
                  {isAdmin && (
                    <Link href="/admin" className="block px-3 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
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
