import { cn } from '@/lib/utils'

// Soft, on-brand, role-distinct pills. Each pairs a tinted background + matching
// text with a small status dot so roles are scannable at a glance.
const ROLE_STYLES: Record<string, { wrap: string; dot: string }> = {
  super_admin: { wrap: 'border-accent/20 bg-accent/10 text-accent', dot: 'bg-accent' },
  admin: { wrap: 'border-primary/25 bg-primary/10 text-primary-700', dot: 'bg-primary' },
  service_team: { wrap: 'border-violet-200 bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  employer: { wrap: 'border-amber-200 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  user: { wrap: 'border-slate-200 bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
}

/** Human-readable labels for account roles (consistent across admin UI). */
export function formatRoleLabel(role: string | null | undefined): string {
  const r = (role || 'user').toLowerCase()
  switch (r) {
    case 'super_admin':
      return 'Super admin'
    case 'admin':
      return 'Admin'
    case 'service_team':
      return 'Service team'
    case 'employer':
      return 'Employer'
    case 'user':
    default:
      return 'User'
  }
}

export function AdminRoleBadge({
  role,
  className,
}: {
  role: string | null | undefined
  className?: string
}) {
  const key = (role || 'user').toLowerCase()
  const style = ROLE_STYLES[key] ?? ROLE_STYLES.user
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        style.wrap,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden />
      {formatRoleLabel(role)}
    </span>
  )
}

/** Short US-style date for admin tables (e.g. 12/21/2025). */
export function formatAdminTableDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return '—'
  }
}
