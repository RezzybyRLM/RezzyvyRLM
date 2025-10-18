import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading cart...</p>
      </div>
    </div>
  )
}
