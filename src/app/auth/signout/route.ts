import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Authoritative sign-out.
 *
 * Browser-only `supabase.auth.signOut()` can leave the SSR auth cookies in place
 * (and its default global scope makes a network call that can hang, so the click
 * appears to "do nothing"). This route clears the auth cookies server-side on the
 * redirect response itself, so the very next request — and the proxy — sees a
 * genuinely signed-out user. The proxy short-circuits `/auth/signout` so it never
 * re-refreshes the session cookie we are deleting here.
 *
 * Accepts GET (link/navigation) and POST (form). `?next=` controls the landing
 * page, defaulting to the login screen.
 */
async function handle(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get('next') || '/auth/login'
  // Only allow same-origin relative redirects.
  const target = nextParam.startsWith('/') ? nextParam : '/auth/login'

  const response = NextResponse.redirect(new URL(target, request.url), { status: 303 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // signOut() emits cookie deletions here; write them onto the redirect
          // response with the exact options Supabase provides so the browser
          // actually drops them.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()

  return response
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
