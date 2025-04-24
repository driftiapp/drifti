import { LRUCache } from 'lru-cache'

interface SortField {
  field: string
  direction: 'asc' | 'desc'
}

interface CacheKey {
  page: number
  pageSize: number
  sortFields: SortField[]
}

interface CacheValue {
  data: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  sortFields: SortField[]
}

const cache = new LRUCache<CacheKey, CacheValue>({
  max: 100, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes
})

export function getCacheKey(
  page: number,
  pageSize: number,
  sortFields: SortField[]
): string {
  return JSON.stringify({ page, pageSize, sortFields })
}

export function getFromCache(key: string): CacheValue | undefined {
  return cache.get(JSON.parse(key))
}

export function setInCache(key: string, value: CacheValue): void {
  cache.set(JSON.parse(key), value)
}

export function clearCache(): void {
  cache.clear()
} 