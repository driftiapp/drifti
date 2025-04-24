'use client'

import { ReactNode } from 'react'

interface LoadingSpinnerProps {
  children?: ReactNode
}

export function LoadingSpinner({ children }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        {children && (
          <p className="mt-4 text-muted-foreground">
            {children}
          </p>
        )}
      </div>
    </div>
  )
} 