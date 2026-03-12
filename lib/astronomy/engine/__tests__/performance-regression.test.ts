/**
 * @jest-environment node
 */

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

const fallbackComputeCoordinates = jest.fn();
const fallbackComputeRiseTransitSet = jest.fn();
const fallbackComputeEphemeris = jest.fn();
const fallbackSearchPhenomena = jest.fn();
const fallbackComputeAlmanac = jest.fn();

jest.mock('../backend-fallback', () => ({
  fallbackAstronomyBackend: {
    computeCoordinates: (...args: unknown[]) => fallbackComputeCoordinates(...args),
    computeRiseTransitSet: (...args: unknown[]) => fallbackComputeRiseTransitSet(...args),
    computeEphemeris: (...args: unknown[]) => fallbackComputeEphemeris(...args),
    searchPhenomena: (...args: unknown[]) => fallbackSearchPhenomena(...args),
    computeAlmanac: (...args: unknown[]) => fallbackComputeAlmanac(...args),
  },
}));

jest.mock('../backend-tauri', () => ({
  tauriAstronomyBackend: {
    computeCoordinates: jest.fn(),
    computeRiseTransitSet: jest.fn(),
    computeEphemeris: jest.fn(),
    searchPhenomena: jest.fn(),
    computeAlmanac: jest.fn(),
  },
}));

import {
  computeCoordinates,
  computeRiseTransitSet,
  invalidateAstronomyCache,
} from '../index';

const observer = {
  latitude: 39.9042,
  longitude: 116.4074,
  elevation: 50,
};

describe('engine repeated-call performance guard', () => {
  beforeEach(() => {
    invalidateAstronomyCache();
    jest.clearAllMocks();

    fallbackComputeCoordinates.mockResolvedValue({
      equatorial: { ra: 10, dec: 20 },
      horizontal: { altitude: 30, azimuth: 40 },
      galactic: { l: 120, b: -20 },
      ecliptic: { longitude: 10, latitude: 5 },
      sidereal: { gmst: 100, lst: 120, hourAngle: 10 },
      meta: {
        backend: 'fallback',
        model: 'test',
        source: 'fallback',
        degraded: true,
        computedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
        cache: 'miss',
        warnings: [],
      },
    });

    fallbackComputeRiseTransitSet.mockResolvedValue({
      riseTime: new Date('2025-01-01T18:00:00Z'),
      transitTime: new Date('2025-01-01T23:00:00Z'),
      setTime: new Date('2025-01-02T04:00:00Z'),
      transitAltitude: 65,
      currentAltitude: 40,
      currentAzimuth: 180,
      isCircumpolar: false,
      neverRises: false,
      darkImagingStart: new Date('2025-01-01T19:00:00Z'),
      darkImagingEnd: new Date('2025-01-02T03:00:00Z'),
      darkImagingHours: 8,
      meta: {
        backend: 'fallback',
        model: 'test',
        source: 'fallback',
        degraded: true,
        computedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
        cache: 'miss',
        warnings: [],
      },
    });
  });

  it('reuses cached coordinate results in repeated identical calls', async () => {
    const input = {
      coordinate: { ra: 10.68470833, dec: 41.26875 },
      observer,
      date: new Date('2025-03-15T12:00:00Z'),
      refraction: 'none' as const,
    };

    for (let i = 0; i < 20; i += 1) {
      await computeCoordinates(input);
    }

    expect(fallbackComputeCoordinates).toHaveBeenCalledTimes(1);
  });

  it('reuses cached rise/transit/set results during planner-like repeated loops', async () => {
    const request = {
      body: 'Custom' as const,
      observer,
      date: new Date('2025-03-15T12:00:00Z'),
      customCoordinate: { ra: 83.82208, dec: -5.39111 },
    };

    for (let i = 0; i < 25; i += 1) {
      await computeRiseTransitSet(request);
    }

    expect(fallbackComputeRiseTransitSet).toHaveBeenCalledTimes(1);
  });
});
