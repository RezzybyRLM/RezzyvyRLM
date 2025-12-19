import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 5 days in seconds (432000) - matches Supabase session timeout
const SESSION_DURATION = 5 * 24 * 60 * 60

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
            // Set cookie expiration to 5 days to match Supabase session timeout
            response.cookies.set(name, value, {
              ...options,
              maxAge: SESSION_DURATION,
              expires: new Date(Date.now() + SESSION_DURATION * 1000),
              httpOnly: false, // Required for client-side access
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          })
        },
      },
    }
  )

  // Refresh session to ensure it persists across page reloads
  // This ensures the session is valid and cookies are properly set
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
  ]

  // Auth routes (redirect to dashboard if logged in)
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

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

