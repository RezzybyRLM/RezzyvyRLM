'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type DashboardLogoProps = {
  /** Max height in Tailwind scale; width follows aspect ratio */
  className?: string
  compact?: boolean
  href?: string
  priority?: boolean
}

/**
 * Full-color logo for dashboard surfaces (never inverted).
 * Matches marketing site usage at /logo.png.
 */
export function DashboardLogo({
  className,
  compact = false,
  href = '/',
  priority = false,
}: DashboardLogoProps) {
  const w = compact ? 40 : 152
  const h = compact ? 40 : 44
  const image = (
    <Image
      src="/logo.png"
      alt="Rezzy"
      width={w}
      height={h}
      priority={priority}
      className={cn(
        'object-contain object-left',
        compact ? 'h-9 w-9' : 'h-8 w-[152px] sm:h-9 sm:w-[168px]',
        className
      )}
    />
  )

  if (!href) return image

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
    >
      {image}
    </Link>
  )
}
