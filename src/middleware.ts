import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protected routes that require authentication
  const protectedRoutes = ['/cart', '/profile', '/dashboard']
  
  // Admin routes that require admin role
  const adminRoutes = ['/admin']
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (isProtectedRoute || isAdminRoute) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // For admin routes, check if user has admin role
    if (isAdminRoute) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!userData || (userData as any).role !== 'admin') {
        // Redirect non-admin users to home page
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
