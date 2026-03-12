/**
 * @jest-environment node
 */
import { fallbackAstronomyBackend } from '../backend-fallback';
import {
  compareAlmanacParity,
  compareRiseTransitSetParity,
  ENGINE_PARITY_TOLERANCE,
} from '../parity';

const observer = {
  latitude: 39.9042,
  longitude: 116.4074,
  elevation: 50,
};

describe('engine parity helpers', () => {
  it('accepts representative rise/transit/set differences within tolerance', async () => {
    const fallback = await fallbackAstronomyBackend.computeRiseTransitSet({
      body: 'Custom',
      observer,
      date: new Date('2025-06-15T12:00:00Z'),
      customCoordinate: { ra: 83.82208, dec: -5.39111 },
    });

    const tauriLike = {
      ...fallback,
      currentAltitude: fallback.currentAltitude + ENGINE_PARITY_TOLERANCE.angleDeg / 2,
      currentAzimuth: fallback.currentAzimuth + ENGINE_PARITY_TOLERANCE.angleDeg / 2,
      darkImagingHours: fallback.darkImagingHours + ENGINE_PARITY_TOLERANCE.hours / 2,
      meta: {
        ...fallback.meta,
        backend: 'tauri' as const,
        source: 'tauri' as const,
        degraded: false,
      },
    };

    expect(compareRiseTransitSetParity(tauriLike, fallback)).toEqual([]);
  });

  it('flags rise/transit/set differences beyond tolerance', async () => {
    const fallback = await fallbackAstronomyBackend.computeRiseTransitSet({
      body: 'Custom',
      observer,
      date: new Date('2025-06-15T12:00:00Z'),
      customCoordinate: { ra: 83.82208, dec: -5.39111 },
    });

    const tauriLike = {
      ...fallback,
      currentAltitude: fallback.currentAltitude + ENGINE_PARITY_TOLERANCE.angleDeg * 4,
      meta: {
        ...fallback.meta,
        backend: 'tauri' as const,
        source: 'tauri' as const,
        degraded: false,
      },
    };

    expect(compareRiseTransitSetParity(tauriLike, fallback)).toContain('currentAltitude');
  });

  it('accepts representative almanac differences within tolerance', async () => {
    const fallback = await fallbackAstronomyBackend.computeAlmanac({
      date: new Date('2025-06-15T12:00:00Z'),
      observer,
    });

    const tauriLike = {
      ...fallback,
      moon: {
        ...fallback.moon,
        phase: fallback.moon.phase + ENGINE_PARITY_TOLERANCE.phaseFraction / 2,
      },
      meta: {
        ...fallback.meta,
        backend: 'tauri' as const,
        source: 'tauri' as const,
        degraded: false,
      },
    };

    expect(compareAlmanacParity(tauriLike, fallback)).toEqual([]);
  });
});
