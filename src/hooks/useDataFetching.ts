import { useState, useEffect, useCallback } from 'react'
import { cache, createCacheKey } from '@/lib/cache'
import { trackError } from '@/lib/monitoring'

interface FetchOptions {
    cacheKey?: string
    cacheTTL?: number
    retryCount?: number
    retryDelay?: number
}

interface FetchState<T> {
    data: T | null
    isLoading: boolean
    error: Error | null
}

export function useDataFetching<T>(
    url: string,
    options: FetchOptions = {}
): FetchState<T> & {
    refetch: () => Promise<void>
} {
    const {
        cacheKey = url,
        cacheTTL = 5 * 60 * 1000, // 5 minutes
        retryCount = 3,
        retryDelay = 1000,
    } = options

    const [state, setState] = useState<FetchState<T>>({
        data: null,
        isLoading: true,
        error: null,
    })

    const fetchData = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        try {
            // Check cache first
            const cachedData = cache.get<T>(cacheKey)
            if (cachedData) {
                setState({ data: cachedData, isLoading: false, error: null })
                return
            }

            // Fetch with retries
            let lastError: Error | null = null
            for (let i = 0; i < retryCount; i++) {
                try {
                    const response = await fetch(url)
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }
                    const data = await response.json()

                    // Cache the result
                    cache.set(cacheKey, data, cacheTTL)

                    setState({ data, isLoading: false, error: null })
                    return
                } catch (error) {
                    lastError = error as Error
                    if (i < retryCount - 1) {
                        await new Promise((resolve) => setTimeout(resolve, retryDelay))
                    }
                }
            }

            throw lastError
        } catch (error) {
            const err = error as Error
            trackError(err, { url, cacheKey })
            setState({ data: null, isLoading: false, error: err })
        }
    }, [url, cacheKey, cacheTTL, retryCount, retryDelay])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        ...state,
        refetch: fetchData,
    }
}

// Helper function to create a cache key for API requests
export function createApiCacheKey(
    endpoint: string,
    params: Record<string, any> = {}
): string {
    return createCacheKey(`api:${endpoint}`, params)
}

// Helper function to handle API errors
export function handleApiError(error: unknown): Error {
    if (error instanceof Error) {
        return error
    }
    if (typeof error === 'string') {
        return new Error(error)
    }
    return new Error('An unknown error occurred')
} 