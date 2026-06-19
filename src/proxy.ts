import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  canAccessAdminConsole,
  canAccessEmployerDashboard,
  canAccessServiceConsole,
  isStaffRole,
} from '@/lib/auth/permissions'

/**
 * Server auth gate (Next 16 `proxy` convention, formerly `middleware`).
 *
 * SINGLE source of truth for auth redirects. It runs on every matched request,
 * validates the session with `getUser()` and writes refreshed auth cookies onto
 * the response — so an expired access token is transparently refreshed here (as
 * long as the refresh token is valid). A hard refresh after a long idle "just
 * works": no client redirect, no flash, no loop. Pages/layouts NEVER redirect
 * on auth; they trust the cookies this gate already settled.
 */

/** Routes that require a signed-in user. `/jobs` & `/job-board` stay public so
 *  visitors can browse before signing in. */
const PROTECTED = [
  '/onboarding',
  '/dashboard',
  '/profile',
  '/profiles',
  '/resume-manager',
  '/bookmarks',
  '/job-alerts',
  '/interview-pro',
  '/employer',
  '/service',
  '/cart',
  '/applications',
  '/messages',
  '/feed',
  '/admin',
  '/settings',
]
const AUTH_ROUTES = ['/auth/login', '/auth/register']

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p))

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  // Sign-out route clears the auth cookies on its own response. Let it through
  // WITHOUT calling getUser() here — otherwise this gate would refresh and
  // re-write a valid session cookie, racing (and defeating) the deletion.
  if (request.nextUrl.pathname === '/auth/signout') return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Canonical @supabase/ssr handling: write the cookies back with the
          // EXACT options Supabase provides. Do NOT force httpOnly / maxAge / etc.
          // — the browser client writes non-httpOnly auth cookies, and forcing
          // httpOnly here creates a conflicting copy the client can't read or
          // overwrite, which breaks session parsing and bounces every protected
          // navigation back to /auth/login (the "stuck on login" loop).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate + refresh the session (writes new cookies via setAll above).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = startsWithAny(pathname, PROTECTED)
  const isAuthRoute = startsWithAny(pathname, AUTH_ROUTES)

  // 1) Guest hitting a protected route → login, remembering the destination.
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // No signed-in user past this point means a public route → let it through.
  if (!user) return response

  // Resolve onboarding + role once, only when a redirect decision needs it.
  const needsProfile = isAuthRoute || (isProtected && !pathname.startsWith('/onboarding'))
  let onboardingCompleted: boolean | null = null
  let role = 'user'

  if (needsProfile) {
    try {
      const { data } = await supabase
        .from('users')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .single()
      onboardingCompleted = data?.onboarding_completed ?? false
      role = data?.role ?? 'user'
    } catch (error) {
      console.error('proxy: failed to read user row', error)
      onboardingCompleted = false
      role = 'user'
    }
  }

  const staff = isStaffRole(role)

  // 2) Signed-in users never sit on login/register → send them where they belong.
  if (isAuthRoute) {
    if (!onboardingCompleted) return NextResponse.redirect(new URL('/onboarding', request.url))
    if (canAccessAdminConsole(role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    if (role === 'service_team') {
      return NextResponse.redirect(new URL('/service', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3) Force onboarding before the rest of the app (staff may reach /admin first).
  if (isProtected && !pathname.startsWith('/onboarding') && onboardingCompleted === false) {
    const adminAndStaff = pathname.startsWith('/admin') && staff
    if (!adminAndStaff) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // 4) Admin console is staff-only — bounce everyone else to their dashboard.
  if (pathname.startsWith('/admin') && !canAccessAdminConsole(role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 5) Employer workspace is employer-only.
  if (
    pathname.startsWith('/employer') &&
    onboardingCompleted &&
    !canAccessEmployerDashboard(role)
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 6) RezzyMeUp service console is service-team + staff only.
  if (pathname.startsWith('/service') && !canAccessServiceConsole(role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
