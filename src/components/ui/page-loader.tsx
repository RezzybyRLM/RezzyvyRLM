'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface PageLoaderProps {
  isLoading?: boolean
  children: React.ReactNode
}

export function PageLoader({ isLoading = false, children }: PageLoaderProps) {
  const [showLoader, setShowLoader] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowLoader(false), 650)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true)
    } else {
      const timer = setTimeout(() => setShowLoader(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!mounted || showLoader) {
    return <BrandLoader />
  }

  return <>{children}</>
}

/** Sleek brand loader: logo inside a sweeping coral ring + a thin progress bar. */
export function BrandLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden bg-primary-100">
        <div className="h-full w-1/3 rounded-full bg-primary-500 animate-loader-bar" />
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="relative h-20 w-20">
          {/* Rotating gradient ring */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, #FF6B6B 300deg, transparent 360deg)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
              animationDuration: '0.9s',
            }}
          />
          {/* Logo */}
          <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-white">
            <Image
              src="/logo.png"
              alt="Rezzy"
              width={48}
              height={48}
              className="object-contain animate-loader-pulse"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-loader-dot" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-loader-dot" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-loader-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
