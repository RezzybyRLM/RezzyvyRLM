'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Pencil, Briefcase, Star, MapPin } from 'lucide-react'

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

  const stats = useMemo(() => {
    const featured = jobs.filter(j => j.is_featured).length
    const active = jobs.filter(j => !j.expires_at || new Date(j.expires_at) >= new Date()).length
    return [
      { label: 'Total roles', value: jobs.length, icon: Briefcase },
      { label: 'Active', value: active, icon: MapPin },
      { label: 'Featured', value: featured, icon: Star },
    ]
  }, [jobs])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading jobs…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-accent">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Mission control</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">Listings shown on the public job board.</p>
        </div>
        <Button asChild size="sm" className="gap-1 bg-primary-600 text-white hover:bg-primary-700">
          <Link href="/admin/jobs/new">
            <Plus className="h-4 w-4" />
            New job
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--glass-border))] bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums text-gray-900">{s.value.toLocaleString()}</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[hsl(var(--glass-border))] bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-900">{jobs.length} roles</p>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Title</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Company</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Location</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Type</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Deadlines</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/70">
                  <td className="px-3 py-3 font-medium text-gray-900">{j.title}</td>
                  <td className="px-3 py-3 text-gray-600">{companyName(j)}</td>
                  <td className="px-3 py-3 text-gray-600">{j.location}</td>
                  <td className="px-3 py-3 text-gray-600">{j.job_type || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    <div>Listing: {j.expires_at ? new Date(j.expires_at).toLocaleDateString() : '—'}</div>
                    <div>Apply by: {j.application_deadline ? new Date(j.application_deadline).toLocaleDateString() : '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    {j.is_featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600/10 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    ) : (
                      <span className="text-gray-400">Standard</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
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
          {jobs.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">No jobs yet.</p> : null}
        </div>
      </div>
    </div>
  )
}
