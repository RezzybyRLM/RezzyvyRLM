'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, User, Menu, X, ShoppingCart, LogOut, Settings, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCartItemCount } from '@/lib/cart/actions'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial user session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        try {
          const count = await getCartItemCount()
          setCartCount(count)
          
          // Check if user is admin
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setIsAdmin(userData?.role === 'admin')
        } catch (error) {
          console.error('Failed to get cart count:', error)
        }
      } else {
        setIsAdmin(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const count = await getCartItemCount()
            setCartCount(count)
          } catch (error) {
            console.error('Failed to get cart count:', error)
          }
        } else {
          setCartCount(0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Close user menu when clicking outside
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
    await supabase.auth.signOut()
    setIsUserMenuOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/jobs?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/logo.png"
                  alt="Rezzy Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-2xl font-bold text-primary">Rezzy</div>';
                    }
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Spacer between logo and navigation */}
          <div className="w-4" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/resume-services"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Resume Services
            </Link>
            <Link
              href="/about-us"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact-us"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/cart"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Cart
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </form>
          </div>

          {/* Auth Buttons and User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              /* User Menu */
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user.email?.split('@')[0] || 'User'}</span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-gray-200 py-1 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4 mr-3" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In / Get Started */
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                </div>
              </form>

              {/* Mobile Links */}
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/resume-services"
                className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Resume Services
              </Link>
              <Link
                href="/about-us"
                className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/contact-us"
                className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </Link>

              {/* Mobile Cart */}
              <Link
                href="/cart"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Auth Buttons */}
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/auth/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
