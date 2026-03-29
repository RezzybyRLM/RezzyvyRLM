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

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 14,
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const protectedRoutes = [
    '/onboarding',
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
    '/admin',
  ]

  const authRoutes = ['/auth/login', '/auth/register']

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let onboardingCompleted: boolean | null = null
  let appRole: string | null = null

  if (user && (isAuthRoute || (isProtectedRoute && !pathname.startsWith('/onboarding')))) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .single()

      onboardingCompleted = userData?.onboarding_completed ?? false
      appRole = userData?.role ?? 'user'
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      onboardingCompleted = false
      appRole = 'user'
    }
  }

  if (isAuthRoute && user) {
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isProtectedRoute && user && !pathname.startsWith('/onboarding')) {
    if (onboardingCompleted === false) {
      const staff = appRole === 'admin' || appRole === 'super_admin'
      if (!(pathname.startsWith('/admin') && staff)) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
