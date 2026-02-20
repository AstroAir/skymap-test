type CacheValue = {
  expiresAt: number;
  value: unknown;
};

const DEFAULT_TTL_MS = 60_000;

export class AstronomyEngineCache {
  private readonly store = new Map<string, CacheValue>();

  get<T>(key: string): T | undefined {
    const record = this.store.get(key);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return record.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): T {
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

