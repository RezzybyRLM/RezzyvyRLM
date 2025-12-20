'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { LoadingSpinner } from './loading-spinner'

interface PageLoaderProps {
  isLoading?: boolean
  children: React.ReactNode
}

export function PageLoader({ isLoading = false, children }: PageLoaderProps) {
  const [showLoader, setShowLoader] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Initial page load animation - reduced for faster experience
    const timer = setTimeout(() => {
      setShowLoader(false)
    }, 800) // Reduced to 800ms for faster loading

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true)
    } else {
      const timer = setTimeout(() => setShowLoader(false), 500) // Increased from 300ms to 500ms
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!mounted || showLoader) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        {/* Animated progress bar with theme colors */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-shimmer bg-[length:200%_100%]"></div>
        </div>
        
        {/* Main loader content */}
        <div className="flex flex-col items-center space-y-6 animate-fadeIn">
          {/* Brand logo animation */}
          <div className="relative">
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center animate-scaleIn">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={160}
                height={160}
                className="object-contain animate-float"
                priority
              />
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
            </div>
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
          {/* Loading spinner with theme colors */}
          <div className="relative">
            <LoadingSpinner size="lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
          </div>
          
          {/* Loading text with animation */}
          <div className="text-center space-y-2 animate-fadeInUp">
            <p className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading Rezzy
            </p>
            <p className="text-sm text-gray-600 animate-pulse">Preparing your experience...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

