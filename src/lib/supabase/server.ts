import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 5 days in seconds
const SESSION_DURATION = 5 * 24 * 60 * 60

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
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookie expiration to 5 days
              cookieStore.set(name, value, {
                ...options,
                maxAge: SESSION_DURATION,
                expires: new Date(Date.now() + SESSION_DURATION * 1000),
                httpOnly: false, // Required for client-side access
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              })
            })
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
