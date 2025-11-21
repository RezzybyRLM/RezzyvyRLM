'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  FileText, 
  Bookmark, 
  Bell, 
  Mic, 
  Briefcase,
  TrendingUp,
  Loader2,
  LogOut,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    resumes: 0,
    bookmarks: 0,
    jobAlerts: 0,
    interviews: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      
      // Fetch user profile data
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserProfile(profile as { full_name: string | null; avatar_url: string | null })
      }
      
      await fetchStats(user.id)
    }

    getUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const fetchStats = async (userId: string) => {
    try {
      // Fetch resume count
      const { count: resumeCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Fetch bookmark count
      const { count: bookmarkCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Fetch job alert count
      const { count: alertCount } = await supabase
        .from('job_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Fetch interview session count
      const { count: interviewCount } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      setStats({
        resumes: resumeCount || 0,
        bookmarks: bookmarkCount || 0,
        jobAlerts: alertCount || 0,
        interviews: interviewCount || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Update Profile',
      description: 'Manage your personal information',
      icon: User,
      href: '/profile',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Upload Resume',
      description: 'Add or update your resume',
      icon: FileText,
      href: '/resume-manager',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Practice Interview',
      description: 'Prepare with AI coaching',
      icon: Mic,
      href: '/interview-pro',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'View Jobs',
      description: 'Browse available positions',
      icon: Briefcase,
      href: '/jobs',
      color: 'bg-orange-100 text-orange-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with profile and sign out */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={100}
                height={32}
                className="object-contain"
              />
            </Link>
            
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
              </button>
              
              {/* Dropdown menu */}
              {profileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your career journey with Rezzy
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resumes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <Bookmark className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Bookmarks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bookmarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Job Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.jobAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Mic className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.interviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Resumes Uploaded</span>
                  <Badge variant="outline">{stats.resumes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Saved Jobs</span>
                  <Badge variant="outline">{stats.bookmarks}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Alerts</span>
                  <Badge variant="outline">{stats.jobAlerts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Interview Sessions</span>
                  <Badge variant="outline">{stats.interviews}</Badge>
                </div>
                <Button className="w-full mt-4" asChild>
                  <Link href="/profile">
                    Manage Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Career Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Career Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link href="/interview-pro" className="block">
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Mic className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Interview Pro</p>
                      <p className="text-sm text-gray-600">Practice with AI coach</p>
                    </div>
                  </div>
                </Link>
                <Link href="/resume-manager" className="block">
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Resume Manager</p>
                      <p className="text-sm text-gray-600">Upload and manage resumes</p>
                    </div>
                  </div>
                </Link>
                <Link href="/job-alerts" className="block">
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Bell className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Job Alerts</p>
                      <p className="text-sm text-gray-600">Set up smart notifications</p>
                    </div>
                  </div>
                </Link>
                <Link href="/jobs" className="block">
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Browse Jobs</p>
                      <p className="text-sm text-gray-600">Find your next opportunity</p>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

