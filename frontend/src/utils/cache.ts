interface CacheItem<T> {
  data: T;
  timestamp: number;
  etag?: string | undefined;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items to store
  staleWhileRevalidate?: boolean; // Whether to return stale data while revalidating
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  private ttl: number;
  private maxSize: number;
  private staleWhileRevalidate: boolean;
  private revalidationPromises: Map<string, Promise<any>>;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
    this.maxSize = options.maxSize || 100;
    this.staleWhileRevalidate = options.staleWhileRevalidate || false;
    this.revalidationPromises = new Map();
  }

  set<T>(key: string, data: T, etag?: string): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
    });
  }

  async get<T>(key: string, revalidateFn?: () => Promise<T>): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      if (revalidateFn) {
        return this.revalidate(key, revalidateFn);
      }
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      if (revalidateFn) {
        // Return stale data while revalidating if enabled
        if (this.staleWhileRevalidate) {
          this.revalidate(key, revalidateFn).catch(console.error);
          return item.data as T;
        }
        return this.revalidate(key, revalidateFn);
      }
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private async revalidate<T>(key: string, revalidateFn: () => Promise<T>): Promise<T> {
    // Prevent multiple simultaneous revalidations
    if (this.revalidationPromises.has(key)) {
      return this.revalidationPromises.get(key);
    }

    const revalidationPromise = revalidateFn()
      .then(data => {
        this.set(key, data);
        return data;
      })
      .finally(() => {
        this.revalidationPromises.delete(key);
      });

    this.revalidationPromises.set(key, revalidationPromise);

    return revalidationPromise;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.revalidationPromises.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.revalidationPromises.clear();
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Create a singleton instance
const apiCache = new Cache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
});

export default apiCache; 