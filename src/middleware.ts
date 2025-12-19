import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/cart', 
    '/dashboard',
    '/profile', 
    '/resume-manager', 
    '/bookmarks', 
    '/job-alerts', 
    '/interview-pro',
    '/employer'
  ]
  
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
  
  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
  
  // Use createServerClient for middleware to properly handle cookies
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })
  
  // Get user - this will refresh the session if needed
  // This must be called on every request to ensure the session remains active
  const { data: { user }, error } = await supabase.auth.getUser()

  // Always refresh session for protected routes
  if (isProtectedRoute || isAdminRoute) {
    
    if (error || !user) {
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

    // Check onboarding status for protected routes (except onboarding itself and employer routes)
    if (isProtectedRoute && !pathname.startsWith('/onboarding') && !pathname.startsWith('/employer') && !pathname.startsWith('/auth')) {
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('onboarding_completed, onboarding_step')
        .eq('id', user.id)
        .single()
      
      // If onboarding not completed, redirect to onboarding
      if (userData && !userDataError) {
        const userDataTyped = userData as { onboarding_completed: boolean | null; onboarding_step: number | null }
        if (!userDataTyped.onboarding_completed) {
          const onboardingUrl = new URL('/onboarding', request.url)
          onboardingUrl.searchParams.set('redirectTo', pathname)
          return NextResponse.redirect(onboardingUrl)
        }
      }
    }
  }
  
  return response
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
