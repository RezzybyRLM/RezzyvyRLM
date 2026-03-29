'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { User } from '@supabase/supabase-js'

export function ConditionalLayout({ children, user }: { children: React.ReactNode, user?: User | null }) {
  const pathname = usePathname()

  // Dashboard routes that should not show navbar/footer (use sidebar instead)
  // These routes are in the (dashboard) folder group and use DashboardLayout
  const dashboardRoutes = [
    '/dashboard',
    '/profile',
    '/resume-manager',
    '/bookmarks',
    '/job-alerts',
    '/interview-pro',
    '/employer',
    '/feed',
    '/messages',
    '/applications',
    '/profiles',
  ]

  // Check if it's exactly /jobs (listing page) or /jobs/[jobId] (detail page)
  // Both are in (dashboard) folder and should use sidebar
  const isJobsPage = pathname === '/jobs' || pathname.startsWith('/jobs/')
  const isAdminRoute = pathname.startsWith('/admin')

  const isDashboardRoute =
    dashboardRoutes.some((route) => pathname.startsWith(route)) || isJobsPage

  if (isDashboardRoute || isAdminRoute) {
    // Return only children for dashboard routes
    return <>{children}</>
  }

  // Return full layout with navbar and footer for other routes
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

