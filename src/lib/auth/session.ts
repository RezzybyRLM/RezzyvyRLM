import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

/**
 * Resolve the signed-in user for a client page — instant, and never hangs.
 *
 * Uses `getSession()` ONLY. The browser Supabase client reads its session from
 * the auth cookies, which the proxy (middleware) keeps fresh on every request,
 * so getSession() returns a valid, query-capable token without any network call.
 *
 * We deliberately DO NOT call `supabase.auth.getUser()` here. getUser() makes a
 * blocking network round-trip to the auth server and is known to HANG when a tab
 * is reopened after inactivity (supabase/supabase#35754) — which would strand
 * the page on its loading spinner until a manual hard refresh (the exact bug we
 * are fixing). RLS validates the token on the real data query, so a genuinely
 * bad token yields no rows rather than a hung page.
 *
 * On a cold client the session may still be hydrating from cookies for a tick,
 * so we retry getSession() a few times before concluding the user is signed out.
 *
 * Pages inside the `(dashboard)` group are already gated server-side by the
 * proxy, so a null here means genuinely signed-out — pages should just stop
 * loading, NOT redirect to login (that loops).
 */
export async function resolveSessionUser(
  supabase: SupabaseClient,
  { tries = 6, delayMs = 120 }: { tries?: number; delayMs?: number } = {}
): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return session.user

  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, delayMs))
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.user) return s.user
  }
  return null
}
