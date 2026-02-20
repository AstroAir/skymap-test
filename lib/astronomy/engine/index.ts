import { isTauri } from '@/lib/storage/platform';
import { astronomyEngineCache } from './cache';
import { fallbackAstronomyBackend } from './backend-fallback';
import { tauriAstronomyBackend } from './backend-tauri';
import type {
  AlmanacRequest,
  AlmanacResponse,
  AstronomyEngineBackend,
  CoordinateComputationInput,
  CoordinateComputationResult,
  EphemerisRequest,
  EphemerisResponse,
  PhenomenaRequest,
  PhenomenaResponse,
  RiseTransitSetRequest,
  RiseTransitSetResponse,
} from './types';

const CACHE_TTL = {
  coordinates: 15_000,
  ephemeris: 30_000,
  riseTransitSet: 30_000,
  phenomena: 60_000,
  almanac: 60_000,
} as const;

function serializeCacheKey(payload: unknown): string {
  return JSON.stringify(payload, (_key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

async function withCache<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const cached = astronomyEngineCache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await factory();
  astronomyEngineCache.set(key, value, ttlMs);
  return value;
}

async function runWithFallback<T>(
  primaryAction: () => Promise<T>,
  fallbackAction: () => Promise<T>
): Promise<T> {
  if (!isTauri()) {
    return fallbackAction();
  }

  try {
    return await primaryAction();
  } catch {
    return fallbackAction();
  }
}

export function getAstronomyEngine(): AstronomyEngineBackend {
  if (isTauri()) {
    return tauriAstronomyBackend;
  }
  return fallbackAstronomyBackend;
}

export async function computeCoordinates(input: CoordinateComputationInput): Promise<CoordinateComputationResult> {
  const cacheKey = serializeCacheKey({
    operation: 'coordinates',
    coordinate: input.coordinate,
    observer: input.observer,
    date: input.date,
    refraction: input.refraction ?? 'normal',
  });

  return withCache(cacheKey, CACHE_TTL.coordinates, () => runWithFallback(
    () => tauriAstronomyBackend.computeCoordinates(input),
    () => fallbackAstronomyBackend.computeCoordinates(input)
  ));
}

export async function computeEphemeris(request: EphemerisRequest): Promise<EphemerisResponse> {
  const cacheKey = serializeCacheKey({
    operation: 'ephemeris',
    request,
  });

  return withCache(cacheKey, CACHE_TTL.ephemeris, () => runWithFallback(
    () => tauriAstronomyBackend.computeEphemeris(request),
    () => fallbackAstronomyBackend.computeEphemeris(request)
  ));
}

export async function computeRiseTransitSet(request: RiseTransitSetRequest): Promise<RiseTransitSetResponse> {
  const cacheKey = serializeCacheKey({
    operation: 'rts',
    request,
  });

  return withCache(cacheKey, CACHE_TTL.riseTransitSet, () => runWithFallback(
    () => tauriAstronomyBackend.computeRiseTransitSet(request),
    () => fallbackAstronomyBackend.computeRiseTransitSet(request)
  ));
}

export async function searchPhenomena(request: PhenomenaRequest): Promise<PhenomenaResponse> {
  const cacheKey = serializeCacheKey({
    operation: 'phenomena',
    request,
  });

  return withCache(cacheKey, CACHE_TTL.phenomena, () => runWithFallback(
    () => tauriAstronomyBackend.searchPhenomena(request),
    () => fallbackAstronomyBackend.searchPhenomena(request)
  ));
}

export async function computeAlmanac(request: AlmanacRequest): Promise<AlmanacResponse> {
  const cacheKey = serializeCacheKey({
    operation: 'almanac',
    request,
  });

  return withCache(cacheKey, CACHE_TTL.almanac, () => runWithFallback(
    () => tauriAstronomyBackend.computeAlmanac(request),
    () => fallbackAstronomyBackend.computeAlmanac(request)
  ));
}

export type * from './types';
