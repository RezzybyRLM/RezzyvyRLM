'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
    Calendar,
    ExternalLink,
    ChevronRight,
    Target,
    Users,
    LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
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
        let mounted = true
        const getUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!mounted) return
                if (session?.user) {
                    setUser(session.user)
                    fetchStats(session.user.id)
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
        return () => { mounted = false }
    }, [router, supabase])

    const fetchStats = async (userId: string) => {
        const [resumeResult, bookmarkResult, alertResult, interviewResult] = await Promise.all([
            supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('job_alerts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
            supabase.from('interview_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ])
        setStats({
            resumes: resumeResult.count || 0,
            bookmarks: bookmarkResult.count || 0,
            jobAlerts: alertResult.count || 0,
            interviews: interviewResult.count || 0,
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        )
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >
            {/* Welcome Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <motion.h1 variants={item} className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
                        Welcome back, {user?.email?.split('@')[0] || 'Alex'}!
                    </motion.h1>
                    <motion.p variants={item} className="text-gray-500 mt-2 text-lg">
                        Here's what's happening with your career journey today.
                    </motion.p>
                </div>
                <motion.div variants={item} className="flex gap-3">
                    <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-white hover:text-[#0F172A] hover:border-gray-300 shadow-sm transition-all" asChild>
                        <Link href="/profile">Edit Profile</Link>
                    </Button>
                    <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all font-semibold" asChild>
                        <Link href="/jobs">Browse Jobs</Link>
                    </Button>
                </motion.div>
            </section>

            {/* Stats Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Profile Views', value: '248', icon: Users, color: 'from-blue-500 to-indigo-600', trend: '+12%' },
                    { label: 'Applications', value: stats.jobAlerts + stats.bookmarks, icon: Target, color: 'from-emerald-500 to-teal-600', trend: '+5%' },
                    { label: 'Interviews', value: stats.interviews, icon: Mic, color: 'from-purple-500 to-pink-600', trend: '+2' },
                    { label: 'Resumes', value: stats.resumes, icon: FileText, color: 'from-orange-500 to-red-600', trend: 'Stable' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        whileHover={{ y: -5 }}
                        className="relative group"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity`} />
                        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                                    <p className="text-3xl font-bold text-[#0F172A] mt-1">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </section>

            {/* Recommended Jobs & Upcoming Interviews */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recommended Jobs */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#0F172A]">Recommended Jobs</h2>
                        <Link href="/jobs" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { company: 'Google', role: 'Senior UX Designer', location: 'Mountain View, CA', salary: '$160k - $220k', logo: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png' },
                            { company: 'Meta', role: 'Product Manager', location: 'Remote', salary: '$180k - $240k', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1024px-Meta_Platforms_Inc._logo.svg.png' },
                            { company: 'Airbnb', role: 'Full Stack Engineer', location: 'San Francisco, CA', salary: '$150k - $200k', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/1024px-Airbnb_Logo_B%C3%A9lo.svg.png' },
                            { company: 'Stripe', role: 'Backend Engineer', location: 'New York, NY', salary: '$170k - $230k', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/1024px-Stripe_Logo%2C_revised_2016.svg.png' },
                        ].map((job, i) => (
                            <motion.div key={i} variants={item} whileHover={{ scale: 1.02 }} className="group">
                                <Card className="border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-white border border-gray-100/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center p-2 border border-gray-100 group-hover:border-blue-100 transition-colors">
                                                <img src={job.logo} alt={job.company} className="max-w-full max-h-full object-contain" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors">{job.role}</h4>
                                                <p className="text-sm text-gray-500 font-medium">{job.company}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-none rounded-lg px-2 py-0.5 text-[10px] sm:text-xs">
                                                    {job.location}
                                                </Badge>
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none rounded-lg px-2 py-0.5 text-[10px] sm:text-xs">
                                                    {job.salary}
                                                </Badge>
                                            </div>
                                            <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0 hover:bg-blue-50 hover:text-blue-600">
                                                <Bookmark className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Interviews */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#0F172A]">Interviews</h2>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                            <Calendar className="w-4 h-4 mr-2" /> View Calendar
                        </Button>
                    </div>

                    <Card className="border-none shadow-xl shadow-gray-200/30 rounded-3xl bg-white p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="space-y-6 relative">
                            {[
                                { time: '10:00 AM', date: 'Tomorrow', title: 'Technical Interview', with: 'Google', type: 'Video Call' },
                                { time: '02:30 PM', date: 'Feb 15', title: 'HR Round', with: 'Stripe', type: 'On-site' },
                                { time: '09:00 AM', date: 'Feb 18', title: 'Product Deep Dive', with: 'Meta', type: 'Video Call' },
                            ].map((interview, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full border-2 ${i === 0 ? 'bg-blue-600 border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'bg-white border-gray-300'} z-10`} />
                                        {i !== 2 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <p className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {interview.date} • {interview.time}
                                        </p>
                                        <h5 className="font-bold text-[#0F172A] mt-1">{interview.title}</h5>
                                        <p className="text-sm text-gray-500 mt-0.5">at {interview.with}</p>
                                        <div className="mt-3 flex gap-2">
                                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold px-3 border-gray-100 hover:bg-gray-50">
                                                Details
                                            </Button>
                                            {i === 0 && (
                                                <Button size="sm" className="h-8 rounded-lg text-xs font-semibold px-3 bg-blue-600 hover:bg-blue-700 shadow-sm">
                                                    Join Call
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {stats.interviews === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">No interviews scheduled yet</p>
                                <Button variant="link" className="text-blue-600 mt-2">Start practicing</Button>
                            </div>
                        )}
                    </Card>

                    {/* Activity Feed or Resources */}
                    <Card className="border-none shadow-md rounded-3xl bg-[#0F172A] text-white p-6 overflow-hidden relative">
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full -mb-8 -mr-8 blur-2xl" />
                        <h3 className="font-bold text-lg">Pro Tip</h3>
                        <p className="text-blue-200 text-sm mt-2 leading-relaxed">
                            Users with complete profiles are 3x more likely to be seen by top recruiters. Take 5 minutes to polish your experience.
                        </p>
                        <Button variant="outline" className="mt-4 w-full rounded-xl bg-white/10 border-white/20 hover:bg-white/20 text-white h-10 border-none transition-all">
                            Complete Profile
                        </Button>
                    </Card>
                </div>
            </div>
        </motion.div>
    )
}
