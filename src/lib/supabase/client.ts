import { createBrowserClient } from '@supabase/ssr'

function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Single shared browser client. Calling createBrowserClient() repeatedly spawns
// multiple GoTrueClient instances, each re-initializing auth from storage and
// firing transient INITIAL_SESSION(null) events — which caused spurious
// "logged out" redirects on navigation. Memoizing keeps one stable instance.
let browserClient: ReturnType<typeof makeClient> | undefined

export function createClient() {
  // On the server, return a fresh (non-persisted) client each call.
  if (typeof window === 'undefined') return makeClient()
  if (!browserClient) browserClient = makeClient()
  return browserClient
}

// Convenience singleton for client components.
export const supabase = createClient()
