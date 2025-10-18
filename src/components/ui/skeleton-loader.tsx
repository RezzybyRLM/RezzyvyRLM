import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded-md',
        className
      )}
    />
  )
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export function CartItemSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-6 w-16 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function PricingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-12 w-24 mx-auto" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export function TestimonialSkeleton() {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 mx-auto rounded-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6 mx-auto" />
        <Skeleton className="h-6 w-4/6 mx-auto" />
      </div>
      <div className="flex items-center justify-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}
