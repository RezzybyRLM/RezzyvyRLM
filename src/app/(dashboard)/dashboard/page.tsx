'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileStack,
  Bookmark,
  BellRing,
  BriefcaseBusiness,
  Loader2,
  ChevronRight,
  Headphones,
  Send,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const easeOut = [0.22, 1, 0.36, 1] as const

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null)
  const [stats, setStats] = useState({
    resumes: 0,
    bookmarks: 0,
    jobAlerts: 0,
    interviews: 0,
    applications: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          await fetchStats(session.user.id)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    getUser()
    return () => {
      mounted = false
    }
  }, [router, supabase])

  const fetchStats = async (userId: string) => {
    const [resumeResult, bookmarkResult, alertResult, interviewResult, applicationsResult] =
      await Promise.all([
        supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase
          .from('job_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true),
        supabase.from('interview_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ])
    setStats({
      resumes: resumeResult.count ?? 0,
      bookmarks: bookmarkResult.count ?? 0,
      jobAlerts: alertResult.count ?? 0,
      interviews: interviewResult.count ?? 0,
      applications: applicationsResult.count ?? 0,
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Applications',
      value: stats.applications,
      href: '/applications',
      icon: Send,
    },
    {
      label: 'Saved jobs',
      value: stats.bookmarks,
      href: '/bookmarks',
      icon: Bookmark,
    },
    {
      label: 'Resumes',
      value: stats.resumes,
      href: '/resume-manager',
      icon: FileStack,
    },
    {
      label: 'Interview practice',
      value: stats.interviews,
      href: '/interview-pro',
      icon: Headphones,
    },
  ]

  const exampleJobs = [
    {
      company: 'Google',
      role: 'Senior UX Designer',
      location: 'Mountain View, CA',
      salary: '$160k – $220k',
      logo: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
    },
    {
      company: 'Stripe',
      role: 'Backend Engineer',
      location: 'New York, NY',
      salary: '$170k – $230k',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/1024px-Stripe_Logo%2C_revised_2016.svg.png',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: easeOut }}
      className="space-y-8 md:space-y-10"
    >
      <section className="flex flex-col justify-between gap-4 border-b border-border/80 pb-8 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text/60 md:text-base">
            Track applications, saved roles, and interview practice from one place—aligned with your Rezzy workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-border" asChild>
            <Link href="/profile">Edit profile</Link>
          </Button>
          <Button className="bg-primary text-white hover:bg-primary/90" asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.28, ease: easeOut }}
          >
            <Link href={stat.href} className="block h-full">
              <Card className="h-full border border-border bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                    <stat.icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-text/50">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-text">{stat.value}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text/30" aria-hidden />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-text">Job discovery</h2>
            <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
              Open job search
            </Link>
          </div>
          <p className="text-sm text-text/55">
            Examples below—open <span className="font-medium text-text/70">Browse jobs</span> for live listings from our board and partners.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {exampleJobs.map((job) => (
              <Card
                key={job.company + job.role}
                className="border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-background p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={job.logo} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text">{job.role}</h3>
                      <p className="text-sm text-text/55">{job.company}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-normal text-text/70">
                      {job.location}
                    </Badge>
                    <Badge variant="secondary" className="font-normal text-text/70">
                      {job.salary}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3 h-8 px-0 text-primary hover:bg-transparent hover:underline" asChild>
                    <Link href="/jobs">View similar on Rezzy</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Alerts & practice</h2>
          <Card className="border border-border bg-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <BellRing className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-medium text-text">Job alerts</p>
                  <p className="mt-1 text-sm text-text/55">
                    {stats.jobAlerts} active alert{stats.jobAlerts === 1 ? '' : 's'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 border-border" asChild>
                    <Link href="/job-alerts">Manage alerts</Link>
                  </Button>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Headphones className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-medium text-text">Interview Pro</p>
                  <p className="mt-1 text-sm text-text/55">
                    {stats.interviews === 0
                      ? 'Practice sessions help you refine answers before real interviews.'
                      : `${stats.interviews} practice session${stats.interviews === 1 ? '' : 's'} so far.`}
                  </p>
                  <Button size="sm" className="mt-3 bg-primary text-white hover:bg-primary/90" asChild>
                    <Link href="/interview-pro">Start or continue</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border border-l-[3px] border-l-primary bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-text">Complete your profile</p>
              <p className="mt-2 text-sm leading-relaxed text-text/60">
                Profiles with clear experience and skills are easier for employers and our tools to match to the right roles.
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full border-border sm:w-auto" asChild>
                <Link href="/profile">Update profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
