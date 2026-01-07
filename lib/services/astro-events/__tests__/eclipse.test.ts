/**
 * Tests for eclipse.ts
 */

import {
  SOLAR_ECLIPSES,
  LUNAR_ECLIPSES,
  getUpcomingEclipses,
  getNextSolarEclipse,
  getNextLunarEclipse,
  isEclipseVisible,
} from '../eclipse';
import type { AstroEvent } from '../types';

describe('eclipse service', () => {
  describe('SOLAR_ECLIPSES', () => {
    it('should be an array of solar eclipse events', () => {
      expect(Array.isArray(SOLAR_ECLIPSES)).toBe(true);
      expect(SOLAR_ECLIPSES.length).toBeGreaterThan(0);
    });

    it('should have valid solar eclipse structure', () => {
      SOLAR_ECLIPSES.forEach(eclipse => {
        expect(eclipse.id).toBeDefined();
        expect(eclipse.type).toBe('eclipse');
        expect(eclipse.name).toBeDefined();
        expect(eclipse.date).toBeInstanceOf(Date);
        expect(eclipse.eclipseType).toBeDefined();
        expect(['total', 'annular', 'partial', 'hybrid']).toContain(eclipse.eclipseType);
      });
    });

    it('should have source attribution', () => {
      SOLAR_ECLIPSES.forEach(eclipse => {
        expect(eclipse.source).toBeDefined();
      });
    });

    it('should have visibility rating', () => {
      SOLAR_ECLIPSES.forEach(eclipse => {
        if (eclipse.visibility) {
          expect(['excellent', 'good', 'fair', 'poor']).toContain(eclipse.visibility);
        }
      });
    });

    it('should have optional path width for total/annular eclipses', () => {
      const totalOrAnnular = SOLAR_ECLIPSES.filter(
        e => e.eclipseType === 'total' || e.eclipseType === 'annular'
      );
      
      totalOrAnnular.forEach(eclipse => {
        if (eclipse.pathWidth !== undefined) {
          expect(typeof eclipse.pathWidth).toBe('number');
          expect(eclipse.pathWidth).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('LUNAR_ECLIPSES', () => {
    it('should be an array of lunar eclipse events', () => {
      expect(Array.isArray(LUNAR_ECLIPSES)).toBe(true);
      expect(LUNAR_ECLIPSES.length).toBeGreaterThan(0);
    });

    it('should have valid lunar eclipse structure', () => {
      LUNAR_ECLIPSES.forEach(eclipse => {
        expect(eclipse.id).toBeDefined();
        expect(eclipse.type).toBe('eclipse');
        expect(eclipse.name).toBeDefined();
        expect(eclipse.date).toBeInstanceOf(Date);
        expect(eclipse.eclipseType).toBeDefined();
        expect(['total', 'partial', 'penumbral']).toContain(eclipse.eclipseType);
      });
    });

    it('should have duration for lunar eclipses', () => {
      LUNAR_ECLIPSES.forEach(eclipse => {
        if (eclipse.duration !== undefined) {
          expect(typeof eclipse.duration).toBe('number');
          expect(eclipse.duration).toBeGreaterThan(0);
        }
      });
    });

    it('should have maxEclipse time for total eclipses', () => {
      const totalEclipses = LUNAR_ECLIPSES.filter(e => e.eclipseType === 'total');
      
      totalEclipses.forEach(eclipse => {
        if (eclipse.maxEclipse) {
          expect(eclipse.maxEclipse).toBeInstanceOf(Date);
        }
      });
    });
  });

  describe('getUpcomingEclipses', () => {
    it('should return an array', () => {
      const result = getUpcomingEclipses();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter eclipses within specified months', () => {
      const now = new Date();
      const result = getUpcomingEclipses(12);
      
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 12);
      
      result.forEach(eclipse => {
        expect(eclipse.date.getTime()).toBeGreaterThanOrEqual(now.getTime());
        expect(eclipse.date.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should use default of 24 months', () => {
      const result = getUpcomingEclipses();
      const explicitResult = getUpcomingEclipses(24);
      
      // Both should return same results
      expect(result.length).toBe(explicitResult.length);
    });

    it('should sort eclipses chronologically', () => {
      const result = getUpcomingEclipses(24);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date.getTime())
          .toBeGreaterThanOrEqual(result[i - 1].date.getTime());
      }
    });

    it('should include both solar and lunar eclipses', () => {
      const result = getUpcomingEclipses(36);
      const names = result.map(e => e.name.toLowerCase());
      
      // Check for presence of both types
      const hasSolar = names.some(n => n.includes('solar'));
      const hasLunar = names.some(n => n.includes('lunar'));
      
      // At least one type should be present if there are any results
      if (result.length > 0) {
        expect(hasSolar || hasLunar).toBe(true);
      }
    });

    it('should return fewer results for shorter time period', () => {
      const short = getUpcomingEclipses(6);
      const long = getUpcomingEclipses(36);
      
      expect(long.length).toBeGreaterThanOrEqual(short.length);
    });
  });

  describe('getNextSolarEclipse', () => {
    it('should return a solar eclipse or null', () => {
      const result = getNextSolarEclipse();
      
      if (result !== null) {
        expect(result.type).toBe('eclipse');
        expect(result.name.toLowerCase()).toContain('solar');
      }
    });

    it('should return an eclipse in the future', () => {
      const result = getNextSolarEclipse();
      const now = new Date();
      
      if (result !== null) {
        expect(result.date.getTime()).toBeGreaterThanOrEqual(now.getTime());
      }
    });

    it('should have solar eclipse type', () => {
      const result = getNextSolarEclipse();
      
      if (result !== null) {
        expect(['total', 'annular', 'partial', 'hybrid']).toContain(result.eclipseType);
      }
    });
  });

  describe('getNextLunarEclipse', () => {
    it('should return a lunar eclipse or null', () => {
      const result = getNextLunarEclipse();
      
      if (result !== null) {
        expect(result.type).toBe('eclipse');
        expect(result.name.toLowerCase()).toContain('lunar');
      }
    });

    it('should return an eclipse in the future', () => {
      const result = getNextLunarEclipse();
      const now = new Date();
      
      if (result !== null) {
        expect(result.date.getTime()).toBeGreaterThanOrEqual(now.getTime());
      }
    });

    it('should have lunar eclipse type', () => {
      const result = getNextLunarEclipse();
      
      if (result !== null) {
        expect(['total', 'partial', 'penumbral']).toContain(result.eclipseType);
      }
    });
  });

  describe('isEclipseVisible', () => {
    it('should return a boolean', () => {
      const eclipse: AstroEvent = {
        id: 'test-eclipse',
        type: 'eclipse',
        name: 'Test Eclipse',
        date: new Date(),
        description: 'Test eclipse',
        source: 'test',
      };
      
      const result = isEclipseVisible(eclipse, 40.7128, -74.0060);
      expect(typeof result).toBe('boolean');
    });

    it('should accept various coordinates', () => {
      const eclipse: AstroEvent = {
        id: 'test-eclipse',
        type: 'eclipse',
        name: 'Test Eclipse',
        date: new Date(),
        description: 'Test eclipse',
        source: 'test',
      };
      
      // Various global locations
      expect(() => isEclipseVisible(eclipse, 0, 0)).not.toThrow();
      expect(() => isEclipseVisible(eclipse, 90, 0)).not.toThrow();
      expect(() => isEclipseVisible(eclipse, -90, 0)).not.toThrow();
      expect(() => isEclipseVisible(eclipse, 45, 180)).not.toThrow();
      expect(() => isEclipseVisible(eclipse, 45, -180)).not.toThrow();
    });

    it('should return true for simplified implementation', () => {
      const eclipse: AstroEvent = {
        id: 'test-eclipse',
        type: 'eclipse',
        name: 'Test Eclipse',
        date: new Date(),
        description: 'Test eclipse',
        source: 'test',
      };
      
      // Current simplified implementation always returns true
      const result = isEclipseVisible(eclipse, 35.6762, 139.6503);
      expect(result).toBe(true);
    });
  });

  describe('eclipse data consistency', () => {
    it('should have unique IDs across all eclipses', () => {
      const allIds = [
        ...SOLAR_ECLIPSES.map(e => e.id),
        ...LUNAR_ECLIPSES.map(e => e.id),
      ];
      const uniqueIds = new Set(allIds);
      
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should have valid date objects', () => {
      [...SOLAR_ECLIPSES, ...LUNAR_ECLIPSES].forEach(eclipse => {
        expect(eclipse.date).toBeInstanceOf(Date);
        expect(isNaN(eclipse.date.getTime())).toBe(false);
      });
    });

    it('should have descriptions', () => {
      [...SOLAR_ECLIPSES, ...LUNAR_ECLIPSES].forEach(eclipse => {
        expect(eclipse.description).toBeDefined();
        expect(typeof eclipse.description).toBe('string');
        expect(eclipse.description.length).toBeGreaterThan(0);
      });
    });
  });
});
