import { renderHook, act } from '@testing-library/react'
import { useDataFetching } from '../useDataFetching'
import { cache } from '@/lib/cache'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock cache
jest.mock('@/lib/cache', () => ({
    cache: {
        get: jest.fn(),
        set: jest.fn(),
    },
    createCacheKey: jest.fn(),
}))

describe('useDataFetching', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('fetches data successfully', async () => {
        const mockData = { id: 1, name: 'Test' }
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData),
        })

        const { result } = renderHook(() => useDataFetching('/api/test'))

        expect(result.current.isLoading).toBe(true)
        expect(result.current.data).toBe(null)
        expect(result.current.error).toBe(null)

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toEqual(mockData)
        expect(result.current.error).toBe(null)
        expect(cache.set).toHaveBeenCalled()
    })

    it('uses cached data when available', async () => {
        const mockData = { id: 1, name: 'Test' }
            ; (cache.get as jest.Mock).mockReturnValueOnce(mockData)

        const { result } = renderHook(() => useDataFetching('/api/test'))

        expect(result.current.isLoading).toBe(true)

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toEqual(mockData)
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('handles fetch errors', async () => {
        const error = new Error('Network error')
        mockFetch.mockRejectedValueOnce(error)

        const { result } = renderHook(() => useDataFetching('/api/test'))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toBe(null)
        expect(result.current.error).toBe(error)
    })

    it('retries on failure', async () => {
        const mockData = { id: 1, name: 'Test' }
        mockFetch
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
            })

        const { result } = renderHook(() =>
            useDataFetching('/api/test', { retryCount: 2, retryDelay: 100 })
        )

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toEqual(mockData)
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('refetches data when refetch is called', async () => {
        const mockData1 = { id: 1, name: 'Test 1' }
        const mockData2 = { id: 2, name: 'Test 2' }

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData1),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData2),
            })

        const { result } = renderHook(() => useDataFetching('/api/test'))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.data).toEqual(mockData1)

        await act(async () => {
            await result.current.refetch()
        })

        expect(result.current.data).toEqual(mockData2)
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })
}) 