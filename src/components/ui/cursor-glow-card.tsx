'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CursorGlowCardProps {
  children: ReactNode
  className?: string
  /** Radius of the glow in px. */
  glow?: number
  /** Glow color (rgba string body, e.g. "255,107,107"). */
  rgb?: string
}

/**
 * Glassmorphism panel with a radial glow that tracks the cursor on hover.
 * Pure pointer-position math (no per-frame RAF) → cheap and smooth.
 */
export function CursorGlowCard({
  children,
  className,
  glow = 320,
  rgb = '255,107,107',
}: CursorGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(-9999)
  const my = useMotionValue(-9999)

  const background = useMotionTemplate`radial-gradient(${glow}px circle at ${mx}px ${my}px, rgba(${rgb},0.18), transparent 70%)`

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(e.clientX - rect.left)
    my.set(e.clientY - rect.top)
  }

  const reset = () => {
    mx.set(-9999)
    my.set(-9999)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl',
        'shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-colors duration-300',
        className
      )}
    >
      {/* Cursor-tracking glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      {/* Top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  )
}
