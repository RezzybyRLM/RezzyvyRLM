'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Centralized sign-out.
 *
 * The authoritative work happens server-side at `/auth/signout`, which clears
 * the SSR auth cookies on its redirect response (the proxy short-circuits that
 * path so it can't re-refresh the session). We only do a best-effort, non-
 * blocking LOCAL client clear first — never the default global `signOut()`,
 * whose network revoke can hang and make the click appear to do nothing.
 */
export async function signOut(redirectTo: string = '/auth/login'): Promise<void> {
  try {
    // Best-effort: drop the in-memory/browser session immediately. `local`
    // scope makes no network call, so it can't hang. Ignore any error.
    void createClient().auth.signOut({ scope: 'local' }).catch(() => {})
  } catch {
    /* ignore */
  }
  // Full navigation to the server route, which clears the auth cookies and
  // redirects to `redirectTo`.
  window.location.href = `/auth/signout?next=${encodeURIComponent(redirectTo)}`
}

/**
 * Hook-based sign-out for use in React components. Same authoritative path.
 */
export function useSignOut() {
  const router = useRouter()
  return async (redirectTo: string = '/auth/login') => {
    try {
      void createClient().auth.signOut({ scope: 'local' }).catch(() => {})
    } catch {
      /* ignore */
    }
    window.location.href = `/auth/signout?next=${encodeURIComponent(redirectTo)}`
    // `router` retained for API compatibility with existing callers.
    void router
  }
}
