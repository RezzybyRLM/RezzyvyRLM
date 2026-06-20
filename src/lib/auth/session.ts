import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

/**
 * Resolve the signed-in user for a client page — fast when warm, reliable always.
 *
 * The failure this fixes: on a *soft* navigation (e.g. from the home page into
 * the dashboard via the account dropdown) `getSession()` can briefly return null
 * while the browser client rehydrates. The old version only polled getSession and
 * then gave up, so the page rendered with no data and stayed broken until a hard
 * refresh.
 *
 * Strategy:
 *   1. Fast path — `getSession()` reads the in-memory session; instant on soft
 *      navigation when the user is already signed in (the common case).
 *   2. Reliable path — `getUser()` validates the auth cookies against the server.
 *      It succeeds whenever the user is genuinely signed in, so a transient null
 *      session can never strand the page (no more hard-refresh-to-load).
 *   3. Last resort — a few short getSession retries for a truly cold client.
 *
 * Pages inside the `(dashboard)` group are already gated server-side by the
 * proxy, so a null here means genuinely signed-out — pages should just stop
 * loading, NOT redirect to login (that loops).
 */
export async function resolveSessionUser(
  supabase: SupabaseClient,
  { tries = 3, delayMs = 150 }: { tries?: number; delayMs?: number } = {}
): Promise<User | null> {
  // 1) Fast path: in-memory session — but only trust it when the access token
  //    is still valid. A stale/expired in-memory token (common after the tab
  //    has been idle, or when the proxy rotated the cookie server-side) would
  //    make client (RLS) queries return nothing until a manual hard refresh.
  const fromSession = await supabase.auth.getSession()
  const session = fromSession.data.session
  if (session?.user) {
    const expSec = session.expires_at ?? 0
    const stale = expSec > 0 && expSec * 1000 - Date.now() < 5_000
    if (!stale) return session.user
    // Expired/near-expiry → validate+refresh against the cookies so subsequent
    // queries carry a fresh token. Falls back to the cached user if refresh is
    // unavailable (page just stops loading rather than redirect-looping).
    const refreshed = await supabase.auth.getUser()
    if (refreshed.data.user) return refreshed.data.user
    return session.user
  }

  // 2) Reliable path: validate against the server via cookies.
  const fromUser = await supabase.auth.getUser()
  if (fromUser.data.user) return fromUser.data.user

  // 3) Last resort: brief retries while a cold client finishes hydrating.
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, delayMs))
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user
  }
  return null
}
