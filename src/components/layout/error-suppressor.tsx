'use client'

import { useEffect } from 'react'

/**
 * Suppresses CORS and network errors from third-party scripts
 * that may be injected by browser extensions or external services
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Suppress unhandled promise rejections from third-party scripts
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = error?.message || ''
      const errorStack = error?.stack || ''
      
      // Check if this is a CORS/network error from a third-party script
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_ABORTED') ||
        errorMessage.includes('CORS') ||
        errorMessage.includes('NetworkError') ||
        errorStack.includes('feedback.js') ||
        errorStack.includes('www.rezzybyrlm.us')
      ) {
        // Suppress the error silently
        event.preventDefault()
        // Optionally log in development
        if (process.env.NODE_ENV === 'development') {
          console.debug('Suppressed third-party script error:', errorMessage)
        }
      }
    }

    // Suppress fetch errors from third-party scripts
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).catch((error) => {
        // Only suppress CORS errors, not other fetch errors
        if (
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('ERR_ABORTED') ||
          error.message?.includes('CORS')
        ) {
          // Check if it's from a third-party domain
          const url = args[0]?.toString() || ''
          if (
            url.includes('www.rezzybyrlm.us') ||
            url.includes('feedback.js') ||
            !url.startsWith(window.location.origin)
          ) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('Suppressed CORS error from third-party script:', url)
            }
            return Promise.reject(error)
          }
        }
        throw error
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.fetch = originalFetch
    }
  }, [])

  return null
}

