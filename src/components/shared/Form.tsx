'use client'

import { ReactNode } from 'react'
import { LoadingState } from './LoadingState'
import { ErrorBoundary } from './ErrorBoundary'

interface FormProps {
    onSubmit: (data: any) => void
    children: ReactNode
    isLoading?: boolean
    error?: string
    className?: string
}

export function Form({ onSubmit, children, isLoading, error, className = '' }: FormProps) {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())
        await onSubmit(data)
    }

    return (
        <ErrorBoundary>
            <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}
                {children}
                {isLoading && <LoadingState className="mt-4" />}
            </form>
        </ErrorBoundary>
    )
} 