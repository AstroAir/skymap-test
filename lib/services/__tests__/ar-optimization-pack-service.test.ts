/**
 * @jest-environment jsdom
 */
import {
  fetchAROptimizationPack,
  readCachedAROptimizationPack,
  syncARLearningTelemetry,
  validateAROptimizationPack,
  writeCachedAROptimizationPack,
} from '@/lib/services/ar-optimization-pack-service';

const mockSmartFetch = jest.fn();

jest.mock('@/lib/services/http-fetch', () => ({
  smartFetch: (...args: unknown[]) => mockSmartFetch(...args),
}));

describe('ar-optimization-pack-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('validates optimization pack payload', () => {
    const now = Date.now();
    const pack = validateAROptimizationPack({
      version: '2026.03.11',
      generatedAt: now,
      expiresAt: now + 1000,
      signature: '0123456789abcdef',
      hints: { targetFps: 24 },
    });

    expect(pack).not.toBeNull();
    expect(pack?.hints.targetFps).toBe(24);
  });

  it('returns remote pack when fetch succeeds', async () => {
    const now = Date.now();
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        version: '2026.03.11',
        generatedAt: now,
        expiresAt: now + 1000 * 60,
        signature: '0123456789abcdef',
        hints: { targetFps: 24, resolutionTier: '720p' },
      }),
    });

    const result = await fetchAROptimizationPack({
      enabled: true,
      url: 'https://example.com/pack.json',
      now,
    });

    expect(result.source).toBe('remote');
    expect(result.pack?.hints.targetFps).toBe(24);
  });

  it('falls back to cache when remote fetch fails', async () => {
    const now = Date.now();
    writeCachedAROptimizationPack({
      version: 'cached',
      generatedAt: now,
      expiresAt: now + 1000 * 60,
      signature: '0123456789abcdef',
      hints: { targetFps: 20 },
    });
    expect(readCachedAROptimizationPack(now)?.version).toBe('cached');

    mockSmartFetch.mockRejectedValue(new Error('network-down'));

    const result = await fetchAROptimizationPack({
      enabled: true,
      url: 'https://example.com/pack.json',
      now,
    });

    expect(result.source).toBe('cache');
    expect(result.pack?.version).toBe('cached');
    expect(result.error).toContain('network-down');
  });

  it('returns none when disabled', async () => {
    const result = await fetchAROptimizationPack({
      enabled: false,
      url: 'https://example.com/pack.json',
    });

    expect(result.source).toBe('none');
    expect(result.pack).toBeNull();
  });

  it('syncs learning telemetry with aggregate-only payload', async () => {
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    const result = await syncARLearningTelemetry({
      enabled: true,
      url: 'https://example.com/telemetry',
      payload: {
        version: 1,
        acceptedRecommendations: 2,
        aggregateSignals: {
          averageSessionFps: 24,
          averageRecoveryActionsPerSession: 1,
        },
        rawFrameBlob: 'should-not-be-sent',
      },
    });

    expect(result.ok).toBe(true);
    const payload = mockSmartFetch.mock.calls[0]?.[1]?.body as Record<string, unknown>;
    expect(payload.includesRawCameraMedia).toBe(false);
    expect('rawFrameBlob' in payload).toBe(false);
  });
});
