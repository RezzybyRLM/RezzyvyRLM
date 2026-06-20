'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  Eye,
  DollarSign,
  MapPin,
  Briefcase,
  Star,
  Loader2,
  Lightbulb,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

const labelClass = 'mb-1 block text-sm font-medium text-text/70'
const fieldClass =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15'

interface JobFormData {
  title: string
  company: string
  location: string
  salaryMin: string
  salaryMax: string
  jobType: string
  experienceLevel: string
  description: string
  requirements: string
  benefits: string
  isFeatured: boolean
  applicationDeadline: string
}

export default function NewJobPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    jobType: 'full-time',
    experienceLevel: 'mid',
    description: '',
    requirements: '',
    benefits: '',
    isFeatured: false,
    applicationDeadline: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const handleInputChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const salary_range =
        formData.salaryMin && formData.salaryMax
          ? `$${formData.salaryMin} – $${formData.salaryMax}`
          : formData.salaryMin || formData.salaryMax || null

      const res = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          description: formData.description,
          salary_range,
          job_type: formData.jobType,
          is_featured: formData.isFeatured,
          application_deadline: formData.applicationDeadline || null,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        console.error(j.error || 'Create failed')
        return
      }
      router.push('/employer/manage-jobs')
      router.refresh()
    } catch (error) {
      console.error('Error creating job:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateCost = () => {
    let cost = 49 // Base cost for job posting
    if (formData.isFeatured) {
      cost += 50 // Additional cost for featured placement
    }
    return cost
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Command header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" className="mt-1 h-9 w-9 border-border" asChild>
            <Link href="/employer/manage-jobs" aria-label="Back to listings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Hiring command center
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Post a job</h1>
            <p className="mt-1 text-sm text-text/55">Create a new listing to reach Rezzy candidates.</p>
          </div>
        </div>
        <Button variant="outline" className="border-border" onClick={() => setPreviewMode(!previewMode)}>
          <Eye className="mr-2 h-4 w-4" />
          {previewMode ? 'Hide preview' : 'Preview'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-text">Basic information</h2>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Job title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company name *</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="e.g., TechCorp Inc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Location *</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., San Francisco, CA or Remote"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Job type *</label>
                    <select
                      value={formData.jobType}
                      onChange={(e) => handleInputChange('jobType', e.target.value)}
                      className={fieldClass}
                      required
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelClass}>Salary (min)</label>
                    <Input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                      placeholder="80000"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Salary (max)</label>
                    <Input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                      placeholder="120000"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Experience level</label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                      className={fieldClass}
                    >
                      <option value="entry">Entry level</option>
                      <option value="mid">Mid level</option>
                      <option value="senior">Senior level</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-text">Role details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>Job description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting…"
                    className={cn(fieldClass, 'h-32 resize-none')}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Requirements</label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="List the required skills, experience, and qualifications…"
                    className={cn(fieldClass, 'h-32 resize-none')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Benefits &amp; perks</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="List the benefits, perks, and what makes your company a great place to work…"
                    className={cn(fieldClass, 'h-32 resize-none')}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-text">Visibility</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Star className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-text">Featured placement</h4>
                      <p className="text-sm text-text/55">Pin this role to the top of search results for more visibility.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-text/15 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-primary/20" />
                  </label>
                </div>

                <div>
                  <label className={labelClass}>Application deadline</label>
                  <Input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" className="border-border" asChild>
                <Link href="/employer/manage-jobs">Cancel</Link>
              </Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Creating…' : 'Create job posting'}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text">Pricing</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text/55">Job posting</span>
                <span className="font-medium tabular-nums text-text">$49</span>
              </div>
              {formData.isFeatured && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text/55">Featured placement</span>
                  <span className="font-medium tabular-nums text-text">+$50</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold text-text">Total</span>
                <span className="text-xl font-bold tabular-nums text-primary">${calculateCost()}</span>
              </div>
            </div>
          </section>

          {/* Live preview */}
          {previewMode && (
            <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-text">Listing preview</h2>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text">{formData.title || 'Job title'}</h3>
                  {formData.isFeatured && <Badge className="bg-primary text-white">Featured</Badge>}
                </div>
                <p className="text-sm text-text/55">{formData.company || 'Company name'}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-text/50">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{formData.location || 'Location'}</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{formData.jobType}</span>
                </div>
                {formData.salaryMin && formData.salaryMax && (
                  <div className="flex items-center gap-1 text-sm text-text/50">
                    <DollarSign className="h-3 w-3" />
                    <span>${parseInt(formData.salaryMin).toLocaleString()} – ${parseInt(formData.salaryMax).toLocaleString()}</span>
                  </div>
                )}
                {formData.description && <p className="line-clamp-3 text-sm text-text/70">{formData.description}</p>}
              </div>
            </section>
          )}

          {/* Tips */}
          <section className="rounded-2xl border border-secondary/15 bg-secondary/[0.04] p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-secondary">
              <Lightbulb className="h-4 w-4" /> Tips for a strong post
            </h2>
            <ul className="mt-3 space-y-3 text-sm text-text/65">
              <li><span className="font-medium text-text/80">Be specific.</span> Use clear titles and concrete responsibilities.</li>
              <li><span className="font-medium text-text/80">Show the range.</span> Listings with salary get noticeably more applicants.</li>
              <li><span className="font-medium text-text/80">Feature key roles.</span> Featured placement surfaces priority hires first.</li>
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
