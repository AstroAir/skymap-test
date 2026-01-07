/**
 * Tests for comet.ts
 */

import {
  NOTABLE_COMETS,
  COMET_DATA_SOURCES,
  getBrightComets,
  getTrackedComets,
  estimateCometMagnitude,
  parseCometName,
  getCometPosition,
} from '../comet';
import type { CometEvent } from '../types';

describe('comet service', () => {
  describe('NOTABLE_COMETS', () => {
    it('should be an array of comet events', () => {
      expect(Array.isArray(NOTABLE_COMETS)).toBe(true);
      expect(NOTABLE_COMETS.length).toBeGreaterThan(0);
    });

    it('should have valid comet event structure', () => {
      NOTABLE_COMETS.forEach(comet => {
        expect(comet.id).toBeDefined();
        expect(comet.type).toBe('comet');
        expect(comet.name).toBeDefined();
        expect(comet.cometName).toBeDefined();
        expect(comet.date).toBeInstanceOf(Date);
        expect(typeof comet.expectedMagnitude).toBe('number');
      });
    });

    it('should have perihelion data', () => {
      NOTABLE_COMETS.forEach(comet => {
        if (comet.perihelionDate) {
          expect(comet.perihelionDate).toBeInstanceOf(Date);
        }
        if (comet.perihelionDistance !== undefined) {
          expect(typeof comet.perihelionDistance).toBe('number');
          expect(comet.perihelionDistance).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('COMET_DATA_SOURCES', () => {
    it('should have MPC source', () => {
      expect(COMET_DATA_SOURCES.mpc).toBeDefined();
      expect(COMET_DATA_SOURCES.mpc).toContain('minorplanetcenter');
    });

    it('should have JPL source', () => {
      expect(COMET_DATA_SOURCES.jpl).toBeDefined();
      expect(COMET_DATA_SOURCES.jpl).toContain('jpl.nasa.gov');
    });

    it('should have COBS source', () => {
      expect(COMET_DATA_SOURCES.cobs).toBeDefined();
      expect(COMET_DATA_SOURCES.cobs).toContain('cobs.si');
    });
  });

  describe('getBrightComets', () => {
    it('should return an array', () => {
      const result = getBrightComets();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should only return comets with magnitude < 10', () => {
      const result = getBrightComets();
      result.forEach(comet => {
        expect(comet.expectedMagnitude).toBeLessThan(10);
      });
    });

    it('should only return comets within 6 months of perihelion', () => {
      const result = getBrightComets();
      const now = new Date();
      const sixMonthsMs = 6 * 30 * 24 * 3600 * 1000;

      result.forEach(comet => {
        if (comet.perihelionDate) {
          const diff = Math.abs(comet.perihelionDate.getTime() - now.getTime());
          expect(diff).toBeLessThan(sixMonthsMs);
        }
      });
    });
  });

  describe('getTrackedComets', () => {
    it('should return a copy of notable comets', () => {
      const result = getTrackedComets();
      expect(result).toEqual(NOTABLE_COMETS);
      expect(result).not.toBe(NOTABLE_COMETS); // Should be a new array
    });

    it('should return all tracked comets', () => {
      const result = getTrackedComets();
      expect(result.length).toBe(NOTABLE_COMETS.length);
    });
  });

  describe('estimateCometMagnitude', () => {
    it('should calculate magnitude correctly', () => {
      // Test with known values
      const absoluteMag = 5;
      const sunDistance = 1; // 1 AU
      const earthDistance = 1; // 1 AU
      const activityIndex = 4;

      const result = estimateCometMagnitude(absoluteMag, sunDistance, earthDistance, activityIndex);
      
      // m = H + 5*log10(delta) + 2.5*n*log10(r)
      // m = 5 + 5*log10(1) + 2.5*4*log10(1)
      // m = 5 + 0 + 0 = 5
      expect(result).toBeCloseTo(5, 1);
    });

    it('should increase magnitude with distance', () => {
      const mag1 = estimateCometMagnitude(5, 1, 1);
      const mag2 = estimateCometMagnitude(5, 2, 2);
      
      expect(mag2).toBeGreaterThan(mag1);
    });

    it('should use default activity index of 4', () => {
      const withDefault = estimateCometMagnitude(5, 1.5, 1.5);
      const withExplicit = estimateCometMagnitude(5, 1.5, 1.5, 4);
      
      expect(withDefault).toBeCloseTo(withExplicit, 5);
    });

    it('should handle different activity indices', () => {
      const lowActivity = estimateCometMagnitude(5, 2, 2, 2);
      const highActivity = estimateCometMagnitude(5, 2, 2, 6);
      
      // Higher activity index means more brightening near sun
      expect(highActivity).toBeGreaterThan(lowActivity);
    });
  });

  describe('parseCometName', () => {
    describe('periodic comets', () => {
      it('should parse periodic comet names (e.g., 12P/Pons-Brooks)', () => {
        const result = parseCometName('12P/Pons-Brooks');
        
        expect(result.type).toBe('periodic');
        expect(result.number).toBe(12);
        expect(result.discoverer).toBe('Pons-Brooks');
      });

      it('should parse other periodic comets', () => {
        const result = parseCometName('1P/Halley');
        
        expect(result.type).toBe('periodic');
        expect(result.number).toBe(1);
        expect(result.discoverer).toBe('Halley');
      });
    });

    describe('non-periodic comets', () => {
      it('should parse parabolic comet names (C/)', () => {
        const result = parseCometName('C/2023 A3 (Tsuchinshan-ATLAS)');
        
        expect(result.type).toBe('parabolic');
        expect(result.designation).toBe('2023 A3');
        expect(result.discoverer).toBe('Tsuchinshan-ATLAS');
      });

      it('should parse comet without discoverer name', () => {
        const result = parseCometName('C/2020 F3');
        
        expect(result.type).toBe('parabolic');
        expect(result.designation).toBe('2020 F3');
      });

      it('should parse hyperbolic comet names (D/, X/)', () => {
        const result = parseCometName('D/1993 F2');
        
        expect(result.type).toBe('hyperbolic');
      });
    });

    describe('unknown formats', () => {
      it('should handle unknown name formats', () => {
        const result = parseCometName('Unknown Comet');
        
        expect(result.type).toBe('parabolic');
        expect(result.designation).toBe('Unknown Comet');
      });
    });
  });

  describe('getCometPosition', () => {
    it('should return null for simplified implementation', () => {
      const comet: CometEvent = {
        id: 'test-comet',
        type: 'comet',
        name: 'Test Comet',
        cometName: 'C/2024 X1',
        date: new Date(),
        expectedMagnitude: 5,
        description: 'Test comet',
        source: 'test',
      };

      const result = getCometPosition(comet);
      expect(result).toBeNull();
    });

    it('should accept date parameter', () => {
      const comet: CometEvent = {
        id: 'test-comet',
        type: 'comet',
        name: 'Test Comet',
        cometName: 'C/2024 X1',
        date: new Date(),
        expectedMagnitude: 5,
        description: 'Test comet',
        source: 'test',
      };

      const result = getCometPosition(comet, new Date('2024-06-01'));
      expect(result).toBeNull();
    });
  });
});
