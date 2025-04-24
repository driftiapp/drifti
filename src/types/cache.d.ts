declare module '@/lib/cache' {
    export interface CacheItem<T> {
        data: T
        timestamp: number
        expiresAt: number
    }

    export class Cache {
        private static instance: Cache
        private cache: Map<string, CacheItem<any>>
        private defaultTTL: number

        private constructor(defaultTTL?: number)
        public static getInstance(): Cache
        public set<T>(key: string, data: T, ttl?: number): void
        public get<T>(key: string): T | null
        public delete(key: string): void
        public clear(): void
        public has(key: string): boolean
        public getSize(): number
        public getKeys(): string[]
        public cleanup(): void
    }

    export const cache: Cache
    export function createCacheKey(prefix: string, params: Record<string, any>): string
    export function withCache<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>
} 