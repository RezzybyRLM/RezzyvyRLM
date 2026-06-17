import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

/**
 * Resolve the signed-in user from the persisted session, retrying briefly to
 * ride out the transient null that `getSession()` can return right after a hard
 * navigation (the session is still hydrating from storage).
 *
 * Returns null only when there is genuinely no session. Pages inside the
 * `(dashboard)` group are already gated server-side by middleware, so a page
 * should NOT redirect to login on a null here — that creates a login↔page loop
 * (middleware/the dashboard layout are the source of truth for auth). Just stop
 * loading and let those handle a real sign-out.
 */
export async function resolveSessionUser(
  supabase: SupabaseClient,
  { tries = 3, delayMs = 150 }: { tries?: number; delayMs?: number } = {}
): Promise<User | null> {
  for (let i = 0; i < tries; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs))
  }
  return null
}
