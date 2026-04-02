'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function AdminNewJobPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [featured, setFeatured] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          title,
          location,
          description,
          salary_range: salaryRange || null,
          job_type: jobType,
          is_featured: featured,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not create job')
        return
      }
      router.push('/admin/jobs')
      router.refresh()
    } catch {
      setError('Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New job</h1>
          <p className="text-sm text-muted-foreground">Creates a company record if the name is new</p>
        </div>
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="Senior Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
                placeholder="Remote / City, ST"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                className="flex min-h-[140px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                placeholder="Role summary, responsibilities, requirements…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary (optional)</Label>
              <Input
                id="salary"
                value={salaryRange}
                onChange={e => setSalaryRange(e.target.value)}
                placeholder="$120k – $150k"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Job type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={jobType}
                onChange={e => setJobType(e.target.value)}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
              Featured listing
            </label>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
