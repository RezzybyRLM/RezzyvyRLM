import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // Canonical @supabase/ssr handling: write the cookies back with the
            // EXACT options Supabase provides. Do NOT force httpOnly / maxAge /
            // etc. — the BROWSER client writes non-httpOnly auth cookies, so
            // forcing httpOnly here (in route handlers / server actions like the
            // auth callback) leaves a conflicting copy the browser client can't
            // read. That desyncs the session, so client-side (RLS) queries run
            // unauthenticated and return no data until a hard refresh re-syncs
            // the cookie through the proxy. Must match proxy.ts and the browser
            // client exactly.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

