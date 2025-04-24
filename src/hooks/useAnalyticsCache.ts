import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cache entries
}

export function useAnalyticsCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  const getCacheKey = useCallback((params: Record<string, any>) => {
    return JSON.stringify(params);
  }, []);

  const get = useCallback((params: Record<string, any>): T | null => {
    const key = getCacheKey(params);
    const entry = cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }, [cache, getCacheKey, ttl]);

  const set = useCallback((params: Record<string, any>, data: T) => {
    const key = getCacheKey(params);
    const newCache = new Map(cache);

    // Remove oldest entries if cache is too large
    if (newCache.size >= maxSize) {
      const oldestKey = Array.from(newCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      newCache.delete(oldestKey);
    }

    newCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    setCache(newCache);
  }, [cache, getCacheKey, maxSize]);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  // Clean up expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCache = new Map(cache);
      let hasChanges = false;

      for (const [key, entry] of newCache.entries()) {
        if (now - entry.timestamp > ttl) {
          newCache.delete(key);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setCache(newCache);
      }
    }, ttl);

    return () => clearInterval(interval);
  }, [cache, ttl]);

  return { get, set, clear };
} 