'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  to: number
  prefix?: string
  suffix?: string
  decimals?: number
  durationMs?: number
  className?: string
}

/** Animates a number from 0 → `to` the first time it scrolls into view. */
export function CountUp({ to, prefix = '', suffix = '', decimals = 0, durationMs = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - start) / durationMs, 1)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - p, 3)
            setValue(to * eased)
            if (p < 1) requestAnimationFrame(tick)
            else setValue(to)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [to, durationMs])

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US')

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
