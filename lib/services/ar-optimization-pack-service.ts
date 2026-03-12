import { smartFetch } from '@/lib/services/http-fetch';
import type { ARCameraProfile } from '@/lib/core/ar-camera-profile';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ar-optimization-pack-service');

const CACHE_KEY = 'starmap-ar-optimization-pack-v1';
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
let inMemoryPackCache: AROptimizationPack | null = null;

export interface AROptimizationPack {
  version: string;
  generatedAt: number;
  expiresAt: number;
  signature: string;
  hints: Partial<Pick<ARCameraProfile, 'resolutionTier' | 'targetFps' | 'stabilizationStrength' | 'sensorSmoothingFactor' | 'calibrationSensitivity' | 'zoomLevel'>>;
}

export interface AROptimizationPackFetchResult {
  pack: AROptimizationPack | null;
  source: 'remote' | 'cache' | 'none';
  error: string | null;
}

export interface ARLearningTelemetrySyncResult {
  ok: boolean;
  error: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isIntegrityTokenValid(token: unknown): token is string {
  return typeof token === 'string' && token.trim().length >= 16;
}

export function validateAROptimizationPack(candidate: unknown): AROptimizationPack | null {
  if (!isRecord(candidate)) return null;

  const version = candidate.version;
  const generatedAt = candidate.generatedAt;
  const expiresAt = candidate.expiresAt;
  const signature = candidate.signature;
  const hints = candidate.hints;

  if (typeof version !== 'string' || version.trim().length === 0) return null;
  if (typeof generatedAt !== 'number' || !Number.isFinite(generatedAt)) return null;
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return null;
  if (!isIntegrityTokenValid(signature)) return null;
  if (!isRecord(hints)) return null;

  return {
    version,
    generatedAt,
    expiresAt,
    signature,
    hints: {
      resolutionTier: hints.resolutionTier as AROptimizationPack['hints']['resolutionTier'],
      targetFps: typeof hints.targetFps === 'number' ? hints.targetFps : undefined,
      stabilizationStrength: typeof hints.stabilizationStrength === 'number' ? hints.stabilizationStrength : undefined,
      sensorSmoothingFactor: typeof hints.sensorSmoothingFactor === 'number' ? hints.sensorSmoothingFactor : undefined,
      calibrationSensitivity: typeof hints.calibrationSensitivity === 'number' ? hints.calibrationSensitivity : undefined,
      zoomLevel: typeof hints.zoomLevel === 'number' ? hints.zoomLevel : undefined,
    },
  };
}

function isPackFresh(pack: AROptimizationPack, now: number): boolean {
  return pack.expiresAt > now;
}

function readFreshInMemoryPack(now: number): AROptimizationPack | null {
  if (!inMemoryPackCache) return null;
  return isPackFresh(inMemoryPackCache, now) ? inMemoryPackCache : null;
}

export function readCachedAROptimizationPack(now = Date.now()): AROptimizationPack | null {
  if (typeof window === 'undefined') {
    const inMemoryPack = readFreshInMemoryPack(now);
    if (inMemoryPack) {
      logger.info('Using in-memory AR optimization pack cache', {
        version: inMemoryPack.version,
      });
    }
    return inMemoryPack;
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (typeof raw !== 'string' || raw.length === 0) {
      const inMemoryPack = readFreshInMemoryPack(now);
      if (inMemoryPack) {
        logger.info('Using in-memory AR optimization pack fallback cache', {
          version: inMemoryPack.version,
        });
      }
      return inMemoryPack;
    }
    const parsed = JSON.parse(raw) as unknown;
    const validated = validateAROptimizationPack(parsed);
    if (!validated || !isPackFresh(validated, now)) {
      const inMemoryPack = readFreshInMemoryPack(now);
      if (inMemoryPack) {
        logger.info('Using in-memory AR optimization pack fallback cache', {
          version: inMemoryPack.version,
        });
      }
      return inMemoryPack;
    }
    inMemoryPackCache = validated;
    logger.info('Using local cached AR optimization pack', {
      version: validated.version,
    });
    return validated;
  } catch (error) {
    logger.warn('Failed to parse cached AR optimization pack', error);
    const inMemoryPack = readFreshInMemoryPack(now);
    if (inMemoryPack) {
      logger.info('Using in-memory AR optimization pack fallback cache', {
        version: inMemoryPack.version,
      });
    }
    return inMemoryPack;
  }
}

export function writeCachedAROptimizationPack(pack: AROptimizationPack): void {
  inMemoryPackCache = pack;
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(pack));
    logger.info('Cached AR optimization pack', {
      version: pack.version,
      expiresAt: pack.expiresAt,
    });
  } catch (error) {
    logger.warn('Failed to cache AR optimization pack', error);
  }
}

