import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Use Node.js runtime for server-side cookie handling
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Create or update user record with onboarding_completed = false if new user
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          // New user - create record with onboarding not completed
          await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email || '',
              onboarding_completed: false,
              onboarding_step: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }

        // Check onboarding status
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        const onboardingCompleted = userData?.onboarding_completed ?? false
        const redirectPath = onboardingCompleted ? next : '/onboarding'

        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectPath}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
        } else {
          return NextResponse.redirect(`${origin}${redirectPath}`)
        }
      } catch (err) {
        console.error('Error in callback user setup:', err)
        // Fallback to original redirect
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

