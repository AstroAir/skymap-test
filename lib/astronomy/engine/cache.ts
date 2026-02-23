type CacheValue = {
  expiresAt: number;
  value: unknown;
};

const DEFAULT_TTL_MS = 60_000;

export class AstronomyEngineCache {
  private readonly store = new Map<string, CacheValue>();
  private readonly maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | undefined {
    const record = this.store.get(key);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Move to end so it becomes "most recently used"
    this.store.delete(key);
    this.store.set(key, record);
    return record.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): T {
    // Delete first so re-setting an existing key doesn't trigger unnecessary eviction
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, {
      expiresAt: Date.now() + Math.max(1, ttlMs),
      value,
    });
    return value;
  }

  getOrSet<T>(key: string, factory: () => T, ttlMs: number = DEFAULT_TTL_MS): T {
    const existing = this.get<T>(key);
    if (existing !== undefined) return existing;
    return this.set(key, factory(), ttlMs);
  }

  clear(): void {
    this.store.clear();
  }
}

export const astronomyEngineCache = new AstronomyEngineCache();

