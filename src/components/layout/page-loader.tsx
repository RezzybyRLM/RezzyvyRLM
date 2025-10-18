'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PageLoaderProps {
  isLoading: boolean
  children: React.ReactNode
}

export function PageLoader({ isLoading, children }: PageLoaderProps) {
  const [showLoader, setShowLoader] = useState(isLoading)

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true)
    } else {
      // Delay hiding loader to ensure smooth transition
      const timer = setTimeout(() => setShowLoader(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!showLoader) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Progress bar at top */}
      <div className="h-1 w-full bg-gray-200">
        <div className="h-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
      </div>
      
      {/* Main loader content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          {/* Brand logo animation */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-2xl font-bold text-white">R</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl animate-ping opacity-20" />
          </div>
          
          {/* Loading spinner */}
          <LoadingSpinner size="lg" />
          
          {/* Loading text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-gray-900">Loading Rezzy</p>
            <p className="text-sm text-gray-600">Preparing your experience...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading page...</p>
      </div>
    </div>
  )
}

export function SectionLoader({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner size="md" />
        <p className="text-sm text-gray-500">Loading content...</p>
      </div>
    </div>
  )
}
