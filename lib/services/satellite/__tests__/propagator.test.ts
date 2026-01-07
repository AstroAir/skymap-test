/**
 * Tests for propagator.ts
 */

import {
  parseTLE,
  parseTLEText,
  getSatellitePosition,
  getGroundTrack,
} from '../propagator';
import type { TLEData } from '../types';

describe('satellite propagator', () => {
  // Sample TLE data for ISS
  const sampleTLEName = 'ISS (ZARYA)';
  const sampleTLELine1 = '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9999';
  const sampleTLELine2 = '2 25544  51.6400 208.9163 0006703 292.6893  67.3566 15.50000000000000';

  describe('parseTLE', () => {
    it('should parse valid TLE lines', () => {
      const result = parseTLE(sampleTLEName, sampleTLELine1, sampleTLELine2);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('ISS (ZARYA)');
      expect(result?.catalogNumber).toBe(25544);
    });

    it('should extract epoch year and day', () => {
      const result = parseTLE(sampleTLEName, sampleTLELine1, sampleTLELine2);

      expect(result?.epochYear).toBe(2024);
      expect(result?.epochDay).toBeCloseTo(1.5, 1);
    });

    it('should extract orbital elements', () => {
      const result = parseTLE(sampleTLEName, sampleTLELine1, sampleTLELine2);

      expect(result?.inclination).toBeCloseTo(51.64, 2);
      expect(result?.raan).toBeCloseTo(208.9163, 2);
      expect(result?.eccentricity).toBeCloseTo(0.0006703, 6);
      expect(result?.argOfPerigee).toBeCloseTo(292.6893, 2);
      expect(result?.meanAnomaly).toBeCloseTo(67.3566, 2);
      expect(result?.meanMotion).toBeCloseTo(15.5, 1);
    });

    it('should store original TLE lines', () => {
      const result = parseTLE(sampleTLEName, sampleTLELine1, sampleTLELine2);

      expect(result?.line1).toBe(sampleTLELine1);
      expect(result?.line2).toBe(sampleTLELine2);
    });

    it('should handle Y2K epoch year correctly', () => {
      const line1With00 = '1 25544U 98067A   00001.50000000  .00016717  00000-0  10270-3 0  9999';
      const result = parseTLE('TEST', line1With00, sampleTLELine2);

      expect(result?.epochYear).toBe(2000);
    });

    it('should handle pre-2000 epoch year correctly', () => {
      const line1With99 = '1 25544U 98067A   99001.50000000  .00016717  00000-0  10270-3 0  9999';
      const result = parseTLE('TEST', line1With99, sampleTLELine2);

      expect(result?.epochYear).toBe(1999);
    });

    it('should return object with NaN values for invalid TLE', () => {
      const result = parseTLE('TEST', 'invalid', 'invalid');

      // parseTLE returns an object with NaN values for invalid input
      // rather than null (parsing doesn't throw on malformed data)
      expect(result).not.toBeNull();
      expect(result?.catalogNumber).toBeNaN();
      expect(result?.epochYear).toBeNaN();
    });

    it('should trim whitespace from name', () => {
      const result = parseTLE('  ISS (ZARYA)  ', sampleTLELine1, sampleTLELine2);

      expect(result?.name).toBe('ISS (ZARYA)');
    });
  });

  describe('parseTLEText', () => {
    it('should parse multiple TLEs from text', () => {
      const text = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9999
2 25544  51.6400 208.9163 0006703 292.6893  67.3566 15.50000000000000
HST
1 20580U 90037B   24001.50000000  .00001234  00000-0  12345-4 0  9999
2 20580  28.4700  98.7654 0002812 123.4567 234.5678 15.09876543210000`;

      const result = parseTLEText(text);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('ISS (ZARYA)');
      expect(result[1].name).toBe('HST');
    });

    it('should handle empty text', () => {
      const result = parseTLEText('');

      expect(result).toHaveLength(0);
    });

    it('should handle text with only whitespace', () => {
      const result = parseTLEText('   \n   \n   ');

      expect(result).toHaveLength(0);
    });

    it('should skip invalid TLE entries', () => {
      const text = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9999
2 25544  51.6400 208.9163 0006703 292.6893  67.3566 15.50000000000000
INVALID ENTRY
not a tle line 1
not a tle line 2
HST
1 20580U 90037B   24001.50000000  .00001234  00000-0  12345-4 0  9999
2 20580  28.4700  98.7654 0002812 123.4567 234.5678 15.09876543210000`;

      const result = parseTLEText(text);

      // Should only parse valid TLEs
      expect(result.length).toBe(2);
    });

    it('should handle Windows line endings', () => {
      const text = `ISS (ZARYA)\r\n1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9999\r\n2 25544  51.6400 208.9163 0006703 292.6893  67.3566 15.50000000000000`;

      const result = parseTLEText(text);

      expect(result.length).toBe(1);
    });

    it('should validate TLE line prefixes', () => {
      const text = `SATELLITE
A 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9999
B 25544  51.6400 208.9163 0006703 292.6893  67.3566 15.50000000000000`;

      const result = parseTLEText(text);

      // Invalid prefixes should be rejected
      expect(result).toHaveLength(0);
    });
  });

  describe('getSatellitePosition', () => {
    const mockTLE: TLEData = {
      name: 'ISS (ZARYA)',
      line1: sampleTLELine1,
      line2: sampleTLELine2,
      catalogNumber: 25544,
      epochYear: 2024,
      epochDay: 1.5,
      inclination: 51.64,
      raan: 208.9163,
      eccentricity: 0.0006703,
      argOfPerigee: 292.6893,
      meanAnomaly: 67.3566,
      meanMotion: 15.5,
    };

    it('should calculate satellite position', () => {
      const date = new Date('2024-01-02T00:00:00Z');
      const result = getSatellitePosition(mockTLE, date, 0, 0);

      expect(result).not.toBeNull();
      expect(result?.latitude).toBeDefined();
      expect(result?.longitude).toBeDefined();
      expect(result?.altitude).toBeDefined();
    });

    it('should return position within valid ranges', () => {
      const date = new Date();
      const result = getSatellitePosition(mockTLE, date, 40, -74);

      expect(result).not.toBeNull();
      expect(result!.latitude).toBeGreaterThanOrEqual(-90);
      expect(result!.latitude).toBeLessThanOrEqual(90);
      expect(result!.longitude).toBeGreaterThanOrEqual(-180);
      expect(result!.longitude).toBeLessThanOrEqual(180);
    });

    it('should calculate azimuth and elevation', () => {
      const date = new Date();
      const result = getSatellitePosition(mockTLE, date, 40.7128, -74.006);

      expect(result?.azimuth).toBeDefined();
      expect(result?.elevation).toBeDefined();
      expect(result!.azimuth).toBeGreaterThanOrEqual(0);
      expect(result!.azimuth).toBeLessThan(360);
      expect(result!.elevation).toBeGreaterThanOrEqual(-90);
      expect(result!.elevation).toBeLessThanOrEqual(90);
    });

    it('should calculate range from observer', () => {
      const date = new Date();
      const result = getSatellitePosition(mockTLE, date, 40, -74);

      expect(result?.range).toBeDefined();
      expect(result!.range).toBeGreaterThan(0);
    });

    it('should determine sunlit status', () => {
      const date = new Date();
      const result = getSatellitePosition(mockTLE, date, 40, -74);

      expect(result?.isSunlit).toBeDefined();
      expect(typeof result!.isSunlit).toBe('boolean');
    });

    it('should determine visibility status', () => {
      const date = new Date();
      const result = getSatellitePosition(mockTLE, date, 40, -74);

      expect(result?.isVisible).toBeDefined();
      expect(typeof result!.isVisible).toBe('boolean');
    });

    it('should include velocity', () => {
      const date = new Date();
      const result = getSatellitePosition(mockTLE, date, 0, 0);

      expect(result?.velocity).toBeDefined();
      expect(result!.velocity).toBeGreaterThan(0);
    });

    it('should accept observer altitude', () => {
      const date = new Date();
      const resultSeaLevel = getSatellitePosition(mockTLE, date, 40, -74, 0);
      const resultMountain = getSatellitePosition(mockTLE, date, 40, -74, 3000);

      expect(resultSeaLevel).not.toBeNull();
      expect(resultMountain).not.toBeNull();
    });
  });

  describe('getGroundTrack', () => {
    const mockTLE: TLEData = {
      name: 'ISS (ZARYA)',
      line1: sampleTLELine1,
      line2: sampleTLELine2,
      catalogNumber: 25544,
      epochYear: 2024,
      epochDay: 1.5,
      inclination: 51.64,
      raan: 208.9163,
      eccentricity: 0.0006703,
      argOfPerigee: 292.6893,
      meanAnomaly: 67.3566,
      meanMotion: 15.5,
    };

    it('should calculate ground track', () => {
      const result = getGroundTrack(mockTLE);

      expect(result).toBeDefined();
      expect(result.positions).toBeDefined();
      expect(Array.isArray(result.positions)).toBe(true);
      expect(result.period).toBeDefined();
    });

    it('should return multiple positions', () => {
      const result = getGroundTrack(mockTLE);

      expect(result.positions.length).toBeGreaterThan(1);
    });

    it('should include time for each position', () => {
      const result = getGroundTrack(mockTLE);

      result.positions.forEach(pos => {
        expect(pos.time).toBeInstanceOf(Date);
      });
    });

    it('should include coordinates for each position', () => {
      const result = getGroundTrack(mockTLE);

      result.positions.forEach(pos => {
        expect(typeof pos.latitude).toBe('number');
        expect(typeof pos.longitude).toBe('number');
        expect(typeof pos.altitude).toBe('number');
      });
    });

    it('should calculate orbital period', () => {
      const result = getGroundTrack(mockTLE);

      // ISS orbits ~15.5 times per day, period ~93 minutes
      expect(result.period).toBeGreaterThan(80);
      expect(result.period).toBeLessThan(110);
    });

    it('should use current time as default start', () => {
      const before = new Date();
      const result = getGroundTrack(mockTLE);
      const after = new Date();

      if (result.positions.length > 0) {
        const firstTime = result.positions[0].time.getTime();
        expect(firstTime).toBeGreaterThanOrEqual(before.getTime());
        expect(firstTime).toBeLessThanOrEqual(after.getTime() + 1000);
      }
    });

    it('should accept custom start date', () => {
      const startDate = new Date('2024-06-01T12:00:00Z');
      const result = getGroundTrack(mockTLE, startDate);

      if (result.positions.length > 0) {
        expect(result.positions[0].time.getTime()).toBeGreaterThanOrEqual(
          startDate.getTime()
        );
      }
    });

    it('should have positions spanning one orbital period', () => {
      const result = getGroundTrack(mockTLE);

      if (result.positions.length >= 2) {
        const firstTime = result.positions[0].time.getTime();
        const lastTime = result.positions[result.positions.length - 1].time.getTime();
        const durationMinutes = (lastTime - firstTime) / 60000;

        // Should span approximately one orbital period
        expect(durationMinutes).toBeGreaterThan(result.period * 0.9);
      }
    });
  });
});
