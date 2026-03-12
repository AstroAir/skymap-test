/**
 * @jest-environment node
 */
import {
  AstronomyEngineValidationError,
  computeAlmanac,
  computeCoordinates,
  computeEphemeris,
  computeRiseTransitSet,
  getAstronomyEngine,
  invalidateAstronomyCache,
  searchPhenomena,
  serializeCacheKey,
} from '../index';

describe('astronomy engine integration', () => {
  const observer = {
    latitude: 39.9042,
    longitude: 116.4074,
    elevation: 50,
  };

  beforeEach(() => {
    invalidateAstronomyCache();
  });

  it('computes coordinate systems consistently', async () => {
    const result = await computeCoordinates({
      coordinate: { ra: 10.68470833, dec: 41.26875 },
      observer,
      date: new Date('2025-01-01T12:00:00Z'),
      refraction: 'none',
    });

    expect(result.equatorial.ra).toBeGreaterThanOrEqual(0);
    expect(result.equatorial.ra).toBeLessThan(360);
    expect(result.horizontal.altitude).toBeGreaterThanOrEqual(-90);
    expect(result.horizontal.altitude).toBeLessThanOrEqual(90);
    expect(result.horizontal.azimuth).toBeGreaterThanOrEqual(0);
    expect(result.horizontal.azimuth).toBeLessThan(360);
    expect(result.meta.model.length).toBeGreaterThan(0);
    expect(result.meta.source).toBeDefined();
    expect(result.meta.computedAt).toBeTruthy();
    expect(result.meta.cache).toBe('miss');
  });

  it('computes ephemeris points for planets', async () => {
    const result = await computeEphemeris({
      body: 'Mars',
      observer,
      startDate: new Date('2025-01-01T00:00:00Z'),
      stepHours: 6,
      steps: 8,
      refraction: 'none',
    });

    expect(result.body).toBe('Mars');
    expect(result.points).toHaveLength(8);
    for (const point of result.points) {
      expect(point.ra).toBeGreaterThanOrEqual(0);
      expect(point.ra).toBeLessThan(360);
      expect(point.dec).toBeGreaterThanOrEqual(-90);
      expect(point.dec).toBeLessThanOrEqual(90);
    }
    expect(result.meta.cache).toBe('miss');
  });

  it('computes rise/transit/set for custom target', async () => {
    const result = await computeRiseTransitSet({
      body: 'Custom',
      observer,
      date: new Date('2025-01-01T00:00:00Z'),
      customCoordinate: { ra: 83.82208, dec: -5.39111 },
    });

    expect(result.transitAltitude).toBeGreaterThanOrEqual(-90);
    expect(result.transitAltitude).toBeLessThanOrEqual(90);
    expect(result.currentAzimuth).toBeGreaterThanOrEqual(0);
    expect(result.currentAzimuth).toBeLessThan(360);
    expect(result.darkImagingHours).toBeGreaterThanOrEqual(0);
    expect(result.meta.source).toBe('fallback');
    expect(result.meta.degraded).toBe(true);
  });

  it('searches phenomena over date range', async () => {
    const result = await searchPhenomena({
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-03-01T00:00:00Z'),
      observer,
      includeMinor: false,
    });

    expect(Array.isArray(result.events)).toBe(true);
    expect(result.meta.cache).toBe('miss');
    if (result.events.length > 1) {
      expect(result.events[0].date.getTime()).toBeLessThanOrEqual(result.events[1].date.getTime());
    }
  });

  it('computes almanac for selected date', async () => {
    const result = await computeAlmanac({
      date: new Date('2025-01-01T12:00:00Z'),
      observer,
    });

    expect(result.sun.ra).toBeGreaterThanOrEqual(0);
    expect(result.sun.ra).toBeLessThan(360);
    expect(result.moon.phase).toBeGreaterThanOrEqual(0);
    expect(result.moon.phase).toBeLessThanOrEqual(1);
    expect(result.moon.illumination).toBeGreaterThanOrEqual(0);
    expect(result.moon.illumination).toBeLessThanOrEqual(100);
    expect(result.twilight.darknessDuration).toBeGreaterThanOrEqual(0);
    expect(result.meta.computedAt).toBeTruthy();
  });
});

describe('getAstronomyEngine', () => {
  it('returns fallback engine in non-Tauri environment', () => {
    // In test environment (jsdom/node), isTauri() returns false
    const engine = getAstronomyEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.computeCoordinates).toBe('function');
    expect(typeof engine.computeEphemeris).toBe('function');
    expect(typeof engine.computeRiseTransitSet).toBe('function');
    expect(typeof engine.searchPhenomena).toBe('function');
    expect(typeof engine.computeAlmanac).toBe('function');
  });
});

