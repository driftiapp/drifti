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

type CacheItem<T> = {
  data: T
  timestamp: number
  expiresAt: number
}

class Cache {
  private static instance: Cache
  private cache: Map<string, CacheItem<any>>
  private defaultTTL: number

  private constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }
    return Cache.instance
  }

  public set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    })
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  public delete(key: string): void {
    this.cache.delete(key)
  }

  public clear(): void {
    this.cache.clear()
  }

  public has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  public getSize(): number {
    return this.cache.size
  }

  public getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  public cleanup(): void {
    const now = Date.now()
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    })
  }
}

export const cache = Cache.getInstance()

// Helper function to create a cache key
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)

  return `${prefix}:${JSON.stringify(sortedParams)}`
}

// Helper function to cache async function results
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached) return cached

  const result = await fn()
  cache.set(key, result, ttl)
  return result
} 