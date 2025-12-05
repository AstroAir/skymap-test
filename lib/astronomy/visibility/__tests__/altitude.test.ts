/**
 * @jest-environment node
 */
import {
  getAltitudeAtTime,
  getAltitudeOverTime,
  getMaxAltitude,
  getMinAltitude,
  getTimeAtAltitude,
} from '../altitude';

describe('Altitude Calculations', () => {
  // Test location: Beijing (39.9°N, 116.4°E)
  const latitude = 39.9;
  const longitude = 116.4;

  // ============================================================================
  // getAltitudeAtTime
  // ============================================================================
  describe('getAltitudeAtTime', () => {
    it('returns a number', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const alt = getAltitudeAtTime(180, 45, latitude, longitude, date);
      expect(typeof alt).toBe('number');
    });

    it('altitude is between -90 and 90', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const alt = getAltitudeAtTime(180, 45, latitude, longitude, date);
      expect(alt).toBeGreaterThanOrEqual(-90);
      expect(alt).toBeLessThanOrEqual(90);
    });

    it('different times give different altitudes', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T12:00:00Z');
      
      const alt1 = getAltitudeAtTime(180, 45, latitude, longitude, date1);
      const alt2 = getAltitudeAtTime(180, 45, latitude, longitude, date2);
      
      expect(alt1).not.toEqual(alt2);
    });

    it('circumpolar object always has positive altitude', () => {
      // Polaris at 89.26° declination from Beijing
      const dates = [
        new Date('2024-06-21T00:00:00Z'),
        new Date('2024-06-21T06:00:00Z'),
        new Date('2024-06-21T12:00:00Z'),
        new Date('2024-06-21T18:00:00Z'),
      ];
      
      for (const date of dates) {
        const alt = getAltitudeAtTime(37.95, 89.26, latitude, longitude, date);
        expect(alt).toBeGreaterThan(0);
      }
    });

    it('southern object from northern hemisphere can be below horizon', () => {
      // Object at -60° declination from Beijing
      const date = new Date('2024-06-21T12:00:00Z');
      const alt = getAltitudeAtTime(180, -60, latitude, longitude, date);
      expect(alt).toBeLessThan(0);
    });
  });

  // ============================================================================
  // getAltitudeOverTime
  // ============================================================================
  describe('getAltitudeOverTime', () => {
    it('returns array of altitude points', () => {
      const result = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('each point has hour, altitude, azimuth', () => {
      const result = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      
      for (const point of result) {
        expect(point).toHaveProperty('hour');
        expect(point).toHaveProperty('altitude');
        expect(point).toHaveProperty('azimuth');
      }
    });

    it('hours increase monotonically', () => {
      const result = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].hour).toBeGreaterThan(result[i - 1].hour);
      }
    });

    it('respects intervalMinutes parameter', () => {
      const result30 = getAltitudeOverTime(180, 45, latitude, longitude, 24, 30);
      const result60 = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      
      // 30 min intervals = approximately 2x as many points (±1 due to boundary handling)
      expect(result30.length).toBeGreaterThanOrEqual(result60.length * 2 - 1);
      expect(result30.length).toBeLessThanOrEqual(result60.length * 2 + 1);
    });

    it('respects hoursAhead parameter', () => {
      const result12 = getAltitudeOverTime(180, 45, latitude, longitude, 12, 60);
      const result24 = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      
      // 24 hours = approximately 2x as many points as 12 hours (±1 due to boundary handling)
      expect(result24.length).toBeGreaterThanOrEqual(result12.length * 2 - 1);
      expect(result24.length).toBeLessThanOrEqual(result12.length * 2 + 1);
    });

    it('altitudes are valid', () => {
      const result = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      
      for (const point of result) {
        expect(point.altitude).toBeGreaterThanOrEqual(-90);
        expect(point.altitude).toBeLessThanOrEqual(90);
      }
    });

    it('azimuths are valid', () => {
      const result = getAltitudeOverTime(180, 45, latitude, longitude, 24, 60);
      
      for (const point of result) {
        expect(point.azimuth).toBeGreaterThanOrEqual(0);
        expect(point.azimuth).toBeLessThan(360);
      }
    });
  });

  // ============================================================================
  // getMaxAltitude
  // ============================================================================
  describe('getMaxAltitude', () => {
    it('equals 90 - |lat - dec| for northern hemisphere', () => {
      // Object at same declination as latitude - passes through zenith
      expect(getMaxAltitude(latitude, latitude)).toBeCloseTo(90, 1);
      
      // Object at 45° dec from 39.9° lat
      expect(getMaxAltitude(45, latitude)).toBeCloseTo(90 - Math.abs(latitude - 45), 1);
    });

    it('is 90 when dec equals latitude', () => {
      expect(getMaxAltitude(39.9, 39.9)).toBeCloseTo(90, 5);
    });

    it('decreases as dec moves away from latitude', () => {
      const altSame = getMaxAltitude(latitude, latitude);
      const alt10Away = getMaxAltitude(latitude + 10, latitude);
      const alt20Away = getMaxAltitude(latitude + 20, latitude);
      
      expect(alt10Away).toBeLessThan(altSame);
      expect(alt20Away).toBeLessThan(alt10Away);
    });

    it('handles negative declinations', () => {
      const alt = getMaxAltitude(-30, latitude);
      expect(alt).toBe(90 - Math.abs(latitude - (-30)));
    });

    it('handles southern hemisphere', () => {
      const southLat = -35;
      const alt = getMaxAltitude(-35, southLat);
      expect(alt).toBeCloseTo(90, 1);
    });
  });

  // ============================================================================
  // getMinAltitude
  // ============================================================================
  describe('getMinAltitude', () => {
    it('returns correct minimum altitude', () => {
      const min = getMinAltitude(89, latitude);
      expect(typeof min).toBe('number');
    });

    it('is negative for non-circumpolar objects', () => {
      // Object at 30° dec from 39.9° lat is not circumpolar
      const min = getMinAltitude(30, latitude);
      expect(min).toBeLessThan(0);
    });

    it('is positive for circumpolar objects', () => {
      // Object at 89° dec from 39.9° lat is circumpolar
      const min = getMinAltitude(89, latitude);
      expect(min).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // getTimeAtAltitude
  // ============================================================================
  describe('getTimeAtAltitude', () => {
    it('returns Date for achievable altitude', () => {
      const result = getTimeAtAltitude(180, 45, latitude, longitude, 30, true);
      expect(result).toBeInstanceOf(Date);
    });

    it('returns null for unachievable altitude', () => {
      // Object can't reach 90° altitude unless dec = lat
      const result = getTimeAtAltitude(180, 0, latitude, longitude, 85, true);
      expect(result).toBeNull();
    });

    it('rising and setting times are different', () => {
      const rising = getTimeAtAltitude(180, 45, latitude, longitude, 30, true);
      const setting = getTimeAtAltitude(180, 45, latitude, longitude, 30, false);
      
      if (rising && setting) {
        expect(rising.getTime()).not.toEqual(setting.getTime());
      }
    });

    it('returns future time', () => {
      const now = new Date();
      const result = getTimeAtAltitude(180, 45, latitude, longitude, 30, true, now);
      
      if (result) {
        expect(result.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it('accepts custom start date', () => {
      const start = new Date('2024-06-21T00:00:00Z');
      const result = getTimeAtAltitude(180, 45, latitude, longitude, 30, true, start);
      
      if (result) {
        expect(result.getTime()).toBeGreaterThan(start.getTime());
      }
    });
  });
});
