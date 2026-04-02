'use client'

import { Suspense, useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { canAccessAdminConsole } from '@/lib/auth/permissions'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const postAuthTarget = searchParams.get('redirectTo')?.trim() || ''

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
          const joinInvite =
            postAuthTarget.startsWith('/join/') ? postAuthTarget : null
          const home = done
            ? staff
              ? '/admin/dashboard'
              : joinInvite || '/dashboard'
            : joinInvite || '/onboarding'
          if (!cancelled) router.replace(home)
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
  }, [router, postAuthTarget])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data?.user) {
        try {
          const { error: userError } = await supabase
            .from('users')
            .upsert(
              {
                id: data.user.id,
                email: email,
                onboarding_completed: false,
                onboarding_step: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'id',
              }
            )

          if (userError) {
            console.error('Error creating user record:', userError)
          }
        } catch (err) {
          console.error('Error in user record creation:', err)
        }

        const next = searchParams.get('redirectTo')?.trim()
        if (data.session) {
          if (next?.startsWith('/join/')) {
            router.push(next)
          } else {
            router.push('/onboarding')
          }
          router.refresh()
        } else {
          const loginQs = new URLSearchParams()
          loginQs.set('message', 'Check your email to confirm your account')
          if (next?.startsWith('/join/')) {
            loginQs.set('redirectTo', next)
          }
          router.push(`/auth/login?${loginQs.toString()}`)
        }
      } else {
        setError('Failed to create account. Please try again.')
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-center text-2xl font-bold">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-xs text-gray-500">Must be at least 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              href={
                postAuthTarget
                  ? `/auth/login?redirectTo=${encodeURIComponent(postAuthTarget)}`
                  : '/auth/login'
              }
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <Image src="/logo.png" alt="" width={100} height={100} className="mb-4 object-contain opacity-90" priority />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
