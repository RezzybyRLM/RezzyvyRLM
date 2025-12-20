'use client'

import { useEffect, useState } from 'react'
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
    // Initial page load animation
    const timer = setTimeout(() => {
      setShowLoader(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true)
    } else {
      const timer = setTimeout(() => setShowLoader(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!mounted || showLoader) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        {/* Animated progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-shimmer bg-[length:200%_100%]"></div>
        </div>
        
        {/* Main loader content */}
        <div className="flex flex-col items-center space-y-6 animate-fadeIn">
          {/* Brand logo animation */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-scaleIn">
              <span className="text-3xl font-bold text-white">R</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-pulse opacity-30"></div>
          </div>
          
          {/* Loading spinner */}
          <LoadingSpinner size="lg" />
          
          {/* Loading text with animation */}
          <div className="text-center space-y-2 animate-fadeInUp">
            <p className="text-xl font-semibold text-gray-900">Loading Rezzy</p>
            <p className="text-sm text-gray-600 animate-pulse">Preparing your experience...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

