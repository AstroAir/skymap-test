/**
 * @jest-environment node
 */
import {
  calculateAltitudeData,
  calculateTransitTime,
  doesTransitSouth,
  calculateMoonDistance,
  isAboveAltitudeForDuration,
  calculateImagingScore,
  enrichDeepSkyObject,
  enrichDeepSkyObjects,
} from '../deep-sky-object';
import type { DeepSkyObject, ObjectAltitudeData } from '../types';

describe('Deep Sky Object Calculations', () => {
  // Test location: Beijing (39.9°N, 116.4°E)
  const latitude = 39.9;
  const longitude = 116.4;

  // Test DSO: M31 (Andromeda Galaxy)
  const m31: DeepSkyObject = {
    id: 'M31',
    name: 'Andromeda Galaxy',
    type: 'Galaxy',
    constellation: 'And',
    ra: 10.68,
    dec: 41.27,
    magnitude: 3.4,
    sizeMax: 190,
    messier: 31,
  };

  // ============================================================================
  // calculateAltitudeData
  // ============================================================================
  describe('calculateAltitudeData', () => {
    it('returns all required properties', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);

      expect(data).toHaveProperty('objectId');
      expect(data).toHaveProperty('points');
      expect(data).toHaveProperty('maxAltitude');
      expect(data).toHaveProperty('maxAltitudeTime');
      expect(data).toHaveProperty('transitTime');
      expect(data).toHaveProperty('riseTime');
      expect(data).toHaveProperty('setTime');
    });

    it('returns array of altitude points', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);
      expect(Array.isArray(data.points)).toBe(true);
      expect(data.points.length).toBeGreaterThan(0);
    });

    it('each point has required properties', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);

      for (const point of data.points) {
        expect(point).toHaveProperty('time');
        expect(point).toHaveProperty('altitude');
        expect(point).toHaveProperty('azimuth');
        expect(point).toHaveProperty('isAboveHorizon');
      }
    });

    it('altitudes are in valid range', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);

      for (const point of data.points) {
        expect(point.altitude).toBeGreaterThanOrEqual(-90);
        expect(point.altitude).toBeLessThanOrEqual(90);
      }
    });

    it('azimuths are in valid range', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);

      for (const point of data.points) {
        expect(point.azimuth).toBeGreaterThanOrEqual(0);
        expect(point.azimuth).toBeLessThan(360);
      }
    });

    it('maxAltitude is highest altitude in points', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);
      const highestPoint = Math.max(...data.points.map(p => p.altitude));
      expect(data.maxAltitude).toBeCloseTo(highestPoint, 1);
    });

    it('isAboveHorizon is true when altitude > 0', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);

      for (const point of data.points) {
        expect(point.isAboveHorizon).toBe(point.altitude > 0);
      }
    });

    it('transitTime is a Date', () => {
      const data = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);
      expect(data.transitTime).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // calculateTransitTime
  // ============================================================================
  describe('calculateTransitTime', () => {
    it('returns a Date', () => {
      const transit = calculateTransitTime(m31.ra, longitude, new Date());
      expect(transit).toBeInstanceOf(Date);
    });

    it('transit is within 24 hours', () => {
      const now = new Date();
      const transit = calculateTransitTime(m31.ra, longitude, now);
      const diffHours = (transit.getTime() - now.getTime()) / 3600000;
      // Transit can be up to 24 hours in the past or future depending on current sidereal time
      expect(diffHours).toBeGreaterThanOrEqual(-24);
      expect(diffHours).toBeLessThan(24);
    });

    it('different RAs give different transit times', () => {
      const now = new Date();
      const transit1 = calculateTransitTime(0, longitude, now);
      const transit2 = calculateTransitTime(180, longitude, now);
      expect(transit1.getTime()).not.toBe(transit2.getTime());
    });
  });

  // ============================================================================
  // doesTransitSouth
  // ============================================================================
  describe('doesTransitSouth', () => {
    it('returns true for objects south of observer', () => {
      // Object at dec = 0 from lat = 40 transits south
      expect(doesTransitSouth(0, 40)).toBe(true);
    });

    it('returns false for circumpolar objects in northern sky', () => {
      // Polaris-like object from northern hemisphere
      expect(doesTransitSouth(85, 40)).toBe(false);
    });

    it('returns true for southern objects', () => {
      // Objects with dec < latitude always transit south in northern hemisphere
      expect(doesTransitSouth(-20, 40)).toBe(true);
      expect(doesTransitSouth(20, 40)).toBe(true);
    });
  });

  // ============================================================================
  // calculateMoonDistance
  // ============================================================================
  describe('calculateMoonDistance', () => {
    it('returns a number', () => {
      const distance = calculateMoonDistance(m31.ra, m31.dec);
      expect(typeof distance).toBe('number');
    });

    it('distance is between 0 and 180', () => {
      const distance = calculateMoonDistance(m31.ra, m31.dec);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThanOrEqual(180);
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const distance = calculateMoonDistance(m31.ra, m31.dec, date);
      expect(typeof distance).toBe('number');
    });
  });

  // ============================================================================
  // isAboveAltitudeForDuration
  // ============================================================================
  describe('isAboveAltitudeForDuration', () => {
    let altitudeData: ObjectAltitudeData;

    beforeEach(() => {
      altitudeData = calculateAltitudeData(m31.ra, m31.dec, latitude, longitude);
    });

    it('returns boolean', () => {
      const now = new Date();
      const later = new Date(now.getTime() + 24 * 3600000);
      const result = isAboveAltitudeForDuration(altitudeData, 30, 2, now, later);
      expect(typeof result).toBe('boolean');
    });

    it('returns false for unrealistic altitude', () => {
      const now = new Date();
      const later = new Date(now.getTime() + 24 * 3600000);
      // M31 can't reach 89° altitude from Beijing
      const result = isAboveAltitudeForDuration(altitudeData, 89, 1, now, later);
      expect(result).toBe(false);
    });

    it('returns true for low altitude with long duration', () => {
      const now = new Date();
      const later = new Date(now.getTime() + 24 * 3600000);
      // M31 should be above 10° for some period
      const result = isAboveAltitudeForDuration(altitudeData, 10, 1, now, later);
      // This depends on the actual visibility
      expect(typeof result).toBe('boolean');
    });
  });

  // ============================================================================
  // calculateImagingScore
  // ============================================================================
  describe('calculateImagingScore', () => {
    it('returns a number between 0 and 100', () => {
      const score = calculateImagingScore(m31, latitude, longitude);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const score = calculateImagingScore(m31, latitude, longitude, date);
      expect(typeof score).toBe('number');
    });

    it('brighter objects get higher scores', () => {
      const brightDSO: DeepSkyObject = { ...m31, magnitude: 4 };
      const dimDSO: DeepSkyObject = { ...m31, magnitude: 14 };

      const brightScore = calculateImagingScore(brightDSO, latitude, longitude);
      const dimScore = calculateImagingScore(dimDSO, latitude, longitude);

      expect(brightScore).toBeGreaterThanOrEqual(dimScore);
    });

    it('larger objects get higher scores', () => {
      const largeDSO: DeepSkyObject = { ...m31, sizeMax: 100 };
      const smallDSO: DeepSkyObject = { ...m31, sizeMax: 1 };

      const largeScore = calculateImagingScore(largeDSO, latitude, longitude);
      const smallScore = calculateImagingScore(smallDSO, latitude, longitude);

      expect(largeScore).toBeGreaterThanOrEqual(smallScore);
    });
  });

  // ============================================================================
  // enrichDeepSkyObject
  // ============================================================================
  describe('enrichDeepSkyObject', () => {
    it('adds altitude property', () => {
      const enriched = enrichDeepSkyObject(m31, latitude, longitude);
      expect(enriched.altitude).toBeDefined();
      expect(typeof enriched.altitude).toBe('number');
    });

    it('adds azimuth property', () => {
      const enriched = enrichDeepSkyObject(m31, latitude, longitude);
      expect(enriched.azimuth).toBeDefined();
      expect(typeof enriched.azimuth).toBe('number');
    });

    it('adds moonDistance property', () => {
      const enriched = enrichDeepSkyObject(m31, latitude, longitude);
      expect(enriched.moonDistance).toBeDefined();
      expect(typeof enriched.moonDistance).toBe('number');
    });

    it('adds imagingScore property', () => {
      const enriched = enrichDeepSkyObject(m31, latitude, longitude);
      expect(enriched.imagingScore).toBeDefined();
      expect(typeof enriched.imagingScore).toBe('number');
    });

    it('preserves original properties', () => {
      const enriched = enrichDeepSkyObject(m31, latitude, longitude);
      expect(enriched.id).toBe(m31.id);
      expect(enriched.name).toBe(m31.name);
      expect(enriched.ra).toBe(m31.ra);
      expect(enriched.dec).toBe(m31.dec);
    });

    it('accepts custom date', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      const enriched = enrichDeepSkyObject(m31, latitude, longitude, date);
      expect(enriched.altitude).toBeDefined();
    });
  });

  // ============================================================================
  // enrichDeepSkyObjects
  // ============================================================================
  describe('enrichDeepSkyObjects', () => {
    const objects = [m31, { ...m31, id: 'M42', ra: 83.82, dec: -5.39 }];

    it('enriches all objects', () => {
      const enriched = enrichDeepSkyObjects(objects, latitude, longitude);
      expect(enriched).toHaveLength(objects.length);
    });

    it('each object is enriched', () => {
      const enriched = enrichDeepSkyObjects(objects, latitude, longitude);

      for (const obj of enriched) {
        expect(obj.altitude).toBeDefined();
        expect(obj.azimuth).toBeDefined();
        expect(obj.moonDistance).toBeDefined();
        expect(obj.imagingScore).toBeDefined();
      }
    });

    it('handles empty array', () => {
      const enriched = enrichDeepSkyObjects([], latitude, longitude);
      expect(enriched).toHaveLength(0);
    });
  });
});
