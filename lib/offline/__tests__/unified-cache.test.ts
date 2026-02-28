/**
 * @jest-environment jsdom
 */

// Mock the security module to bypass URL validation in tests
jest.mock('../../security/url-validator', () => ({
  validateUrl: jest.fn(),
  SecurityError: class SecurityError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SecurityError';
    }
  },
}));

import { unifiedCache, createCachedFetch, installFetchInterceptor, getOriginalFetch } from '../unified-cache';
import { validateUrl } from '../../security/url-validator';

const mockedValidateUrl = validateUrl as jest.Mock;

// Polyfill Response for jsdom
class MockResponse {
  body: string;
  status: number;
  statusText: string;
  headers: Map<string, string>;
  ok: boolean;

  constructor(body: string | null = null, init: { status?: number; statusText?: string; headers?: Record<string, string> } = {}) {
    this.body = body || '';
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }

  clone() {
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: Object.fromEntries(this.headers),
    });
  }

  async blob() {
    return new Blob([this.body]);
  }

  async text() {
    return this.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

// @ts-expect-error - Mock Response for testing
global.Response = MockResponse;

// Mock Cache API
const mockCache: {
  match: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  keys: jest.Mock;
} = {
  match: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(() => Promise.resolve([])),
};

const mockCaches = {
  open: jest.fn(() => Promise.resolve(mockCache)),
  delete: jest.fn(() => Promise.resolve(true)),
  keys: jest.fn(() => Promise.resolve([])),
  has: jest.fn(() => Promise.resolve(false)),
  match: jest.fn(),
};

Object.defineProperty(global, 'caches', {
  value: mockCaches,
  writable: true,
});

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn(() => Promise.resolve({ usage: 0, quota: 1000000000 })),
  },
  writable: true,
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('UnifiedCacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.match.mockResolvedValue(null);
    mockCache.put.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue(new MockResponse('test data', { status: 200 }));
  });

  describe('shouldCache', () => {
    it('returns true for stellarium data URLs', () => {
      expect(unifiedCache.shouldCache('/stellarium-data/test.json')).toBe(true);
      expect(unifiedCache.shouldCache('/stellarium-js/engine.wasm')).toBe(true);
    });

    it('returns true for HiPS survey URLs', () => {
      expect(unifiedCache.shouldCache('https://alasky.cds.unistra.fr/DSS/DSSColor')).toBe(true);
    });

    it('returns true for CelesTrak URLs', () => {
      expect(unifiedCache.shouldCache('https://celestrak.org/NORAD/elements/')).toBe(true);
    });

    it('returns false for non-matching URLs', () => {
      expect(unifiedCache.shouldCache('https://example.com/api/data')).toBe(false);
    });
  });

  describe('fetch with cache-first strategy', () => {
    it('returns cached response when available', async () => {
      const cachedResponse = new MockResponse('cached data', {
        status: 200,
        headers: {
          'x-cached-at': Date.now().toString(),
          'x-cache-ttl': '86400000',
        },
      });
      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-first');
      
      expect(response).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches from network when cache misses', async () => {
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('network data', { status: 200 }));

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-first');
      
      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('caches successful network responses', async () => {
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('network data', { status: 200 }));

      await unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-first');
      
      expect(mockCache.put).toHaveBeenCalled();
    });
  });

  describe('fetch with network-first strategy', () => {
    it('fetches from network first', async () => {
      mockFetch.mockResolvedValue(new MockResponse('network data', { status: 200 }));

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'network-first');
      
      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('falls back to cache when network fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const cachedResponse = new MockResponse('cached data', {
        status: 200,
        headers: {
          'x-cached-at': Date.now().toString(),
          'x-cache-ttl': '86400000',
        },
      });
      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'network-first');
      
      expect(response).toBeDefined();
    });
  });

  describe('fetch with cache-only strategy', () => {
    it('returns cached response', async () => {
      const cachedResponse = new MockResponse('cached data', {
        status: 200,
        headers: {
          'x-cached-at': Date.now().toString(),
          'x-cache-ttl': '86400000',
        },
      });
      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-only');
      
      expect(response).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws error when cache misses', async () => {
      mockCache.match.mockResolvedValue(null);

      await expect(
        unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-only')
      ).rejects.toThrow('Cache miss');
    });
  });

  describe('fetch with network-only strategy', () => {
    it('always fetches from network', async () => {
      mockFetch.mockResolvedValue(new MockResponse('network data', { status: 200 }));

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'network-only');
      
      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
      expect(mockCache.match).not.toHaveBeenCalled();
    });
  });

  describe('prefetch', () => {
    it('fetches and caches URL using network-first strategy', async () => {
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      const result = await unifiedCache.prefetch('/stellarium-data/test.json');
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
      // Should cache the response (network-first strategy calls fetchAndCache)
      expect(mockCache.put).toHaveBeenCalled();
    });

    it('returns false on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      // network-first falls back to cache, which also misses
      mockCache.match.mockResolvedValue(null);

      const result = await unifiedCache.prefetch('/stellarium-data/test.json');
      
      expect(result).toBe(false);
    });

    it('accepts custom TTL', async () => {
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      const result = await unifiedCache.prefetch('/stellarium-data/test.json', 60000);
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('prefetchAll', () => {
    it('prefetches multiple URLs', async () => {
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      const urls = [
        '/stellarium-data/test1.json',
        '/stellarium-data/test2.json',
        '/stellarium-data/test3.json',
      ];
      const results = await unifiedCache.prefetchAll(urls);
      
      expect(results.size).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('handles partial failures', async () => {
      mockFetch
        .mockResolvedValueOnce(new MockResponse('data', { status: 200 }))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new MockResponse('data', { status: 200 }));

      const urls = [
        '/stellarium-data/test1.json',
        '/stellarium-data/test2.json',
        '/stellarium-data/test3.json',
      ];
      const results = await unifiedCache.prefetchAll(urls);
      
      expect(results.get('/stellarium-data/test1.json')).toBe(true);
      expect(results.get('/stellarium-data/test2.json')).toBe(false);
      expect(results.get('/stellarium-data/test3.json')).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes cache entry', async () => {
      mockCache.delete.mockResolvedValue(true);

      const result = await unifiedCache.delete('/stellarium-data/test.json');
      
      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('clears all cache', async () => {
      await unifiedCache.clear();
      
      expect(mockCaches.delete).toHaveBeenCalled();
    });
  });

  describe('getSize', () => {
    it('returns total size of cached entries', async () => {
      // getSize now iterates cache entries and sums blob sizes
      const mockRequest1 = { url: '/stellarium-data/test1.json' };
      const mockRequest2 = { url: '/stellarium-data/test2.json' };
      mockCache.keys.mockResolvedValue([mockRequest1, mockRequest2] as unknown as Request[]);
      
      const response1 = new MockResponse('data1', { status: 200 });
      const response2 = new MockResponse('data22', { status: 200 });
      mockCache.match
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const size = await unifiedCache.getSize();
      
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });

    it('returns 0 when cache is empty', async () => {
      mockCache.keys.mockResolvedValue([]);

      const size = await unifiedCache.getSize();
      
      expect(size).toBe(0);
    });
  });

  describe('keys', () => {
    it('returns cached URLs', async () => {
      const mockRequests = [
        { url: '/stellarium-data/test1.json' },
        { url: '/stellarium-data/test2.json' },
      ];
      mockCache.keys.mockResolvedValue(mockRequests as unknown as Request[]);

      const keys = await unifiedCache.keys();
      
      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe('isOnline', () => {
    it('returns navigator.onLine status', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      expect(unifiedCache.isOnline()).toBe(true);

      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      expect(unifiedCache.isOnline()).toBe(false);
    });
  });

  describe('fetch with stale-while-revalidate strategy', () => {
    it('returns stale cache and revalidates in background', async () => {
      const cachedResponse = new MockResponse('stale data', {
        status: 200,
        headers: {
          'x-cached-at': Date.now().toString(),
          'x-cache-ttl': '86400000',
        },
      });
      mockCache.match.mockResolvedValue(cachedResponse);
      mockFetch.mockResolvedValue(new MockResponse('fresh data', { status: 200 }));

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'stale-while-revalidate');

      expect(response).toBeDefined();
      // Should return immediately from cache
      expect(mockCache.match).toHaveBeenCalled();
    });

    it('fetches from network when no cache exists', async () => {
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('network data', { status: 200 }));

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'stale-while-revalidate');

      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetch with forceNetwork option', () => {
    it('bypasses cache when forceNetwork is true', async () => {
      const cachedResponse = new MockResponse('cached data', {
        status: 200,
        headers: {
          'x-cached-at': Date.now().toString(),
          'x-cache-ttl': '86400000',
        },
      });
      mockCache.match.mockResolvedValue(cachedResponse);
      mockFetch.mockResolvedValue(new MockResponse('network data', { status: 200 }));

      const response = await unifiedCache.fetch(
        '/stellarium-data/test.json',
        { forceNetwork: true },
        'cache-first'
      );

      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetch with cacheKey option', () => {
    it('uses custom cacheKey for cache operations', async () => {
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      await unifiedCache.fetch(
        '/stellarium-data/test.json',
        { cacheKey: 'custom-key' },
        'cache-first'
      );

      // The cache should be checked/populated with the custom key
      expect(mockCache.match).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('getCacheStats and resetCacheStats', () => {
    it('tracks cache hits and misses', async () => {
      // Reset stats first
      unifiedCache.resetCacheStats();

      // Cache miss
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));
      await unifiedCache.fetch('/stellarium-data/test1.json', {}, 'cache-first');

      let stats = unifiedCache.getCacheStats();
      expect(stats.misses).toBeGreaterThanOrEqual(1);

      // Cache hit
      const cachedResponse = new MockResponse('cached', {
        status: 200,
        headers: { 'x-cached-at': Date.now().toString(), 'x-cache-ttl': '86400000' },
      });
      mockCache.match.mockResolvedValue(cachedResponse);
      await unifiedCache.fetch('/stellarium-data/test2.json', {}, 'cache-first');

      stats = unifiedCache.getCacheStats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
    });

    it('resets stats to zero', () => {
      unifiedCache.resetCacheStats();
      const stats = unifiedCache.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('computes hitRate correctly', async () => {
      unifiedCache.resetCacheStats();

      // 1 hit
      const cachedResponse = new MockResponse('cached', {
        status: 200,
        headers: { 'x-cached-at': Date.now().toString(), 'x-cache-ttl': '86400000' },
      });
      mockCache.match.mockResolvedValue(cachedResponse);
      await unifiedCache.fetch('/stellarium-data/hit.json', {}, 'cache-first');

      // 1 miss
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));
      await unifiedCache.fetch('/stellarium-data/miss.json', {}, 'cache-first');

      const stats = unifiedCache.getCacheStats();
      expect(stats.hitRate).toBeDefined();
      expect(stats.hitRate).toBeCloseTo(0.5, 1);
    });

    it('returns undefined hitRate when no requests made', () => {
      unifiedCache.resetCacheStats();
      const stats = unifiedCache.getCacheStats();
      expect(stats.hitRate).toBeUndefined();
    });
  });

  describe('URL validation for absolute URLs', () => {
    it('validates absolute HTTPS URLs', async () => {
      mockedValidateUrl.mockClear();
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      await unifiedCache.fetch('https://celestrak.org/test', {}, 'network-only');

      expect(mockedValidateUrl).toHaveBeenCalledWith('https://celestrak.org/test', { allowHttp: false });
    });

    it('skips validation for relative URLs', async () => {
      mockedValidateUrl.mockClear();
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      await unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-first');

      expect(mockedValidateUrl).not.toHaveBeenCalled();
    });

    it('throws on SecurityError for invalid URLs', async () => {
      const { SecurityError } = jest.requireMock('../../security/url-validator');
      mockedValidateUrl.mockImplementation(() => {
        throw new SecurityError('SSRF detected');
      });

      await expect(
        unifiedCache.fetch('https://evil.com/malicious', {}, 'network-only')
      ).rejects.toThrow('URL validation failed');

      // Restore
      mockedValidateUrl.mockImplementation(() => {});
    });
  });

  describe('network-first throws when both network and cache fail', () => {
    it('throws error when network fails and cache is empty', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      mockCache.match.mockResolvedValue(null);

      await expect(
        unifiedCache.fetch('/stellarium-data/test.json', {}, 'network-first')
      ).rejects.toThrow('Network error');
    });
  });

  describe('does not cache non-ok responses', () => {
    it('skips caching for 404 responses', async () => {
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('not found', { status: 404 }));

      const response = await unifiedCache.fetch('/stellarium-data/test.json', {}, 'cache-first');

      expect(response.status).toBe(404);
      expect(mockCache.put).not.toHaveBeenCalled();
    });
  });

  describe('does not cache non-cacheable URLs', () => {
    it('does not cache URLs that do not match patterns', async () => {
      mockCache.match.mockResolvedValue(null);
      mockFetch.mockResolvedValue(new MockResponse('data', { status: 200 }));

      // This URL doesn't match cacheable patterns, but we use cache-first which will still fetch
      // The non-cacheable URL won't be put in cache
      const response = await unifiedCache.fetch('/random/other.json', {}, 'cache-first');

      expect(response).toBeDefined();
      // shouldCache returns false for this URL, so put should not be called
      expect(mockCache.put).not.toHaveBeenCalled();
    });
  });
});

describe('createCachedFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.match.mockResolvedValue(null);
    mockFetch.mockResolvedValue(new MockResponse('test data', { status: 200 }));
  });

  it('creates a fetch function with caching', async () => {
    const cachedFetch = createCachedFetch('cache-first');
    
    const response = await cachedFetch('/stellarium-data/test.json');
    
    expect(response).toBeDefined();
  });

  it('only caches GET requests', async () => {
    const cachedFetch = createCachedFetch('cache-first');
    
    await cachedFetch('/stellarium-data/test.json', { method: 'POST' });
    
    expect(mockCache.put).not.toHaveBeenCalled();
  });

  it('respects custom config', async () => {
    const cachedFetch = createCachedFetch('cache-first', {
      urlPatterns: ['custom-pattern'],
    });
    
    // This URL doesn't match the custom pattern
    await cachedFetch('/stellarium-data/test.json');
    
    // Should use regular fetch without caching
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('installFetchInterceptor', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('installs fetch interceptor', () => {
    const mockFetchFn = jest.fn().mockResolvedValue(new MockResponse('data'));
    global.fetch = mockFetchFn;

    installFetchInterceptor('cache-first');

    // The global fetch should be replaced
    expect(global.fetch).not.toBe(mockFetchFn);
  });
});

describe('getOriginalFetch', () => {
  it('returns a function', () => {
    const original = getOriginalFetch();
    expect(typeof original).toBe('function');
  });
});

describe('installFetchInterceptor caching behavior', () => {
  const savedFetch = global.fetch;

  afterEach(() => {
    global.fetch = savedFetch;
  });

  it('intercepts cacheable GET requests', async () => {
    const origFn = jest.fn().mockResolvedValue(new MockResponse('data', { status: 200 }));
    global.fetch = origFn;
    // Store on window to simulate what installFetchInterceptor does
    (window as unknown as { __originalFetch: typeof fetch }).__originalFetch = origFn;

    installFetchInterceptor('cache-first');

    // Use the intercepted fetch with a cacheable URL
    mockCache.match.mockResolvedValue(null);
    const response = await global.fetch('/stellarium-data/test.json');
    expect(response).toBeDefined();
  });

  it('passes non-cacheable URLs through without caching', async () => {
    const origFn = jest.fn().mockResolvedValue(new MockResponse('data', { status: 200 }));
    global.fetch = origFn;
    (window as unknown as { __originalFetch: typeof fetch }).__originalFetch = origFn;

    installFetchInterceptor('cache-first');

    const intercepted = global.fetch;
    // Non-cacheable URL should not trigger cache.put
    const response = await intercepted('https://example.com/non-cacheable');
    expect(response).toBeDefined();
    expect(mockCache.put).not.toHaveBeenCalled();
  });

  it('does not cache POST requests on cacheable URLs', async () => {
    const origFn = jest.fn().mockResolvedValue(new MockResponse('data', { status: 200 }));
    global.fetch = origFn;
    (window as unknown as { __originalFetch: typeof fetch }).__originalFetch = origFn;

    installFetchInterceptor('cache-first');

    await global.fetch('/stellarium-data/test.json', { method: 'POST' });
    // POST should not be cached
    expect(mockCache.put).not.toHaveBeenCalled();
  });
});

describe('createCachedFetch with URL input types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.match.mockResolvedValue(null);
    mockFetch.mockResolvedValue(new MockResponse('test data', { status: 200 }));
  });

  it('handles URL object input', async () => {
    const cachedFetch = createCachedFetch('cache-first');
    const url = new URL('https://celestrak.org/test');
    const response = await cachedFetch(url);
    expect(response).toBeDefined();
  });

  it('handles Request-like object input', async () => {
    const cachedFetch = createCachedFetch('cache-first');
    // createCachedFetch extracts url from input.url for non-string, non-URL inputs
    const requestLike = { url: 'https://celestrak.org/test' } as unknown as RequestInfo;
    const response = await cachedFetch(requestLike);
    expect(response).toBeDefined();
  });
});
