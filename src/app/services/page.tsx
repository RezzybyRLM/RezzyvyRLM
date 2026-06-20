'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  FileText,
  LayoutTemplate,
  GraduationCap,
  QrCode,
  Linkedin,
  Send,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react'

const easeOut = [0.22, 1, 0.36, 1] as const

type Service = {
  type: string
  title: string
  description: string
  icon: typeof FileText
  featured?: boolean
}

const SERVICES: Service[] = [
  {
    type: 'resume',
    title: 'Resume, Cover Letter & Bio',
    description:
      'Customizable resumes, cover letters, and bios with formatting built to pass applicant tracking systems. Delivered in MS Word and PDF.',
    icon: FileText,
  },
  {
    type: 'templates',
    title: 'Customizable Templates',
    description:
      'Choose from a library of professional, customizable design templates that stand out and get you noticed.',
    icon: LayoutTemplate,
  },
  {
    type: 'coaching',
    title: 'Career & Interview Coaching',
    description:
      'Sit down with a qualified career coach to present your best self throughout your employment process and career choices.',
    icon: GraduationCap,
  },
  {
    type: 'vcard',
    title: 'vCard + QR Code',
    description:
      'A virtual electronic representation of your resume, cover letter, and bio with a dedicated landing page.',
    icon: QrCode,
  },
  {
    type: 'linkedin',
    title: 'LinkedIn Optimization',
    description:
      'Optimize and update your LinkedIn profile content to attract recruiters and opportunities.',
    icon: Linkedin,
  },
  {
    type: 'application_processing',
    title: 'Application Processing',
    description:
      'With our RezzyMeUp package, our team applies for you — no more repetitive online application forms.',
    icon: Send,
    featured: true,
  },
]

export default function ServicesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [ordering, setOrdering] = useState<string | null>(null)
  const [ordered, setOrdered] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const requestService = async (svc: Service) => {
    setError(null)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent('/services')}`)
      return
    }
    setOrdering(svc.type)
    try {
      const res = await fetch('/api/services/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: svc.type, title: svc.title }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not submit your request')
        return
      }
      setOrdered((prev) => new Set(prev).add(svc.type))
    } catch {
      setError('Network error — please try again')
    } finally {
      setOrdering(null)
    }
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-background">
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary-500" /> RezzyMeUp — done-for-you career services
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            We do the heavy lifting, <span className="text-primary-600">you land the job</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            From ATS-ready resumes to a team that applies for you — pick a service and our specialists take it from there.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {error && (
          <div className="mx-auto mb-6 max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc, i) => {
            const isOrdered = ordered.has(svc.type)
            const isBusy = ordering === svc.type
            return (
              <motion.div
                key={svc.type}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3, ease: easeOut }}
                className={
                  'flex h-full flex-col rounded-2xl border bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover ' +
                  (svc.featured ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border')
                }
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svc.icon className="h-6 w-6 stroke-[1.5]" />
                  </span>
                  {svc.featured && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                      RezzyMeUp
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text">{svc.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text/60">{svc.description}</p>
                <Button
                  className={
                    'mt-5 w-full ' +
                    (isOrdered ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-primary text-white hover:bg-primary/90')
                  }
                  disabled={isBusy || isOrdered}
                  onClick={() => requestService(svc)}
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : isOrdered ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Request received
                    </>
                  ) : (
                    'Request this service'
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-text/55">
          Requesting a service notifies the Rezzy team, who&apos;ll reach out to confirm details and pricing.{' '}
          <Link href="/plans" className="font-medium text-primary hover:underline">
            Compare plans &amp; pricing
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
