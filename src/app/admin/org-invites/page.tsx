'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type InviteRow = {
  id: string
  company_name: string
  created_at: string
  expires_at: string
  used_at: string | null
}

export default function OrgInvitesPage() {
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    fetch('/api/admin/employer-invites')
      .then(r => r.json())
      .then(j => {
        if (j.success) setInvites(j.invites || [])
        else setError(j.error || 'Failed to load')
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setLastUrl(null)
    try {
      const res = await fetch('/api/admin/employer-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not create')
        return
      }
      setLastUrl(j.url)
      setCompanyName('')
      load()
    } catch {
      setError('Request failed')
    } finally {
      setCreating(false)
    }
  }

  const copy = async () => {
    if (!lastUrl) return
    await navigator.clipboard.writeText(lastUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization invites</h1>
        <p className="text-sm text-muted-foreground">
          Single-use links for business users. Each link works once, then expires for new signups.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">New invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInvite} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org">Organization / company name</Label>
              <Input
                id="org"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
                placeholder="Acme Hiring LLC"
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate one-time link
            </Button>
            {lastUrl ? (
              <div className="rounded-lg border border-border/70 bg-white/60 p-3 text-sm backdrop-blur-sm">
                <p className="mb-2 font-medium text-gray-900">Share this link once</p>
                <code className="block break-all rounded bg-slate-100/80 px-2 py-1.5 text-xs text-slate-800">
                  {lastUrl}
                </code>
                <Button type="button" variant="outline" size="sm" className="mt-2 gap-1" onClick={() => void copy()}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent invites</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 pr-4 font-medium">Expires</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium">{inv.company_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{new Date(inv.created_at).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    {inv.used_at ? (
                      <Badge className="border-0 bg-emerald-100 font-normal text-emerald-900">Used</Badge>
                    ) : new Date(inv.expires_at) < new Date() ? (
                      <Badge variant="secondary" className="font-normal">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal">
                        Active
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invites.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No invites yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
