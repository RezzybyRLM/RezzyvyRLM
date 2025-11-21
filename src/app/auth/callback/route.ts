import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has a plan and onboarding status
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check onboarding status first
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('onboarding_completed, onboarding_step')
          .eq('id', user.id)
          .single()

        // If onboarding not completed, redirect to onboarding
        if (userData && !userDataError) {
          const userDataTyped = userData as { onboarding_completed: boolean | null; onboarding_step: number | null }
          if (!userDataTyped.onboarding_completed && next !== '/onboarding') {
          const forwardedHost = request.headers.get('x-forwarded-host')
          const isLocalEnv = process.env.NODE_ENV === 'development'
          const onboardingUrl = isLocalEnv 
            ? `${origin}/onboarding?redirectTo=${encodeURIComponent(next)}`
            : forwardedHost
              ? `https://${forwardedHost}/onboarding?redirectTo=${encodeURIComponent(next)}`
              : `${origin}/onboarding?redirectTo=${encodeURIComponent(next)}`
            return NextResponse.redirect(onboardingUrl)
          }
        }

        const { data: plan } = await (supabase as any)
          .from('user_plans')
          .select('plan_type')
          .eq('user_id', user.id)
          .single()

        // If no plan exists, redirect to plans page
        if (!plan && next !== '/plans' && next !== '/onboarding') {
          const forwardedHost = request.headers.get('x-forwarded-host')
          const isLocalEnv = process.env.NODE_ENV === 'development'
          
          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}/plans?redirectTo=${encodeURIComponent(next)}`)
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}/plans?redirectTo=${encodeURIComponent(next)}`)
          } else {
            return NextResponse.redirect(`${origin}/plans?redirectTo=${encodeURIComponent(next)}`)
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
