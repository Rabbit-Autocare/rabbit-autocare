"use client"

import { useState, useEffect } from 'react'

export default function LoadingErrorBoundary({
  children,
  loading,
  error,
  onRetry,
  timeout = 10000,
  fallback = null,
  loadingComponent = null
}) {
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setHasTimedOut(true)
      }, timeout)

      return () => clearTimeout(timer)
    } else {
      setHasTimedOut(false)
    }
  }, [loading, timeout])

  // Show loading component
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <img
            src='/assets/loader.gif'
            alt='Loading...'
            className='h-24 w-24 mx-auto mb-2'
          />
        </div>
      </div>
    );
  }

  // Show timeout error
  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Timeout</h3>
        <p className="text-gray-600 mb-4">The request is taking longer than expected.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  // Show error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  // Show fallback if no children
  if (!children && fallback) {
    return fallback
  }

  // Show children
  return children
}
