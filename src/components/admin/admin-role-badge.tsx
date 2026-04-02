import { cn } from '@/lib/utils'

const ROLE_STYLES: Record<string, string> = {
  super_admin:
    'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100',
  admin:
    'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100',
  employer:
    'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
  user: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
}

/** Human-readable labels for account roles (consistent across admin UI). */
export function formatRoleLabel(role: string | null | undefined): string {
  const r = (role || 'user').toLowerCase()
  switch (r) {
    case 'super_admin':
      return 'Super admin'
    case 'admin':
      return 'Admin'
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
        'inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium',
        style,
        className
      )}
    >
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
