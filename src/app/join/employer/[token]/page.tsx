'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building2, CheckCircle2 } from 'lucide-react'

export default function EmployerJoinPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [preview, setPreview] = useState<{ ok: boolean; companyName?: string; reason?: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/employer-invites/preview?token=${encodeURIComponent(token)}`)
      const j = await res.json()
      if (cancelled) return
      setPreview(j)
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setUserId(user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  const claim = async () => {
    setClaiming(true)
    setError(null)
    try {
      const res = await fetch('/api/employer-invites/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not accept invite')
        return
      }
      setDone(true)
      router.refresh()
      setTimeout(() => router.push('/employer'), 1200)
    } catch {
      setError('Network error')
    } finally {
      setClaiming(false)
    }
  }

  const loginHref = `/auth/login?redirectTo=${encodeURIComponent(`/join/employer/${token}`)}`
  const registerHref = `/auth/register?redirectTo=${encodeURIComponent(`/join/employer/${token}`)}`

  if (!preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/80">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!preview.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/80 px-4">
        <Card className="glass-card w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Invite unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This employer invite is invalid, expired, or has already been used. Ask your administrator for a new
              link.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/80 px-4 py-16">
      <div className="mx-auto max-w-md">
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Employer invitation</CardTitle>
            <p className="text-sm text-muted-foreground">
              You&apos;ve been invited to manage listings for{' '}
              <span className="font-semibold text-gray-900">{preview.companyName}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <p className="font-medium text-gray-900">Welcome aboard</p>
                <p className="text-sm text-muted-foreground">Redirecting to your employer dashboard…</p>
              </div>
            ) : !userId ? (
              <>
                <p className="text-sm text-muted-foreground">Sign in or create an account to accept this one-time invite.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="flex-1">
                    <Link href={registerHref}>Create account</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button className="w-full" disabled={claiming} onClick={() => void claim()}>
                  {claiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Accept & open dashboard
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
