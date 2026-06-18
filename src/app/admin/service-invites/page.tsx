'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Copy, Check, Sparkles } from 'lucide-react'

type Invite = {
  id: string
  invitee_name: string | null
  invitee_email: string | null
  created_at: string
  expires_at: string
  used_at: string | null
}

export default function ServiceInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [emailed, setEmailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/service-invites')
      const j = await res.json()
      if (j.success) setInvites(j.invites)
      else setError(j.error || 'Failed to load')
    } catch {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const create = async () => {
    setCreating(true)
    setError(null)
    setLastUrl(null)
    setEmailed(false)
    try {
      const res = await fetch('/api/admin/service-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeName: name, inviteeEmail: email }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not create invite')
        return
      }
      setLastUrl(j.url)
      setEmailed(!!j.emailed)
      setName('')
      setEmail('')
      void load()
    } catch {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">Admin console</p>
        <h1 className="text-2xl font-semibold tracking-tight text-text">Service team invites</h1>
        <p className="mt-1 text-sm text-text/55">
          Generate a single-use signup link for a RezzyMeUp service team member. They accept it to get a service account.
        </p>
      </div>

      <Card className="rounded-2xl border border-border/70 bg-white/70 shadow-card backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Create an invite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={create} disabled={creating} className="bg-primary text-white hover:bg-primary/90">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate signup link
          </Button>

          {lastUrl && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              {emailed && (
                <p className="text-sm font-medium text-emerald-700">✅ Invite emailed to the address above.</p>
              )}
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-xs text-text/80">{lastUrl}</code>
              <Button size="sm" variant="outline" className="border-border" onClick={() => copy(lastUrl)}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/70 bg-white/70 shadow-card backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent invites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-text/55">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-text/55">No invites yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{inv.invitee_name || inv.invitee_email || 'Unnamed invite'}</p>
                    <p className="text-xs text-text/50">Created {new Date(inv.created_at).toLocaleDateString()} · Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                  <span
                    className={
                      inv.used_at
                        ? 'shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
                        : 'shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary'
                    }
                  >
                    {inv.used_at ? 'Accepted' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
