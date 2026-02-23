/**
 * @jest-environment node
 */
import {
  calculateTargetVisibility,
  getTransitTime,
} from '../target';
import { getLSTForDate } from '../../time/sidereal';

describe('Target Visibility Calculations', () => {
  // Test location: Beijing (39.9°N, 116.4°E)
  const latitude = 39.9;
  const longitude = 116.4;

  // ============================================================================
  // calculateTargetVisibility
  // ============================================================================
  describe('calculateTargetVisibility', () => {
    it('returns all required properties', () => {
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude);

      expect(visibility).toHaveProperty('riseTime');
      expect(visibility).toHaveProperty('setTime');
      expect(visibility).toHaveProperty('transitTime');
      expect(visibility).toHaveProperty('transitAltitude');
      expect(visibility).toHaveProperty('isCurrentlyVisible');
      expect(visibility).toHaveProperty('isCircumpolar');
      expect(visibility).toHaveProperty('neverRises');
      expect(visibility).toHaveProperty('imagingWindowStart');
      expect(visibility).toHaveProperty('imagingWindowEnd');
      expect(visibility).toHaveProperty('imagingHours');
      expect(visibility).toHaveProperty('darkImagingStart');
      expect(visibility).toHaveProperty('darkImagingEnd');
      expect(visibility).toHaveProperty('darkImagingHours');
    });

    it('returns valid transit altitude', () => {
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude);
      expect(visibility.transitAltitude).toBeGreaterThan(0);
      expect(visibility.transitAltitude).toBeLessThanOrEqual(90);
    });

    it('detects circumpolar objects', () => {
      // Polaris-like object
      const visibility = calculateTargetVisibility(37.95, 89, latitude, longitude);
      expect(visibility.isCircumpolar).toBe(true);
      expect(visibility.neverRises).toBe(false);
    });

    it('detects objects that never rise', () => {
      // Far southern object
      const visibility = calculateTargetVisibility(180, -70, latitude, longitude);
      expect(visibility.neverRises).toBe(true);
      expect(visibility.isCircumpolar).toBe(false);
    });

    it('sets imagingHours to 24 for circumpolar objects', () => {
      const visibility = calculateTargetVisibility(37.95, 89, latitude, longitude, 0);
      expect(visibility.imagingHours).toBe(24);
    });

    it('sets imagingHours for objects that never rise', () => {
      const visibility = calculateTargetVisibility(180, -70, latitude, longitude);
      expect(visibility.imagingHours).toBe(0);
    });

    it('respects minAltitude parameter', () => {
      const vis30 = calculateTargetVisibility(180, 45, latitude, longitude, 30);
      const vis60 = calculateTargetVisibility(180, 45, latitude, longitude, 60);
      
      // Higher threshold = shorter imaging window
      expect(vis60.imagingHours).toBeLessThanOrEqual(vis30.imagingHours);
    });

    it('returns transitTime in the future', () => {
      const now = new Date();
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude, 30, now);
      
      expect(visibility.transitTime).toBeInstanceOf(Date);
      // Transit should be within 24 hours
      const diff = visibility.transitTime!.getTime() - now.getTime();
      expect(diff).toBeGreaterThan(-1000); // Allow small negative for immediate transit
      expect(diff).toBeLessThan(24 * 3600 * 1000);
    });

    it('converts sidereal-hour deltas into solar time (minutes-level correction)', () => {
      // If we put the target 180° (12 sidereal hours) ahead of the current LST,
      // naive code would add 12 *solar* hours. Correct code must adjust by the
      // sidereal/solar ratio, yielding a ~2 minute difference.
      const now = new Date('2024-06-21T00:00:00Z');
      const lst = getLSTForDate(longitude, now);
      const ra = (lst + 180) % 360;

      const visibility = calculateTargetVisibility(ra, 0, 0, longitude, 0, now);
      expect(visibility.transitTime).toBeInstanceOf(Date);
      const naiveTransit = new Date(now.getTime() + 12 * 3600000);
      const diffMinutes = Math.abs(visibility.transitTime!.getTime() - naiveTransit.getTime()) / 60000;

      expect(diffMinutes).toBeGreaterThan(1);
      expect(diffMinutes).toBeLessThan(3);
    });

    it('rise comes before transit for non-circumpolar', () => {
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude);
      
      if (visibility.riseTime && visibility.transitTime && !visibility.isCircumpolar) {
        // Rise should be before transit
        expect(visibility.riseTime.getTime()).toBeLessThan(visibility.transitTime.getTime());
      }
    });

    it('transit comes before set for non-circumpolar', () => {
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude);
      
      if (visibility.transitTime && visibility.setTime && !visibility.isCircumpolar) {
        // Transit should be before set
        expect(visibility.transitTime.getTime()).toBeLessThan(visibility.setTime.getTime());
      }
    });

    it('calculates correct transit altitude', () => {
      // Transit altitude = 90 - |lat - dec|
      const dec = 45;
      const expectedAlt = 90 - Math.abs(latitude - dec);
      
      const visibility = calculateTargetVisibility(180, dec, latitude, longitude);
      expect(visibility.transitAltitude).toBeCloseTo(expectedAlt, 1);
    });

    it('accepts custom date parameter', () => {
      const customDate = new Date('2024-06-21T00:00:00Z');
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude, 30, customDate);
      
      expect(visibility.transitTime).toBeInstanceOf(Date);
    });

    it('dark imaging hours <= total imaging hours', () => {
      const visibility = calculateTargetVisibility(180, 45, latitude, longitude);
      expect(visibility.darkImagingHours).toBeLessThanOrEqual(visibility.imagingHours);
    });

    it('keeps dark imaging window for circumpolar targets', () => {
      const winterDate = new Date('2025-01-10T20:00:00Z');
      const visibility = calculateTargetVisibility(37.95, 89, latitude, longitude, 20, winterDate);
      expect(visibility.isCircumpolar).toBe(true);
      expect(visibility.darkImagingHours).toBeGreaterThanOrEqual(0);
      expect(visibility.imagingHours).toBe(24);
    });
  });

  // ============================================================================
  // getTransitTime
  // ============================================================================
  describe('getTransitTime', () => {
    it('returns transitLST and hoursUntilTransit', () => {
      const result = getTransitTime(180, longitude);
      
      expect(result).toHaveProperty('transitLST');
      expect(result).toHaveProperty('hoursUntilTransit');
    });

    it('transitLST equals RA', () => {
      const ra = 120;
      const result = getTransitTime(ra, longitude);
      expect(result.transitLST).toBe(ra);
    });

    it('hoursUntilTransit is between 0 and 24', () => {
      const result = getTransitTime(180, longitude);
      expect(result.hoursUntilTransit).toBeGreaterThanOrEqual(0);
      expect(result.hoursUntilTransit).toBeLessThan(24);
    });

    it('different RAs give different times', () => {
      const result1 = getTransitTime(0, longitude);
      const result2 = getTransitTime(180, longitude);
      
      expect(result1.hoursUntilTransit).not.toEqual(result2.hoursUntilTransit);
    });

    it('opposite RAs differ by ~12 hours', () => {
      const result1 = getTransitTime(0, longitude);
      const result2 = getTransitTime(180, longitude);
      
      const diff = Math.abs(result1.hoursUntilTransit - result2.hoursUntilTransit);
      expect(diff).toBeCloseTo(12, 0);
    });
  });
});
