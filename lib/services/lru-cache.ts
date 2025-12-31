/**
 * LRU (Least Recently Used) Cache implementation
 * Provides efficient caching with automatic eviction of oldest entries
 */

export interface LRUCacheOptions {
  maxSize: number;
  ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private readonly maxSize: number;
  private readonly ttl?: number;

  constructor(options: LRUCacheOptions) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  set(key: K, value: V, customTtl?: number): void {
    // Delete existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const ttl = customTtl ?? this.ttl;
    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };

    this.cache.set(key, entry);
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    let pruned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }
    
    return pruned;
  }

  /**
   * Get all valid entries as an array
   */
  entries(): Array<{ key: K; value: V; timestamp: number }> {
    const now = Date.now();
    const result: Array<{ key: K; value: V; timestamp: number }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        result.push({ key, value: entry.value, timestamp: entry.timestamp });
      }
    }
    
    return result;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Request deduplication helper
 * Prevents duplicate concurrent requests for the same key
 */
export class RequestDeduplicator<K, V> {
  private pendingRequests: Map<string, Promise<V>> = new Map();

  private keyToString(key: K): string {
    if (typeof key === 'string') return key;
    return JSON.stringify(key);
  }

  async dedupe(key: K, requestFn: () => Promise<V>): Promise<V> {
    const keyStr = this.keyToString(key);
    
    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(keyStr);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = requestFn().finally(() => {
      this.pendingRequests.delete(keyStr);
    });

    this.pendingRequests.set(keyStr, request);
    return request;
  }

  get pendingCount(): number {
    return this.pendingRequests.size;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}
