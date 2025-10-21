'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { Footer } from './footer'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
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
  ]
  
  const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route))
  
  if (isDashboardRoute) {
    // Return only children for dashboard routes
    return <>{children}</>
  }
  
  // Return full layout with navbar and footer for other routes
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

