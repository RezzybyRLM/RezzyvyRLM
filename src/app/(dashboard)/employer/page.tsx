'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  Eye, 
  MousePointer, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface JobStats {
  totalJobs: number
  activeJobs: number
  featuredJobs: number
  totalViews: number
  totalClicks: number
  totalApplications: number
  monthlyRevenue: number
}

interface RecentJob {
  id: string
  title: string
  company: string
  location: string
  status: 'active' | 'expired' | 'draft'
  views: number
  applications: number
  createdAt: string
  isFeatured: boolean
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    featuredJobs: 0,
    totalViews: 0,
    totalClicks: 0,
    totalApplications: 0,
    monthlyRevenue: 0,
  })
  
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (mounted) {
            setLoading(false)
          }
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('employer_company_id, role')
          .eq('id', user.id)
          .single()

        if (!mounted) {
          setLoading(false)
          return
        }

        const compId = profile?.employer_company_id ?? null
        if (compId) {
          setCompanyId(compId)

          // Fetch stats and recent jobs in parallel
          const [statsResponse, jobsResponse] = await Promise.all([
            fetch(`/api/employer/stats?companyId=${compId}`),
            fetch(`/api/employer/recent-jobs?companyId=${compId}&limit=5`),
          ])

          if (!mounted) {
            setLoading(false)
            return
          }

          const [statsData, jobsData] = await Promise.all([
            statsResponse.json(),
            jobsResponse.json()
          ])

          if (mounted) {
            if (statsData.success) {
              setStats(statsData.stats)
            }

            if (jobsData.success) {
              setRecentJobs(jobsData.jobs)
            }
          }
        } else {
          // No company found - user needs to create one
          if (mounted) {
            setLoading(false)
          }
          return
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        if (mounted) {
          setLoading(false)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [supabase])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="mb-2 text-lg font-semibold text-amber-950">No employer organization linked</h3>
          <p className="mb-4 text-amber-900/90">
            Business accounts are created with a one-time invite from your admin. Ask for a new org invite link, then
            open it and accept while signed in.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your job postings and track performance</p>
        </div>
        <Button asChild>
          <Link href="/employer/manage-jobs/new">
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClicks} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">
              {stats.featuredJobs} featured jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    {job.isFeatured && (
                      <Badge className="bg-primary text-white">Featured</Badge>
                    )}
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {job.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {job.applications} applications
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employer/manage-jobs/${job.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employer/analytics/${job.id}`}>
                      Analytics
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/employer/manage-jobs/new">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/employer/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/employer/profile">
                <Settings className="h-4 w-4 mr-2" />
                Company Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Featured jobs get 3x more views</p>
                <p className="text-xs text-gray-600">Consider upgrading to featured placement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">2 jobs expiring soon</p>
                <p className="text-xs text-gray-600">Renew or repost to maintain visibility</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Views up 12% this month</p>
                <p className="text-xs text-gray-600">Your job postings are performing well</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
