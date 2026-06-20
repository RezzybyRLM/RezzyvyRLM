import { createClient } from '@/lib/supabase/server'
import { SidebarShell } from '@/components/dashboard/sidebar-shell'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

/**
 * Server-first dashboard chrome.
 *
 * Auth + role are resolved on the server (the proxy has already refreshed the
 * session cookies for this request), so the correct chrome is picked on the
 * FIRST paint — no client loader, no role race, no flash, no client redirect.
 *
 * Chrome rules:
 *   - ANY signed-in user (member / employer / admin / super_admin) → the
 *     role-aware dashboard `SidebarShell`. The sidebar contents themselves adapt
 *     to the role via `getDashboardNavigation`, so members get the job-seeker
 *     set, employers also get hiring tools, and staff also get the admin link.
 *   - Guests (only ever here on the public `/jobs` & `/job-board` routes; the
 *     proxy bounces guests off everything else) → the marketing navbar layout,
 *     identical to the homepage, so the public browsing experience is seamless.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guests on a public dashboard-group route (only /jobs & /job-board) → marketing
  // chrome. These pages are authored for the dashboard's padded content shell
  // (they use full-bleed `-mx-8` headers), so we mirror the SidebarShell content
  // container here — otherwise the page collapses into the corner.
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar user={null} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8">{children}</div>
        </main>
        <Footer />
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (profile?.role as string | undefined) ?? 'user'

  return (
    <SidebarShell
      role={role}
      userId={user.id}
      profile={{
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: user.email ?? null,
      }}
    >
      {children}
    </SidebarShell>
  )
}
