'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Copy, Check, Sparkles, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Service team invites</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate a single-use signup link for a RezzyMeUp service team member. They accept it to get a service account.
        </p>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
          <Sparkles className="h-4 w-4 text-primary-600" /> Create an invite
        </p>
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button onClick={create} disabled={creating} className="bg-primary-600 text-white hover:bg-primary-700">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate signup link
          </Button>

          {lastUrl && (
            <div className="space-y-2 rounded-xl border border-primary-600/20 bg-primary-600/5 p-3">
              {emailed && <p className="text-sm font-medium text-success">✅ Invite emailed to the address above.</p>}
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-1.5 text-xs text-gray-700">{lastUrl}</code>
                <Button size="sm" variant="outline" onClick={() => copy(lastUrl)}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 p-4">
          <Headphones className="h-5 w-5 text-primary-600" />
          <p className="text-sm font-semibold text-gray-900">Recent invites</p>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-gray-400">No invites yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50/70">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{inv.invitee_name || inv.invitee_email || 'Unnamed invite'}</p>
                    <p className="text-xs text-gray-400">Created {new Date(inv.created_at).toLocaleDateString()} · Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    inv.used_at ? 'bg-success/10 text-success' : 'bg-primary-600/10 text-primary-700'
                  )}>
                    {inv.used_at ? 'Accepted' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
