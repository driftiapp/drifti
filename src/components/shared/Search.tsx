'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LoadingState } from './LoadingState'

interface SearchProps {
    onSearch: (query: string) => void
    placeholder?: string
    debounceMs?: number
    className?: string
}

export function Search({
    onSearch,
    placeholder = 'Search...',
    debounceMs = 300,
    className = '',
}: SearchProps) {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const debouncedSearch = useCallback(
        (value: string) => {
            setIsLoading(true)
            const timer = setTimeout(() => {
                onSearch(value)
                setIsLoading(false)
            }, debounceMs)

            return () => clearTimeout(timer)
        },
        [onSearch, debounceMs]
    )

    useEffect(() => {
        debouncedSearch(query)
    }, [query, debouncedSearch])

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <LoadingState size={16} />
                    </div>
                )}
            </div>
        </div>
    )
} 