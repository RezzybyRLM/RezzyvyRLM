'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Centralized sign-out utility with proper error handling and cleanup
 * Ensures consistent sign-out behavior across the application
 */
export async function signOut(redirectTo: string = '/auth/login'): Promise<void> {
  const supabase = createClient()
  
  try {
    // Sign out from Supabase (clears session and cookies)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      // Continue with redirect even if there's an error
    }
    
    // Force redirect to ensure clean state
    // Use window.location for full page reload to clear all state
    window.location.href = redirectTo
  } catch (error) {
    console.error('Unexpected error during sign out:', error)
    // Always redirect even on error
    window.location.href = redirectTo
  }
}

/**
 * Hook-based sign-out for use in React components
 * Returns a function that can be called to sign out
 */
export function useSignOut() {
  const router = useRouter()
  const supabase = createClient()
  
  return async (redirectTo: string = '/auth/login') => {
    try {
      await supabase.auth.signOut()
      router.push(redirectTo)
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback to window.location if router fails
      window.location.href = redirectTo
    }
  }
}

