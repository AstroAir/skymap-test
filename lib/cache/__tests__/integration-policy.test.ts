jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

import { isTauri } from '@/lib/storage/platform';
import {
  getCachePolicy,
  getCacheProviderDiagnostics,
  getCacheIntegrationDiagnostics,
  listCachePolicies,
} from '../integration-policy';

const mockIsTauri = isTauri as jest.Mock;

describe('cache integration policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(false);
    Reflect.deleteProperty(globalThis, 'caches');
  });

  it('exposes named persistent cache policies', () => {
    const policy = getCachePolicy('hips-registry');

    expect(policy.id).toBe('hips-registry');
    expect(policy.mode).toBe('persistent-shared');
    expect(policy.strategy).toBe('network-first');
    expect(policy.ttl).toBeGreaterThan(0);
  });

  it('lists multiple audited cache policies', () => {
    const policies = listCachePolicies();

    expect(policies.length).toBeGreaterThan(3);
    expect(policies.some((policy) => policy.id === 'daily-knowledge-wikimedia')).toBe(true);
    expect(policies.some((policy) => policy.mode === 'uncached')).toBe(true);
  });

  it('reports browser cache provider diagnostics when Cache API is available', () => {
    (globalThis as typeof globalThis & { caches?: CacheStorage | undefined }).caches = {} as CacheStorage;

    const diagnostics = getCacheProviderDiagnostics();

    expect(diagnostics.providerId).toBe('browser-cache-api');
    expect(diagnostics.supportsPersistent).toBe(true);
    expect(diagnostics.supportsCleanup).toBe(false);
  });

  it('reports tauri unified cache provider diagnostics in desktop mode', () => {
    mockIsTauri.mockReturnValue(true);

    const diagnostics = getCacheProviderDiagnostics();

    expect(diagnostics.providerId).toBe('tauri-unified-cache');
    expect(diagnostics.supportsFlush).toBe(true);
    expect(diagnostics.supportsCleanup).toBe(true);
  });

  it('classifies audited integrations by persistent, local-only, and uncached modes', () => {
    (globalThis as typeof globalThis & { caches?: CacheStorage | undefined }).caches = {} as CacheStorage;

    const diagnostics = getCacheIntegrationDiagnostics();

    const hipsRegistry = diagnostics.find((item) => item.id === 'hips-registry');
    const nighttime = diagnostics.find((item) => item.id === 'nighttime-calculations');
    const issPosition = diagnostics.find((item) => item.id === 'astro-iss-position');

    expect(hipsRegistry?.cacheMode).toBe('persistent-shared');
    expect(hipsRegistry?.status).toBe('active');
    expect(nighttime?.cacheMode).toBe('local-only');
    expect(nighttime?.status).toBe('local-only');
    expect(issPosition?.cacheMode).toBe('uncached');
    expect(issPosition?.status).toBe('uncached-by-design');
  });
});
