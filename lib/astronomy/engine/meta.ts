import type { CalculationCacheState, CalculationMeta, EngineBackend } from './types';

export function createCalculationMeta(
  backend: EngineBackend,
  model: string,
  options?: Partial<CalculationMeta>
): CalculationMeta {
  return {
    backend,
    model,
    source: options?.source ?? backend,
    degraded: options?.degraded ?? backend === 'fallback',
    computedAt: options?.computedAt ?? new Date().toISOString(),
    cache: options?.cache ?? 'miss',
    warnings: options?.warnings ? [...options.warnings] : [],
  };
}

export function withCacheState<T extends { meta: CalculationMeta }>(value: T, cache: CalculationCacheState): T {
  return {
    ...value,
    meta: {
      ...value.meta,
      cache,
      warnings: value.meta.warnings ? [...value.meta.warnings] : [],
    },
  };
}
