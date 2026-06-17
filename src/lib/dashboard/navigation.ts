import type { LucideIcon } from 'lucide-react'
import {
  LayoutGrid,
  UserRound,
  BriefcaseBusiness,
  MessageSquare,
  FileStack,
  Bookmark,
  BellRing,
  Headphones,
  Building2,
  Shield,
  ClipboardList,
} from 'lucide-react'

export type DashboardNavGroup = 'main' | 'hiring' | 'staff'

export type DashboardNavItem = {
  name: string
  href: string
  icon: LucideIcon
  group: DashboardNavGroup
}

const MAIN: DashboardNavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid, group: 'main' },
  { name: 'Profile', href: '/profile', icon: UserRound, group: 'main' },
  { name: 'Jobs', href: '/job-board', icon: BriefcaseBusiness, group: 'main' },
  { name: 'Messages', href: '/messages', icon: MessageSquare, group: 'main' },
  { name: 'Resume Manager', href: '/resume-manager', icon: FileStack, group: 'main' },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark, group: 'main' },
  { name: 'Job Alerts', href: '/job-alerts', icon: BellRing, group: 'main' },
  { name: 'Interview Pro', href: '/interview-pro', icon: Headphones, group: 'main' },
]

/**
 * Sidebar / mobile nav items depend on role: staff see Admin, employers see Hiring tools, members see the core job seeker set.
 */
export function getDashboardNavigation(appRole: string | null): DashboardNavItem[] {
  const r = appRole ?? 'user'

  if (r === 'admin' || r === 'super_admin') {
    return [
      { name: 'Admin console', href: '/admin/dashboard', icon: Shield, group: 'staff' },
      ...MAIN,
    ]
  }

  if (r === 'employer') {
    return [
      MAIN[0],
      { name: 'Employer hub', href: '/employer', icon: Building2, group: 'hiring' },
      { name: 'Manage listings', href: '/employer/manage-jobs', icon: ClipboardList, group: 'hiring' },
      ...MAIN.slice(1),
    ]
  }

  return MAIN
}

export function navGroupLabel(group: DashboardNavGroup): string | null {
  if (group === 'staff') return 'Staff'
  if (group === 'hiring') return 'Hiring'
  return null
}
