import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'

export interface FilterConfig {
  key: string
  value: string | number | boolean | null | string[] | { min: number; max: number }
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in'
  type: 'text' | 'select' | 'number' | 'date' | 'multi-select' | 'range' | 'boolean'
}

export interface PaginationState<T> {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  isLoading: boolean
  error: string | null
  searchQuery: string
  hasMore: boolean
  items: T[]
  filters: FilterConfig[]
}

export interface UsePaginationOptions<T> {
  initialPage?: number
  initialPageSize?: number
  storageKey?: string
  retryCount?: number
  retryDelay?: number
  searchDelay?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSearchChange?: (query: string) => void
  onFilterChange?: (filters: FilterConfig[]) => void
  fetchData: (page: number, pageSize: number, searchQuery: string, filters: FilterConfig[]) => Promise<{
    items: T[]
    total: number
    hasMore?: boolean
  }>
}

export function usePagination<T>({
  initialPage = 1,
  initialPageSize = 10,
  storageKey,
  retryCount = 3,
  retryDelay = 1000,
  searchDelay = 300,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onFilterChange,
  fetchData,
}: UsePaginationOptions<T>) {
  const [state, setState] = useState<PaginationState<T>>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // If parsing fails, use defaults
        }
      }
    }
    return {
      currentPage: initialPage,
      pageSize: initialPageSize,
      totalItems: 0,
      totalPages: 0,
      isLoading: false,
      error: null,
      searchQuery: '',
      hasMore: false,
      items: [],
      filters: [],
    }
  })

  const debouncedSearchQuery = useDebounce(state.searchQuery, searchDelay)

  const loadData = useCallback(async (page: number, pageSize: number, searchQuery: string, filters: FilterConfig[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    let attempts = 0
    while (attempts < retryCount) {
      try {
        const { items, total, hasMore } = await fetchData(page, pageSize, searchQuery, filters)
        const totalPages = Math.ceil(total / pageSize)
        
        setState(prev => ({
          ...prev,
          currentPage: page,
          pageSize,
          totalItems: total,
          totalPages,
          isLoading: false,
          hasMore: hasMore ?? false,
          items,
          filters,
        }))
        
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify({
            currentPage: page,
            pageSize,
            totalItems: total,
            totalPages,
            searchQuery,
            hasMore: hasMore ?? false,
            items,
            filters,
          }))
        }
        
        return
      } catch (error) {
        attempts++
        if (attempts === retryCount) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          }))
        } else {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
        }
      }
    }
  }, [fetchData, retryCount, retryDelay, storageKey])

  useEffect(() => {
    loadData(state.currentPage, state.pageSize, debouncedSearchQuery, state.filters)
  }, [loadData, state.currentPage, state.pageSize, debouncedSearchQuery, state.filters])

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return
    setState(prev => ({ ...prev, currentPage: page }))
    onPageChange?.(page)
  }, [state.totalPages, onPageChange])

  const handlePageSizeChange = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size, currentPage: 1 }))
    onPageSizeChange?.(size)
  }, [onPageSizeChange])

  const handleSearchChange = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query, currentPage: 1 }))
    onSearchChange?.(query)
  }, [onSearchChange])

  const handleFilterChange = useCallback((filters: FilterConfig[]) => {
    setState(prev => ({ ...prev, filters, currentPage: 1 }))
    onFilterChange?.(filters)
  }, [onFilterChange])

  const retry = useCallback(() => {
    loadData(state.currentPage, state.pageSize, state.searchQuery, state.filters)
  }, [loadData, state.currentPage, state.pageSize, state.searchQuery, state.filters])

  return {
    ...state,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
    handleFilterChange,
    retry,
  }
} 