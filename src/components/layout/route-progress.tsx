'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Slim coral progress bar that animates on every route change — a lightweight
 * "loading" cue shown on every page navigation (NProgress-style).
 */
export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const first = useRef(true)

  useEffect(() => {
    // Skip the very first mount so we don't flash on initial load
    if (first.current) {
      first.current = false
      return
    }

    timers.current.forEach(clearTimeout)
    timers.current = []

    setVisible(true)
    setProgress(8)
    timers.current.push(setTimeout(() => setProgress(35), 60))
    timers.current.push(setTimeout(() => setProgress(70), 220))
    timers.current.push(setTimeout(() => setProgress(92), 480))
    timers.current.push(
      setTimeout(() => {
        setProgress(100)
        timers.current.push(
          setTimeout(() => {
            setVisible(false)
            setProgress(0)
          }, 250)
        )
      }, 650)
    )

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [pathname, searchParams])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-accent shadow-[0_0_10px_rgba(255,107,107,0.7)]"
        style={{
          width: `${progress}%`,
          transition: 'width 350ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </div>
  )
}
