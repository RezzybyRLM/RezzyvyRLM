'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { User } from '@supabase/supabase-js'

export function ConditionalLayout({ children, user }: { children: React.ReactNode, user?: User | null }) {
  const pathname = usePathname()
  
  // Dashboard routes that should not show navbar/footer
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
  
  // Check if it's exactly /jobs (listing page) but not /jobs/[jobId] (detail page)
  const isJobsListingPage = pathname === '/jobs' || pathname === '/jobs/'
  const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route)) || isJobsListingPage
  
  if (isDashboardRoute) {
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

