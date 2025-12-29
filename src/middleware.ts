import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
          
          // Set cookies with 14-day expiration (1,209,600 seconds)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 14, // 14 days in seconds
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/',
            })
          })
        },
      },
    }
  )

  // Refresh session to ensure it persists across page reloads
  // Use getSession first (faster, reads from cookies)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  let user = session?.user || null
  
  // Only call getUser if no session found (fallback)
  if (!user) {
    const {
      data: { user: userData },
    } = await supabase.auth.getUser()
    user = userData
  }

  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/resume-manager',
    '/bookmarks',
    '/job-alerts',
    '/interview-pro',
    '/employer',
    '/cart',
    '/applications',
    '/profiles',
    '/messages',
    '/feed',
    '/jobs',
  ]

  // Auth routes (redirect to onboarding/dashboard if logged in)
  const authRoutes = ['/auth/login', '/auth/register']

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check onboarding status (only once per request, reuse for both checks)
  let onboardingCompleted: boolean | null = null
  if (user && (isAuthRoute || (isProtectedRoute && !pathname.startsWith('/onboarding')))) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      onboardingCompleted = userData?.onboarding_completed ?? false
    } catch (error) {
      // If error checking onboarding, default to false (redirect to onboarding)
      console.error('Error checking onboarding status:', error)
      onboardingCompleted = false
    }
  }

  if (isAuthRoute && user) {
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check onboarding status for protected routes
  if (isProtectedRoute && user && !pathname.startsWith('/onboarding')) {
    if (onboardingCompleted === false) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    // If onboardingCompleted is null (error case), allow access (don't block)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

