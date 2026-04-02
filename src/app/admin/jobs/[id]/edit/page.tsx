'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Applicant = {
  id: string
  applied_at: string | null
  status: string | null
  applicant_user_id: string
  email: string | null
  full_name: string | null
}

export default function AdminEditJobPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [featured, setFeatured] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [applicationDeadline, setApplicationDeadline] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [jobRes, appRes] = await Promise.all([
          fetch(`/api/admin/jobs/${id}`),
          fetch(`/api/admin/jobs/${id}/applicants`),
        ])
        const jobJson = await jobRes.json()
        const appJson = await appRes.json()
        if (cancelled) return
        if (!jobRes.ok || !jobJson.success) {
          setError(jobJson.error || 'Could not load job')
          setLoading(false)
          return
        }
        const j = jobJson.job
        setTitle(j.title || '')
        setLocation(j.location || '')
        setDescription(j.description || '')
        setSalaryRange(j.salary_range || '')
        setJobType(j.job_type || 'Full-time')
        setFeatured(!!j.is_featured)
        setExpiresAt(j.expires_at ? j.expires_at.slice(0, 10) : '')
        setApplicationDeadline(j.application_deadline ? j.application_deadline.slice(0, 10) : '')
        if (appRes.ok && appJson.success) {
          setApplicants(appJson.applicants || [])
        }
      } catch {
        if (!cancelled) setError('Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        title,
        location,
        description,
        salary_range: salaryRange || null,
        job_type: jobType,
        is_featured: featured,
        expires_at: expiresAt ? new Date(expiresAt + 'T12:00:00').toISOString() : null,
        application_deadline: applicationDeadline
          ? new Date(applicationDeadline + 'T12:00:00').toISOString()
          : null,
      }
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Save failed')
        return
      }
      router.push('/admin/jobs')
      router.refresh()
    } catch {
      setError('Request failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this listing permanently?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error || 'Delete failed')
        return
      }
      router.push('/admin/jobs')
      router.refresh()
    } finally {
      setSaving(false)
    }
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit job</h1>
          <p className="text-sm text-muted-foreground">Update listing, deadlines, and review applicants</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="max-w-xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={e => setLocation(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                className="flex min-h-[140px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary (optional)</Label>
              <Input id="salary" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Job type</Label>
              <Input id="type" value={jobType} onChange={e => setJobType(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp">Listing expires</Label>
                <Input id="exp" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Application deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={applicationDeadline}
                  onChange={e => setApplicationDeadline(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
              Featured listing
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving}>
                Delete listing
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Users className="h-4 w-4" />
            Applicants ({applicants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {applicants.map(a => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-white/50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-gray-900">{a.full_name || 'Applicant'}</p>
                    <p className="text-muted-foreground">{a.email || a.applicant_user_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status ? (
                      <Badge variant="secondary" className="font-normal">
                        {a.status}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {a.applied_at ? new Date(a.applied_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
