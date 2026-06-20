'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { canAccessAdminConsole } from '@/lib/auth/permissions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      for (let i = 0; i < 8; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('onboarding_completed, role')
            .eq('id', session.user.id)
            .single()
          const done = userData?.onboarding_completed ?? false
          const staff = canAccessAdminConsole(userData?.role ?? null)
          const defaultStaff = staff && !searchParams.get('redirectTo')
          const target = done ? (defaultStaff ? '/admin/dashboard' : redirectTo) : '/onboarding'
          if (!cancelled) {
            // Full load (not a soft router nav): re-creates the browser Supabase
            // client from the proxy-refreshed cookies so the in-memory session
            // is fresh. A soft nav here can land on a dashboard page with a stale
            // token, so client (RLS) queries return nothing until a hard refresh.
            window.location.assign(target)
          }
          return
        }
        await new Promise((r) => setTimeout(r, 60))
      }
      if (!cancelled) setSessionChecked(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [redirectTo, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data?.user) {
        // Session is automatically stored by Supabase
        // Wait for session to be confirmed before redirecting
        let sessionConfirmed = false
        let attempts = 0
        const maxAttempts = 10
        
        while (!sessionConfirmed && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200))
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            sessionConfirmed = true
          }
          attempts++
        }
        
        // Check onboarding status before redirecting
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('onboarding_completed, role')
            .eq('id', data.user.id)
            .single()

          const onboardingCompleted = userData?.onboarding_completed ?? false
          const staff = canAccessAdminConsole(userData?.role ?? null)
          const explicitRedirect = searchParams.get('redirectTo')
          const staffHome = staff && onboardingCompleted && !explicitRedirect
          const finalRedirect = onboardingCompleted
            ? staffHome
              ? '/admin/dashboard'
              : redirectTo
            : '/onboarding'

          window.location.href = finalRedirect
        } catch (err) {
          console.error('Error checking onboarding status:', err)
          // Fallback to original redirect - middleware will handle it
          window.location.href = redirectTo
        }
      } else {
        setError('Failed to create session. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <Image src="/logo.png" alt="" width={100} height={100} className="mb-4 object-contain opacity-90" priority />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