describe('cache hit path', () => {
  beforeEach(() => {
    invalidateAstronomyCache();
  });

  it('returns cached result on second call with same params', async () => {
    const input = {
      coordinate: { ra: 10.68470833, dec: 41.26875 },
      observer: { latitude: 39.9042, longitude: 116.4074, elevation: 50 },
      date: new Date('2025-03-15T12:00:00Z'),
      refraction: 'none' as const,
    };

    const result1 = await computeCoordinates(input);
    const result2 = await computeCoordinates(input);

    // Both results should be identical (from cache)
    expect(result1.equatorial.ra).toBe(result2.equatorial.ra);
    expect(result1.equatorial.dec).toBe(result2.equatorial.dec);
    expect(result1.horizontal.altitude).toBe(result2.horizontal.altitude);
    expect(result1.meta.cache).toBe('miss');
    expect(result2.meta.cache).toBe('hit');
  });

  it('invalidates coordinate cache when observer context shifts', async () => {
    const input = {
      coordinate: { ra: 10.68470833, dec: 41.26875 },
      observer: { latitude: 39.9042, longitude: 116.4074, elevation: 50 },
      date: new Date('2025-03-15T12:00:00Z'),
      refraction: 'none' as const,
    };

    const shifted = {
      ...input,
      observer: { ...input.observer, latitude: 41.0 },
    };

    const first = await computeCoordinates(input);
    const second = await computeCoordinates(input);
    const third = await computeCoordinates(shifted);
    const fourth = await computeCoordinates(input);

    expect(first.meta.cache).toBe('miss');
    expect(second.meta.cache).toBe('hit');
    expect(third.meta.cache).toBe('miss');
    expect(fourth.meta.cache).toBe('miss');
  });

  it('supports explicit planner refresh invalidation', async () => {
    const input = {
      coordinate: { ra: 83.82208, dec: -5.39111 },
      observer: { latitude: 39.9042, longitude: 116.4074, elevation: 50 },
      date: new Date('2025-03-15T12:00:00Z'),
      refraction: 'none' as const,
    };

    const beforeRefresh = await computeCoordinates(input);
    const cached = await computeCoordinates(input);
    invalidateAstronomyCache('planner_refresh');
    const afterRefresh = await computeCoordinates(input);

    expect(beforeRefresh.meta.cache).toBe('miss');
    expect(cached.meta.cache).toBe('hit');
    expect(afterRefresh.meta.cache).toBe('miss');
  });
});

describe('input validation', () => {
  it('throws deterministic validation error for invalid observer latitude', async () => {
    await expect(
      computeCoordinates({
        coordinate: { ra: 10, dec: 20 },
        observer: { latitude: 120, longitude: 10 },
        date: new Date('2025-01-01T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(AstronomyEngineValidationError);
  });

  it('throws deterministic validation error for invalid coordinate declination', async () => {
    await expect(
      computeRiseTransitSet({
        body: 'Custom',
        observer: { latitude: 40, longitude: -74 },
        date: new Date('2025-01-01T00:00:00Z'),
        customCoordinate: { ra: 10, dec: -120 },
      }),
    ).rejects.toBeInstanceOf(AstronomyEngineValidationError);
  });

  it('throws deterministic validation error for invalid date range', async () => {
    await expect(
      searchPhenomena({
        observer: { latitude: 40, longitude: -74 },
        startDate: new Date('2025-02-01T00:00:00Z'),
        endDate: new Date('2025-01-01T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(AstronomyEngineValidationError);
  });
});

describe('serializeCacheKey', () => {
  it('should truncate Date milliseconds to second precision', () => {
    const date1 = new Date('2025-01-01T12:00:00.123Z');
    const date2 = new Date('2025-01-01T12:00:00.987Z');

    const key1 = serializeCacheKey({ date: date1 });
    const key2 = serializeCacheKey({ date: date2 });

    expect(key1).toBe(key2);
    expect(key1).toContain('2025-01-01T12:00:00.000Z');
  });

  it('should produce different keys for dates 1 second apart', () => {
    const date1 = new Date('2025-01-01T12:00:00.500Z');
    const date2 = new Date('2025-01-01T12:00:01.500Z');

    const key1 = serializeCacheKey({ date: date1 });
    const key2 = serializeCacheKey({ date: date2 });

    expect(key1).not.toBe(key2);
  });

  it('should serialize non-Date values normally', () => {
    const key = serializeCacheKey({ name: 'Mars', value: 42, flag: true });
    expect(key).toBe('{"name":"Mars","value":42,"flag":true}');
  });

  it('should handle nested Dates', () => {
    const payload = {
      observer: { lat: 39.9 },
      date: new Date('2025-06-15T03:00:00.456Z'),
    };
    const key = serializeCacheKey(payload);
    expect(key).toContain('2025-06-15T03:00:00.000Z');
    expect(key).not.toContain('.456');
  });
});
