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

import { unifiedCache, createCachedFetch, installFetchInterceptor } from '../unified-cache';

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
