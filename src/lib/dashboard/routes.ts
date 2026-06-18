/**
 * Route prefixes that live inside the `(dashboard)` route group.
 *
 * The `(dashboard)/layout.tsx` is the single owner of chrome for these routes
 * (it renders the dashboard sidebar for staff/employers and the marketing
 * navbar for everyone else). The root-level ConditionalLayout must therefore
 * NEVER add its own navbar/footer on these routes — otherwise both fire and the
 * page shows two stacked navbars. Keep this list in sync with the folders under
 * `src/app/(dashboard)/`.
 */
export const DASHBOARD_ROUTE_PREFIXES = [
  '/dashboard',
  '/profile',
  '/profiles',
  '/resume-manager',
  '/bookmarks',
  '/job-alerts',
  '/interview-pro',
  '/employer',
  '/service',
  '/messages',
  '/applications',
  '/jobs',
  '/job-board',
  '/settings',
  '/feed',
] as const

/** True when `pathname` belongs to the `(dashboard)` route group. */
export function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
