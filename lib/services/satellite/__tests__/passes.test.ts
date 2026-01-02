/**
 * @jest-environment jsdom
 */

import {
  predictPasses,
  getNextPass,
  getVisiblePasses,
  getPassDirection,
  getPassQuality,
  formatPass,
} from '../passes';
import type { TLEData, SatellitePass } from '../types';

// Sample ISS TLE data
const ISS_TLE: TLEData = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993',
  line2: '2 25544  51.6400 208.9163 0006703 296.4597 324.8853 15.49390283999999',
  catalogNumber: 25544,
  epochYear: 24,
  epochDay: 1.5,
  inclination: 51.64,
  raan: 208.9163,
  eccentricity: 0.0006703,
  argOfPerigee: 296.4597,
  meanAnomaly: 324.8853,
  meanMotion: 15.4939,
};

const DEFAULT_PARAMS = {
  latitude: 45.5017,
  longitude: -73.5673,
  elevation: 100,
  minElevation: 10,
  hours: 48,
};

describe('satellite passes', () => {
  describe('predictPasses', () => {
    it('should return array of passes', () => {
      const passes = predictPasses(ISS_TLE, DEFAULT_PARAMS);
      
      expect(Array.isArray(passes)).toBe(true);
    });

    it('should include satellite name in passes', () => {
      const passes = predictPasses(ISS_TLE, DEFAULT_PARAMS);
      
      passes.forEach(pass => {
        expect(pass.satellite).toBe('ISS (ZARYA)');
      });
    });

    it('should have valid pass properties', () => {
      const passes = predictPasses(ISS_TLE, { ...DEFAULT_PARAMS, hours: 72 });
      
      if (passes.length > 0) {
        const pass = passes[0];
        
        expect(pass.startTime).toBeInstanceOf(Date);
        expect(pass.endTime).toBeInstanceOf(Date);
        expect(pass.maxElevationTime).toBeInstanceOf(Date);
        expect(typeof pass.maxElevation).toBe('number');
        expect(typeof pass.startAzimuth).toBe('number');
        expect(typeof pass.endAzimuth).toBe('number');
        expect(typeof pass.isVisible).toBe('boolean');
      }
    });

    it('should respect minimum elevation', () => {
      const passes = predictPasses(ISS_TLE, { ...DEFAULT_PARAMS, minElevation: 30 });
      
      passes.forEach(pass => {
        expect(pass.maxElevation).toBeGreaterThanOrEqual(30);
      });
    });

    it('should find more passes with lower minimum elevation', () => {
      const lowPasses = predictPasses(ISS_TLE, { ...DEFAULT_PARAMS, minElevation: 5 });
      const highPasses = predictPasses(ISS_TLE, { ...DEFAULT_PARAMS, minElevation: 45 });
      
      expect(highPasses.length).toBeLessThanOrEqual(lowPasses.length);
    });

    it('should have end time after start time', () => {
      const passes = predictPasses(ISS_TLE, DEFAULT_PARAMS);
      
      passes.forEach(pass => {
        expect(pass.endTime.getTime()).toBeGreaterThan(pass.startTime.getTime());
      });
    });

    it('should have max elevation time between start and end', () => {
      const passes = predictPasses(ISS_TLE, DEFAULT_PARAMS);
      
      passes.forEach(pass => {
        expect(pass.maxElevationTime.getTime()).toBeGreaterThanOrEqual(pass.startTime.getTime());
        expect(pass.maxElevationTime.getTime()).toBeLessThanOrEqual(pass.endTime.getTime());
      });
    });
  });

  describe('getNextPass', () => {
    it('should return the first upcoming pass', () => {
      const nextPass = getNextPass(ISS_TLE, DEFAULT_PARAMS);
      
      if (nextPass) {
        expect(nextPass.startTime.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should return null or pass object', () => {
      const nextPass = getNextPass(ISS_TLE, DEFAULT_PARAMS);
      
      expect(nextPass === null || typeof nextPass === 'object').toBe(true);
    });
  });

  describe('getVisiblePasses', () => {
    it('should return only visible passes', () => {
      const passes = getVisiblePasses(ISS_TLE, DEFAULT_PARAMS);
      
      passes.forEach(pass => {
        expect(pass.isVisible).toBe(true);
      });
    });

    it('should return subset of all passes', () => {
      const allPasses = predictPasses(ISS_TLE, DEFAULT_PARAMS);
      const visiblePasses = getVisiblePasses(ISS_TLE, DEFAULT_PARAMS);
      
      expect(visiblePasses.length).toBeLessThanOrEqual(allPasses.length);
    });
  });

  describe('getPassDirection', () => {
    it('should return direction string', () => {
      const direction = getPassDirection(45, 270);
      
      expect(typeof direction).toBe('string');
      expect(direction).toContain('→');
    });

    it('should handle cardinal directions', () => {
      expect(getPassDirection(0, 180)).toContain('N');
      expect(getPassDirection(0, 180)).toContain('S');
    });

    it('should handle intercardinal directions', () => {
      const direction = getPassDirection(45, 225);
      
      expect(direction).toContain('NE');
      expect(direction).toContain('SW');
    });

    it('should handle full rotation', () => {
      const direction = getPassDirection(350, 10);
      
      expect(direction).toContain('N');
    });
  });

  describe('getPassQuality', () => {
    it('should return excellent for high elevation visible pass', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date(),
        endTime: new Date(),
        maxElevation: 80,
        maxElevationTime: new Date(),
        startAzimuth: 0,
        endAzimuth: 180,
        isVisible: true,
        magnitude: -3,
      };
      
      expect(getPassQuality(pass)).toBe('excellent');
    });

    it('should return good for medium elevation visible pass', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date(),
        endTime: new Date(),
        maxElevation: 50,
        maxElevationTime: new Date(),
        startAzimuth: 0,
        endAzimuth: 180,
        isVisible: true,
        magnitude: -2,
      };
      
      expect(getPassQuality(pass)).toBe('good');
    });

    it('should return fair for low elevation visible pass', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date(),
        endTime: new Date(),
        maxElevation: 30,
        maxElevationTime: new Date(),
        startAzimuth: 0,
        endAzimuth: 180,
        isVisible: true,
        magnitude: -1,
      };
      
      expect(getPassQuality(pass)).toBe('fair');
    });

    it('should return poor for non-visible pass', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date(),
        endTime: new Date(),
        maxElevation: 80,
        maxElevationTime: new Date(),
        startAzimuth: 0,
        endAzimuth: 180,
        isVisible: false,
        magnitude: -3,
      };
      
      expect(getPassQuality(pass)).toBe('poor');
    });
  });

  describe('formatPass', () => {
    it('should format pass for display', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date('2024-01-15T20:30:00'),
        endTime: new Date('2024-01-15T20:36:00'),
        maxElevation: 45,
        maxElevationTime: new Date('2024-01-15T20:33:00'),
        startAzimuth: 315,
        endAzimuth: 135,
        isVisible: true,
        magnitude: -2.5,
      };
      
      const formatted = formatPass(pass);
      
      expect(formatted).toContain('45°');
      expect(formatted).toContain('→');
    });

    it('should include visibility indicator for visible pass', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date(),
        endTime: new Date(),
        maxElevation: 45,
        maxElevationTime: new Date(),
        startAzimuth: 0,
        endAzimuth: 180,
        isVisible: true,
        magnitude: -2,
      };
      
      const formatted = formatPass(pass);
      
      expect(formatted).toContain('👁');
    });

    it('should not include visibility indicator for non-visible pass', () => {
      const pass: SatellitePass = {
        satellite: 'ISS',
        startTime: new Date(),
        endTime: new Date(),
        maxElevation: 45,
        maxElevationTime: new Date(),
        startAzimuth: 0,
        endAzimuth: 180,
        isVisible: false,
        magnitude: 2,
      };
      
      const formatted = formatPass(pass);
      
      expect(formatted).not.toContain('👁');
    });
  });
});
