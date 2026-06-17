import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessAdminConsole, canAccessEmployerDashboard } from '@/lib/auth/permissions'

/**
 * Server auth gate (Next 16 `proxy` convention, formerly `middleware`).
 *
 * This is the SINGLE source of truth for auth redirects. It runs on every
 * matched request, validates the session via getUser() and — critically —
 * writes refreshed auth cookies onto the response. That means an expired access
 * token is transparently refreshed here (as long as the refresh token is still
 * valid), so a hard refresh or returning after a long idle "just works" with no
 * client redirect, flash, or loop. Client pages/layouts NEVER redirect on auth.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request: { headers: request.headers },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 14, // 14 days
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

  // Validate + refresh the session (writes new cookies via setAll above).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes that require a signed-in user. `/jobs` and `/job-board` are
  // intentionally public so visitors can browse before signing in.
  const protectedRoutes = [
    '/onboarding',
    '/dashboard',
    '/profile',
    '/profiles',
    '/resume-manager',
    '/bookmarks',
    '/job-alerts',
    '/interview-pro',
    '/employer',
    '/cart',
    '/applications',
    '/messages',
    '/feed',
    '/admin',
    '/settings',
  ]
  const authRoutes = ['/auth/login', '/auth/register']

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // 1) Guests hitting a protected route → login, remembering where they wanted
  //    to go so they return there afterwards.
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
      console.error('proxy: error reading user row', error)
      onboardingCompleted = false
      appRole = 'user'
    }
  }

  // 2) Signed-in users shouldn't sit on login/register — send them home.
  if (isAuthRoute && user) {
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    if (canAccessAdminConsole(appRole)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3) Force incomplete onboarding before the rest of the app (staff may reach
  //    /admin first).
  if (isProtectedRoute && user && !pathname.startsWith('/onboarding')) {
    if (onboardingCompleted === false) {
      const staff = appRole === 'admin' || appRole === 'super_admin'
      if (!(pathname.startsWith('/admin') && staff)) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  // 4) Employer workspace is employer-only.
  if (
    user &&
    onboardingCompleted &&
    pathname.startsWith('/employer') &&
    !canAccessEmployerDashboard(appRole)
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
