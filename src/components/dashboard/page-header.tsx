'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

/**
 * Consistent dashboard page header across every account type.
 *
 * Stitch "Rezzy Dashboard" system: a large semibold title with tight tracking,
 * a muted subtitle, and an optional right-aligned actions slot — separated from
 * the content by a hairline rule. Animates in softly via Framer Motion.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  className,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  eyebrow?: string
  className?: string
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className={cn(
        'flex flex-col justify-between gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-text md:text-[1.7rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm text-text/55 md:text-[0.95rem]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  )
}
