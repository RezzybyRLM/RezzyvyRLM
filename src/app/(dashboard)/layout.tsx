import { createClient } from '@/lib/supabase/server'
import { canAccessAdminConsole, canAccessEmployerDashboard } from '@/lib/auth/permissions'
import { SidebarShell } from '@/components/dashboard/sidebar-shell'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

/**
 * Server-first dashboard chrome.
 *
 * Auth + role are resolved on the server (the proxy has already refreshed the
 * session cookies for this request), so the correct chrome is chosen on the
 * FIRST paint — no client loader, no role race, no flash, no client redirect:
 *   - staff (admin/super_admin) & employers → dashboard sidebar
 *   - everyone else (members + guests on the public /jobs and /job-board) →
 *     the marketing navbar, same as the homepage.
 *
 * Guests can only reach this layout on public paths; the proxy redirects guests
 * away from protected routes before this renders.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'user'
  let fullName: string | null = null
  let avatarUrl: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle()
    role = (profile?.role as string | undefined) ?? 'user'
    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
  }

  const usesSidebar =
    !!user && (canAccessAdminConsole(role) || canAccessEmployerDashboard(role))

  if (usesSidebar && user) {
    return (
      <SidebarShell
        role={role}
        userId={user.id}
        profile={{ full_name: fullName, avatar_url: avatarUrl, email: user.email ?? null }}
      >
        {children}
      </SidebarShell>
    )
  }

  // Members and guests get the marketing navbar layout (same as the homepage).
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
