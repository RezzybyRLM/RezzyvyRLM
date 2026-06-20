'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { User } from '@supabase/supabase-js'
import { isDashboardPath } from '@/lib/dashboard/routes'

export function ConditionalLayout({ children, user, role }: { children: React.ReactNode, user?: User | null, role?: string | null }) {
  const pathname = usePathname()

  // Routes in the (dashboard) group and /admin own their own chrome (the
  // dashboard sidebar or the marketing navbar via (dashboard)/layout.tsx, or
  // the AdminShell). Returning bare children here is what prevents a second,
  // stacked navbar from rendering on top of them.
  const isAdminRoute = pathname.startsWith('/admin')

  if (isDashboardPath(pathname) || isAdminRoute) {
    // Return only children for dashboard/admin routes
    return <>{children}</>
  }

  // Return full layout with navbar and footer for other routes
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} role={role} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

