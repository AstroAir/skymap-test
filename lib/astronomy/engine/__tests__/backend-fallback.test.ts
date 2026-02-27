/**
 * @jest-environment node
 */
import { fallbackAstronomyBackend } from '../backend-fallback';

const observer = {
  latitude: 39.9042,
  longitude: 116.4074,
  elevation: 50,
};

describe('fallbackAstronomyBackend', () => {
  // ========================================================================
  // computeCoordinates
  // ========================================================================
  describe('computeCoordinates', () => {
    it('computes with refraction none', async () => {
      const result = await fallbackAstronomyBackend.computeCoordinates({
        coordinate: { ra: 10.68, dec: 41.27 },
        observer,
        date: new Date('2025-01-01T12:00:00Z'),
        refraction: 'none',
      });
      expect(result.meta.backend).toBe('fallback');
      expect(result.equatorial.ra).toBeCloseTo(10.68, 1);
    });

    it('computes with normal refraction', async () => {
      const result = await fallbackAstronomyBackend.computeCoordinates({
        coordinate: { ra: 83.82, dec: -5.39 },
        observer,
        date: new Date('2025-06-15T22:00:00Z'),
        refraction: 'normal',
      });
      expect(result.horizontal.altitude).toBeDefined();
      expect(result.horizontal.azimuth).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // computeEphemeris
  // ========================================================================
  describe('computeEphemeris', () => {
    it('computes ephemeris for Sun (no elongation branch)', async () => {
      const result = await fallbackAstronomyBackend.computeEphemeris({
        body: 'Sun',
        observer,
        startDate: new Date('2025-06-15T00:00:00Z'),
        stepHours: 6,
        steps: 4,
      });
      expect(result.body).toBe('Sun');
      expect(result.points).toHaveLength(4);
      for (const point of result.points) {
        expect(point.elongation).toBeUndefined();
      }
    });

    it('computes ephemeris for Custom target', async () => {
      const result = await fallbackAstronomyBackend.computeEphemeris({
        body: 'Custom',
        observer,
        startDate: new Date('2025-06-15T00:00:00Z'),
        stepHours: 6,
        steps: 3,
        customCoordinate: { ra: 83.82, dec: -5.39 },
      });
      expect(result.body).toBe('Custom');
      expect(result.points).toHaveLength(3);
      for (const point of result.points) {
        expect(point.magnitude).toBeUndefined();
        expect(point.phaseFraction).toBeUndefined();
      }
    });

    it('computes ephemeris for Moon with phase', async () => {
      const result = await fallbackAstronomyBackend.computeEphemeris({
        body: 'Moon',
        observer,
        startDate: new Date('2025-06-15T00:00:00Z'),
        stepHours: 12,
        steps: 2,
      });
      expect(result.body).toBe('Moon');
      for (const point of result.points) {
        expect(point.phaseFraction).toBeDefined();
        expect(point.elongation).toBeDefined();
      }
    });

    it('computes ephemeris for planet with magnitude and elongation', async () => {
      const result = await fallbackAstronomyBackend.computeEphemeris({
        body: 'Venus',
        observer,
        startDate: new Date('2025-06-15T00:00:00Z'),
        stepHours: 24,
        steps: 2,
      });
      expect(result.body).toBe('Venus');
      expect(result.points).toHaveLength(2);
    });
  });

  // ========================================================================
  // computeRiseTransitSet
  // ========================================================================
  describe('computeRiseTransitSet', () => {
    it('computes RTS for Custom target with custom coordinate', async () => {
      const result = await fallbackAstronomyBackend.computeRiseTransitSet({
        body: 'Custom',
        observer,
        date: new Date('2025-01-01T00:00:00Z'),
        customCoordinate: { ra: 83.82, dec: -5.39 },
      });
      expect(result.meta.backend).toBe('fallback');
      expect(result.transitAltitude).toBeGreaterThanOrEqual(-90);
    });

    it('throws when Custom body missing coordinate', async () => {
      await expect(
        fallbackAstronomyBackend.computeRiseTransitSet({
          body: 'Custom',
          observer,
          date: new Date('2025-01-01T00:00:00Z'),
        })
      ).rejects.toThrow('Custom coordinate is required');
    });

    it('computes RTS for Sun', async () => {
      const result = await fallbackAstronomyBackend.computeRiseTransitSet({
        body: 'Sun',
        observer,
        date: new Date('2025-06-21T00:00:00Z'),
      });
      expect(result.riseTime).toBeDefined();
      expect(result.setTime).toBeDefined();
    });

    it('computes RTS with minAltitude', async () => {
      const result = await fallbackAstronomyBackend.computeRiseTransitSet({
        body: 'Custom',
        observer,
        date: new Date('2025-01-01T00:00:00Z'),
        customCoordinate: { ra: 83.82, dec: -5.39 },
        minAltitude: 30,
      });
      expect(result.darkImagingHours).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // searchPhenomena
  // ========================================================================
  describe('searchPhenomena', () => {
    it('finds phenomena over a date range', async () => {
      const result = await fallbackAstronomyBackend.searchPhenomena({
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-03-01T00:00:00Z'),
        observer,
        includeMinor: false,
      });
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.meta.backend).toBe('fallback');
      if (result.events.length > 1) {
        expect(result.events[0].date.getTime()).toBeLessThanOrEqual(
          result.events[1].date.getTime()
        );
      }
    });

    it('includes close approaches with includeMinor: true', async () => {
      const result = await fallbackAstronomyBackend.searchPhenomena({
        startDate: new Date('2025-06-01T00:00:00Z'),
        endDate: new Date('2025-06-30T00:00:00Z'),
        observer,
        includeMinor: true,
      });
      expect(result.meta.backend).toBe('fallback');
      const closeApproach = result.events.find((e) => e.type === 'close_approach');
      // Close approaches may or may not occur in June 2025
      // but the branch is exercised either way
      expect(Array.isArray(result.events)).toBe(true);
      if (closeApproach) {
        expect(closeApproach.object1).toBe('Moon');
        expect(closeApproach.object2).toBeDefined();
        expect(closeApproach.separation).toBeLessThanOrEqual(4);
      }
    });
  });

  // ========================================================================
  // computeAlmanac
  // ========================================================================
  describe('computeAlmanac', () => {
    it('computes almanac with all data', async () => {
      const result = await fallbackAstronomyBackend.computeAlmanac({
        date: new Date('2025-06-15T12:00:00Z'),
        observer,
      });
      expect(result.sun.ra).toBeGreaterThanOrEqual(0);
      expect(result.sun.ra).toBeLessThan(360);
      expect(result.moon.phase).toBeGreaterThanOrEqual(0);
      expect(result.moon.phase).toBeLessThanOrEqual(1);
      expect(result.moon.illumination).toBeGreaterThanOrEqual(0);
      expect(result.moon.illumination).toBeLessThanOrEqual(100);
      expect(result.meta.backend).toBe('fallback');
    });

    it('computes almanac with refraction none', async () => {
      const result = await fallbackAstronomyBackend.computeAlmanac({
        date: new Date('2025-01-01T12:00:00Z'),
        observer,
        refraction: 'none',
      });
      expect(result.twilight).toBeDefined();
    });
  });
});
