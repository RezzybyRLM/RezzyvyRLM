'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Pencil } from 'lucide-react'

type JobRow = {
  id: string
  title: string
  location: string
  salary_range: string | null
  job_type: string | null
  is_featured: boolean | null
  expires_at: string | null
  application_deadline: string | null
  created_at: string | null
  companies: { name: string } | { name: string }[] | null
}

function companyName(job: JobRow): string {
  const c = job.companies
  if (!c) return '—'
  if (Array.isArray(c)) return c[0]?.name || '—'
  return c.name || '—'
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/jobs')
      .then(r => r.json())
      .then(j => {
        if (cancelled) return
        if (j.success) setJobs(j.jobs || [])
        else setError(j.error || 'Failed to load')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading jobs…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">Listings shown on the public job board</p>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="/admin/jobs/new">
            <Plus className="h-4 w-4" />
            New job
          </Link>
        </Button>
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">{jobs.length} roles</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Deadlines</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium">{j.title}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{companyName(j)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{j.location}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{j.job_type || '—'}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    <div>Listing: {j.expires_at ? new Date(j.expires_at).toLocaleDateString() : '—'}</div>
                    <div>Apply by: {j.application_deadline ? new Date(j.application_deadline).toLocaleDateString() : '—'}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {j.is_featured ? (
                      <Badge variant="secondary" className="font-normal">
                        Featured
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Standard</span>
                    )}
                  </td>
                  <td className="py-3">
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                      <Link href={`/admin/jobs/${j.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No jobs yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
