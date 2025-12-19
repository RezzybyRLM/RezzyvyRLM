import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
  
  if (!supabaseUrl || supabaseUrl === 'https://dummy.supabase.co' || !supabaseKey || supabaseKey === 'dummy-key') {
    console.error('Supabase environment variables are not properly configured')
  }
  
  // createBrowserClient automatically handles cookies from the browser
  // It reads cookies set by middleware/server and uses them for auth
  return createBrowserClient(supabaseUrl, supabaseKey)
}
