'use client'

import { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { cn } from '@/lib/utils'

interface ScrollAnimateProps {
  children: ReactNode
  animation?: 'fadeIn' | 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'slideUp' | 'scaleIn' | 'zoomIn'
  delay?: number
  duration?: number
  threshold?: number
  triggerOnce?: boolean
  className?: string
}

const animationClasses = {
  fadeIn: 'opacity-0 translate-y-4',
  fadeInUp: 'opacity-0 translate-y-8',
  slideInLeft: 'opacity-0 -translate-x-8',
  slideInRight: 'opacity-0 translate-x-8',
  slideUp: 'opacity-0 translate-y-12',
  scaleIn: 'opacity-0 scale-95',
  zoomIn: 'opacity-0 scale-90'
}

const animationVisibleClasses = {
  fadeIn: 'opacity-100 translate-y-0',
  fadeInUp: 'opacity-100 translate-y-0',
  slideInLeft: 'opacity-100 translate-x-0',
  slideInRight: 'opacity-100 translate-x-0',
  slideUp: 'opacity-100 translate-y-0',
  scaleIn: 'opacity-100 scale-100',
  zoomIn: 'opacity-100 scale-100'
}

export function ScrollAnimate({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  triggerOnce = true,
  className
}: ScrollAnimateProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold,
    triggerOnce,
    delay
  })

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible ? animationVisibleClasses[animation] : animationClasses[animation],
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

