'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

export type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  href?: string
  hint?: string
  /** stagger index for the entrance animation */
  index?: number
  className?: string
}

/**
 * Stitch "Rezzy Dashboard" stat card: a glassy white surface with a coral-tint
 * rounded icon square, a large tabular number, and a small uppercase label.
 * Soft shadow that lifts on hover. Becomes a link when `href` is provided.
 */
export function StatCard({ label, value, icon: Icon, href, hint, index = 0, className }: StatCardProps) {
  const body = (
    <div
      className={cn(
        'group flex h-full items-start gap-4 rounded-2xl border border-border/70 bg-white/70 p-5 shadow-card backdrop-blur-xl transition-all duration-200',
        href && 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover',
        className
      )}
    >
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10 transition-colors group-hover:bg-primary/15">
        <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text/45">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-text">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-text/45">{hint}</p>}
      </div>
      {href && (
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-text/25 transition-colors group-hover:text-primary"
          aria-hidden
        />
      )}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.28, ease: easeOut }}
      className="h-full"
    >
      {href ? (
        <Link href={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  )
}
