'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Copy, Check, Building2, Link2 } from 'lucide-react'
import { formatAdminTableDate } from '@/components/admin/admin-role-badge'
import { cn } from '@/lib/utils'

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
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [emailed, setEmailed] = useState(false)
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
    setEmailed(false)
    try {
      const res = await fetch('/api/admin/employer-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, inviteeEmail }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not create')
        return
      }
      setLastUrl(j.url)
      setEmailed(!!j.emailed)
      setCompanyName('')
      setInviteeEmail('')
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
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Organization invites</h1>
        <p className="mt-1 text-sm text-gray-500">
          Single-use links for business users. Each link works once, then expires for new signups.
        </p>
      </div>

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">
          <Building2 className="h-4 w-4 text-primary-600" /> New invite
        </p>
        <form onSubmit={createInvite} className="mt-4 max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org">Organization / company name</Label>
            <Input id="org" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Acme Hiring LLC" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgEmail">Contact email (optional — emails the link automatically)</Label>
            <Input id="orgEmail" type="email" value={inviteeEmail} onChange={e => setInviteeEmail(e.target.value)} placeholder="hiring@acme.com" />
          </div>
          <Button type="submit" className="bg-primary-600 text-white hover:bg-primary-700" disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {inviteeEmail ? 'Generate & send invite' : 'Generate one-time link'}
          </Button>
          {lastUrl ? (
            <div className="rounded-xl border border-primary-600/20 bg-primary-600/5 p-3 text-sm">
              <p className="mb-2 font-medium text-gray-900">
                {emailed ? '✅ Invite emailed — you can also share this link' : 'Share this link once'}
              </p>
              <code className="block break-all rounded-lg bg-white px-2 py-1.5 text-xs text-gray-700">{lastUrl}</code>
              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1" onClick={() => void copy()}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          ) : null}
        </form>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 p-4">
          <Link2 className="h-5 w-5 text-primary-600" />
          <p className="text-sm font-semibold text-gray-900">Recent invites</p>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Company</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Created</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Expires</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => {
                const used = !!inv.used_at
                const expired = !used && new Date(inv.expires_at) < new Date()
                return (
                  <tr key={inv.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/70">
                    <td className="px-3 py-3 font-medium text-gray-900">{inv.company_name}</td>
                    <td className="px-3 py-3 tabular-nums text-gray-500">{formatAdminTableDate(inv.created_at)}</td>
                    <td className="px-3 py-3 tabular-nums text-gray-500">{formatAdminTableDate(inv.expires_at)}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        used ? 'bg-success/10 text-success' : expired ? 'bg-gray-100 text-gray-500' : 'bg-primary-600/10 text-primary-700'
                      )}>
                        {used ? 'Used' : expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {invites.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">No invites yet.</p> : null}
        </div>
      </div>
    </div>
  )
}
