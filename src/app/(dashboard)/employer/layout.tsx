/**
 * Employer pages render inside the shared dashboard `SidebarShell` (the
 * `(dashboard)` group layout), which now provides the distinct dark warm-brown
 * "hiring command center" rail and the employer navigation. This layout used to
 * render a second, plain gray sidebar — that produced double chrome, so it is
 * intentionally a pass-through now. Keep it as the seam for any employer-only
 * server work (role guards, data prefetch) without re-introducing chrome.
 */
export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