export async function fetchAROptimizationPack(options: {
  enabled: boolean;
  url: string;
  timeoutMs?: number;
  now?: number;
  cacheTtlMs?: number;
  currentVersion?: string | null;
}): Promise<AROptimizationPackFetchResult> {
  if (!options.enabled) {
    return {
      pack: null,
      source: 'none',
      error: null,
    };
  }

  const now = options.now ?? Date.now();
  const cache = readCachedAROptimizationPack(now);

  try {
    const response = await smartFetch(options.url, {
      method: 'GET',
      timeout: options.timeoutMs ?? 6000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json<unknown>();
    const validated = validateAROptimizationPack(payload);
    if (!validated) {
      throw new Error('Invalid optimization pack payload');
    }

    if (options.currentVersion && validated.version === options.currentVersion) {
      if (cache && cache.version === validated.version && isPackFresh(cache, now)) {
        return {
          pack: cache,
          source: 'cache',
          error: null,
        };
      }
    }

    const effectiveTtl = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    const boundedPack: AROptimizationPack = {
      ...validated,
      expiresAt: Math.min(validated.expiresAt, now + effectiveTtl),
    };

    writeCachedAROptimizationPack(boundedPack);
    logger.info('Fetched AR optimization pack from remote', {
      version: boundedPack.version,
      generatedAt: boundedPack.generatedAt,
      expiresAt: boundedPack.expiresAt,
    });
    return {
      pack: boundedPack,
      source: 'remote',
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    logger.warn('Failed to fetch AR optimization pack', { message });

    const fallbackCache = cache ?? readCachedAROptimizationPack(now);
    if (fallbackCache && isPackFresh(fallbackCache, now)) {
      logger.info('Falling back to cached AR optimization pack', {
        version: fallbackCache.version,
      });
      return {
        pack: fallbackCache,
        source: 'cache',
        error: message,
      };
    }

    logger.warn('No AR optimization pack available after fetch failure', {
      message,
    });
    return {
      pack: null,
      source: 'none',
      error: message,
    };
  }
}

function sanitizeLearningPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const aggregateSignals = isRecord(payload.aggregateSignals)
    ? {
        averageSessionFps: typeof payload.aggregateSignals.averageSessionFps === 'number'
          ? payload.aggregateSignals.averageSessionFps
          : 0,
        averageRecoveryActionsPerSession: typeof payload.aggregateSignals.averageRecoveryActionsPerSession === 'number'
          ? payload.aggregateSignals.averageRecoveryActionsPerSession
          : 0,
      }
    : {
        averageSessionFps: 0,
        averageRecoveryActionsPerSession: 0,
      };

  return {
    version: payload.version ?? 1,
    acceptedRecommendations: payload.acceptedRecommendations ?? 0,
    rejectedRecommendations: payload.rejectedRecommendations ?? 0,
    repeatedManualAdjustmentCount: payload.repeatedManualAdjustmentCount ?? 0,
    aggregateSignals,
    includesRawCameraMedia: false,
  };
}

export async function syncARLearningTelemetry(options: {
  enabled: boolean;
  url: string;
  payload: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<ARLearningTelemetrySyncResult> {
  if (!options.enabled) {
    return {
      ok: false,
      error: null,
    };
  }

  const sanitized = sanitizeLearningPayload(options.payload);
  try {
    const response = await smartFetch(options.url, {
      method: 'POST',
      timeout: options.timeoutMs ?? 4000,
      body: sanitized,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}
