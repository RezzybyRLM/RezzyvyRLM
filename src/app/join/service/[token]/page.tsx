'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

export default function ServiceJoinPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [preview, setPreview] = useState<{ ok: boolean; inviteeName?: string | null; reason?: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/service-invites/preview?token=${encodeURIComponent(token)}`)
      const j = await res.json()
      if (!cancelled) setPreview(j)
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
      const res = await fetch('/api/service-invites/claim', {
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
      setTimeout(() => router.push('/service'), 1200)
    } catch {
      setError('Network error')
    } finally {
      setClaiming(false)
    }
  }

  const loginHref = `/auth/login?redirectTo=${encodeURIComponent(`/join/service/${token}`)}`
  const registerHref = `/auth/register?redirectTo=${encodeURIComponent(`/join/service/${token}`)}`

  if (!preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!preview.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="glass-card w-full max-w-md border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Invite unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text/60">
            <p>This service invite is invalid, expired, or has already been used. Ask your administrator for a new link.</p>
            <Button asChild variant="outline" className="border-border">
              <Link href="/">Back home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-md">
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">RezzyMeUp service team</CardTitle>
            <p className="text-sm text-text/60">
              {preview.inviteeName ? <>Welcome, <span className="font-semibold text-text">{preview.inviteeName}</span>. </> : null}
              You&apos;ve been invited to join the Rezzy service team and fulfill client orders.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <p className="font-medium text-text">Welcome aboard</p>
                <p className="text-sm text-text/60">Opening your service queue…</p>
              </div>
            ) : !userId ? (
              <>
                <p className="text-sm text-text/60">Sign in or create an account to accept this one-time invite.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="flex-1 bg-primary text-white hover:bg-primary/90">
                    <Link href={registerHref}>Create account</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-border">
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button className="w-full bg-primary text-white hover:bg-primary/90" disabled={claiming} onClick={() => void claim()}>
                  {claiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Accept &amp; open service queue
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
