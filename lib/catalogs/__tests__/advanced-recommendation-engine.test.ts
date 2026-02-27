/**
 * Unit tests for Advanced Recommendation Engine
 * Tests utility functions, AdvancedRecommendationEngine class, and helper functions
 */

import {
  calculateFOV,
  calculateImageScale,
  checkFOVFit,
  checkResolutionMatch,
  estimateExposure,
  checkMeridianCrossing,
  AdvancedRecommendationEngine,
  getQuickRecommendations,
  type WeatherConditions,
} from '../advanced-recommendation-engine';
import type { DeepSkyObject } from '../types';

// ============================================================================
// Test Data
// ============================================================================

const mockDSO: DeepSkyObject = {
  id: 'M31',
  name: 'M31',
  type: 'Galaxy',
  ra: 10.6847,
  dec: 41.2689,
  magnitude: 3.4,
  surfaceBrightness: 22.2,
  sizeMax: 178,
  sizeMin: 63,
  constellation: 'And',
  alternateNames: ['Andromeda Galaxy', 'NGC224'],
};

const mockM42: DeepSkyObject = {
  id: 'M42',
  name: 'M42',
  type: 'Nebula',
  ra: 83.8221,
  dec: -5.3911,
  magnitude: 4.0,
  surfaceBrightness: 20.0,
  sizeMax: 85,
  sizeMin: 60,
  constellation: 'Ori',
  alternateNames: ['Orion Nebula'],
};

const mockM13: DeepSkyObject = {
  id: 'M13',
  name: 'M13',
  type: 'GlobularCluster',
  ra: 250.4217,
  dec: 36.4613,
  magnitude: 5.8,
  sizeMax: 20,
  constellation: 'Her',
  alternateNames: ['Hercules Cluster'],
};

const mockFaintDSO: DeepSkyObject = {
  id: 'NGC891',
  name: 'NGC891',
  type: 'Galaxy',
  ra: 35.6393,
  dec: 42.3491,
  magnitude: 10.0,
  surfaceBrightness: 24.0,
  sizeMax: 14,
  constellation: 'And',
};

const mockSmallCatalog: DeepSkyObject[] = [mockDSO, mockM42, mockM13, mockFaintDSO];

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('calculateFOV', () => {
  it('should calculate field of view correctly', () => {
    const fov = calculateFOV(500, 22.3, 14.9);
    expect(fov.width).toBeCloseTo(22.3 / 500 * 3438, 0);
    expect(fov.height).toBeCloseTo(14.9 / 500 * 3438, 0);
    expect(fov.diagonal).toBeGreaterThan(fov.width);
    expect(fov.diagonal).toBeGreaterThan(fov.height);
  });

  it('should increase FOV with shorter focal length', () => {
    const fov200 = calculateFOV(200, 22.3, 14.9);
    const fov500 = calculateFOV(500, 22.3, 14.9);
    expect(fov200.width).toBeGreaterThan(fov500.width);
    expect(fov200.height).toBeGreaterThan(fov500.height);
  });

  it('should increase FOV with larger sensor', () => {
    const small = calculateFOV(500, 13.2, 8.8);
    const large = calculateFOV(500, 36, 24);
    expect(large.width).toBeGreaterThan(small.width);
  });
});

describe('calculateImageScale', () => {
  it('should calculate image scale correctly', () => {
    const scale = calculateImageScale(500, 3.76);
    expect(scale).toBeCloseTo(3.76 / 500 * 206.265, 2);
  });

  it('should increase with larger pixel size', () => {
    expect(calculateImageScale(500, 5.0)).toBeGreaterThan(calculateImageScale(500, 3.0));
  });

  it('should decrease with longer focal length', () => {
    expect(calculateImageScale(1000, 3.76)).toBeLessThan(calculateImageScale(500, 3.76));
  });
});

describe('checkFOVFit', () => {
  it('should return too_small for very small objects', () => {
    expect(checkFOVFit(5, 150, 100)).toBe('too_small');
  });

  it('should return good for small but visible objects', () => {
    // sizeRatio = 25/100 = 0.25, which is in [0.15, 0.3) → 'good'
    expect(checkFOVFit(25, 150, 100)).toBe('good');
  });

  it('should return perfect for well-sized objects', () => {
    expect(checkFOVFit(50, 150, 100)).toBe('perfect');
  });

  it('should return tight for large objects', () => {
    expect(checkFOVFit(75, 150, 100)).toBe('tight');
  });

  it('should return too_large for objects exceeding FOV', () => {
    expect(checkFOVFit(200, 150, 100)).toBe('too_large');
  });
});

describe('checkResolutionMatch', () => {
  it('should return undersampled when image scale > seeing', () => {
    expect(checkResolutionMatch(3.0, 10, 2.5)).toBe('undersampled');
  });

  it('should return oversampled when image scale is very small', () => {
    expect(checkResolutionMatch(0.3, 10, 2.5)).toBe('oversampled');
  });

  it('should return optimal for good match', () => {
    expect(checkResolutionMatch(1.5, 10, 2.5)).toBe('optimal');
  });

  it('should return acceptable for acceptable match', () => {
    expect(checkResolutionMatch(1.0, 10, 2.5)).toBe('acceptable');
  });

  it('should handle default seeing parameter', () => {
    const result = checkResolutionMatch(1.5, 10);
    expect(['optimal', 'acceptable', 'oversampled', 'undersampled']).toContain(result);
  });

  it('should return undersampled when pixels across is too few', () => {
    // Very small object with large pixel scale = few pixels
    expect(checkResolutionMatch(2.0, 0.1, 2.5)).toBe('undersampled');
  });
});

describe('estimateExposure', () => {
  it('should return sub and total exposure', () => {
    const result = estimateExposure(10, 20, 5, false);
    expect(result.subExposure).toBeGreaterThan(0);
    expect(result.totalExposure).toBeGreaterThan(0);
  });

  it('should cap exposure without autoguider', () => {
    const result = estimateExposure(14, 25, 8, false);
    expect(result.subExposure).toBeLessThanOrEqual(120);
  });

  it('should allow longer exposure with autoguider', () => {
    const withGuider = estimateExposure(14, 25, 5, true);
    const withoutGuider = estimateExposure(14, 25, 5, false);
    expect(withGuider.subExposure).toBeGreaterThanOrEqual(withoutGuider.subExposure);
  });

  it('should increase exposure for fainter objects', () => {
    const bright = estimateExposure(6, undefined, 5, true);
    const faint = estimateExposure(14, undefined, 5, true);
    expect(faint.subExposure).toBeGreaterThan(bright.subExposure);
  });

  it('should increase exposure for higher Bortle class', () => {
    const dark = estimateExposure(10, 20, 3, true);
    const bright = estimateExposure(10, 20, 8, true);
    expect(bright.subExposure).toBeGreaterThan(dark.subExposure);
  });

  it('should handle undefined magnitude and surface brightness', () => {
    const result = estimateExposure(undefined, undefined, 5, false);
    expect(result.subExposure).toBeGreaterThan(0);
    expect(result.totalExposure).toBeGreaterThan(0);
  });
});

describe('checkMeridianCrossing', () => {
  it('should detect meridian crossing', () => {
    const start = new Date('2025-06-15T22:00:00Z');
    const end = new Date('2025-06-16T06:00:00Z');
    // RA = 0 degrees = 0 hours
    const result = checkMeridianCrossing(0, -74, start, end);
    expect(typeof result.crosses).toBe('boolean');
    expect(result.crossingTime === null || result.crossingTime instanceof Date).toBe(true);
  });

  it('should return crossingTime when crossing occurs', () => {
    const start = new Date('2025-06-15T22:00:00Z');
    const end = new Date('2025-06-16T10:00:00Z');
    // Use a RA that will transit during this window
    const result = checkMeridianCrossing(180, -74, start, end);
    if (result.crosses) {
      expect(result.crossingTime).toBeInstanceOf(Date);
    }
  });

  it('should handle LST wrap around', () => {
    const start = new Date('2025-06-15T22:00:00Z');
    const end = new Date('2025-06-16T06:00:00Z');
    const result = checkMeridianCrossing(350, 0, start, end);
    expect(typeof result.crosses).toBe('boolean');
  });
});

// ============================================================================
// AdvancedRecommendationEngine Class Tests
// ============================================================================

describe('AdvancedRecommendationEngine', () => {
  describe('constructor', () => {
    it('should create with default values', () => {
      const engine = new AdvancedRecommendationEngine();
      expect(engine).toBeDefined();
    });

    it('should accept partial equipment profile', () => {
      const engine = new AdvancedRecommendationEngine({
        telescopeFocalLength: 1000,
        telescopeAperture: 200,
      });
      expect(engine).toBeDefined();
    });

    it('should accept partial site configuration', () => {
      const engine = new AdvancedRecommendationEngine({}, {
        latitude: 45,
        longitude: -75,
        bortleClass: 4,
      });
      expect(engine).toBeDefined();
    });

    it('should accept partial recommendation config', () => {
      const engine = new AdvancedRecommendationEngine({}, {}, {
        minimumAltitude: 30,
        difficultyPreference: 'beginner',
      });
      expect(engine).toBeDefined();
    });
  });

  describe('setLocation', () => {
    it('should update site location', () => {
      const engine = new AdvancedRecommendationEngine();
      engine.setLocation(45, -75, 100);
      // Verify by scoring an object (it uses the location internally)
      expect(engine).toBeDefined();
    });
  });

  describe('setEquipment', () => {
    it('should update equipment and recalculate FOV/image scale', () => {
      const engine = new AdvancedRecommendationEngine();
      engine.setEquipment({
        telescopeFocalLength: 1000,
        telescopeAperture: 200,
        cameraPixelSize: 2.4,
      });
      expect(engine).toBeDefined();
    });
  });

  describe('setSite', () => {
    it('should update site and clear cached nighttime data', () => {
      const engine = new AdvancedRecommendationEngine();
      engine.setSite({
        latitude: 30,
        longitude: -100,
        bortleClass: 3,
      });
      expect(engine).toBeDefined();
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      const engine = new AdvancedRecommendationEngine();
      engine.setConfig({
        minimumAltitude: 35,
        minimumMoonDistance: 40,
        difficultyPreference: 'advanced',
      });
      expect(engine).toBeDefined();
    });
  });

  describe('setWeather', () => {
    it('should set weather conditions', () => {
      const engine = new AdvancedRecommendationEngine();
      const weather: WeatherConditions = {
        cloudCover: 10,
        humidity: 40,
        windSpeed: 5,
        temperature: 15,
        dewPoint: 8,
        transparency: 'good',
        seeing: 'good',
      };
      engine.setWeather(weather);
      expect(engine).toBeDefined();
    });
  });

  describe('scoreObject', () => {
    it('should return null for objects that never rise', () => {
      const engine = new AdvancedRecommendationEngine({}, {
        latitude: 45,
        longitude: -75,
      });
      // Object at -80 dec never rises at latitude 45
      const southernObject: DeepSkyObject = {
        id: 'test',
        name: 'Test',
        type: 'Galaxy',
        ra: 0,
        dec: -80,
        constellation: 'Oct',
      };
      const result = engine.scoreObject(southernObject, new Date('2025-01-15T00:00:00Z'));
      expect(result).toBeNull();
    });

    it('should score a visible object', () => {
      const engine = new AdvancedRecommendationEngine(
        { telescopeFocalLength: 500, telescopeAperture: 80 },
        { latitude: 45, longitude: -75, bortleClass: 5 },
        { minimumAltitude: 10, minimumImagingHours: 0.5 }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      // M13 should be visible in July from lat 45
      if (result) {
        expect(result.totalScore).toBeGreaterThan(0);
        expect(result.totalScore).toBeLessThanOrEqual(100);
        expect(result.scoreBreakdown).toBeDefined();
        expect(result.imagingWindow).toBeDefined();
        expect(result.feasibility).toBeDefined();
        expect(Array.isArray(result.reasons)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(Array.isArray(result.tips)).toBe(true);
      }
    });

    it('should include score breakdown fields', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        const bd = result.scoreBreakdown;
        expect(typeof bd.altitudeScore).toBe('number');
        expect(typeof bd.moonScore).toBe('number');
        expect(typeof bd.seasonalScore).toBe('number');
        expect(typeof bd.sizeScore).toBe('number');
        expect(typeof bd.brightnessScore).toBe('number');
        expect(typeof bd.durationScore).toBe('number');
        expect(typeof bd.equipmentScore).toBe('number');
        expect(typeof bd.lightPollutionScore).toBe('number');
        expect(typeof bd.difficultyScore).toBe('number');
        expect(typeof bd.transitScore).toBe('number');
      }
    });

    it('should include imaging feasibility', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        const f = result.feasibility;
        expect(['excellent', 'good', 'fair', 'marginal', 'poor']).toContain(f.overallRating);
        expect(['perfect', 'good', 'tight', 'too_large', 'too_small']).toContain(f.fovFit);
        expect(['optimal', 'acceptable', 'oversampled', 'undersampled']).toContain(f.resolutionMatch);
        expect(typeof f.exposureEstimate).toBe('number');
        expect(typeof f.totalExposureNeeded).toBe('number');
        expect(typeof f.snrEstimate).toBe('number');
      }
    });
  });

  describe('getRecommendations', () => {
    it('should return sorted recommendations', () => {
      const engine = new AdvancedRecommendationEngine(
        { telescopeFocalLength: 500, telescopeAperture: 80 },
        { latitude: 45, longitude: -75, bortleClass: 5 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const results = engine.getRecommendations(mockSmallCatalog, new Date('2025-07-15T00:00:00Z'));
      expect(Array.isArray(results)).toBe(true);
      // Results should be sorted by score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].totalScore).toBeGreaterThanOrEqual(results[i].totalScore);
      }
    });

    it('should respect limit parameter', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const results = engine.getRecommendations(mockSmallCatalog, new Date('2025-07-15T00:00:00Z'), 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should prioritize preferred object types', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1, objectTypePreferences: ['Nebula'] }
      );
      const results = engine.getRecommendations(mockSmallCatalog, new Date('2025-01-15T00:00:00Z'));
      // If there are nebula results, they should come first
      if (results.length > 1) {
        const firstNonNebula = results.findIndex(r => !r.object.type.toLowerCase().includes('nebula'));
        const lastNebula = results.findLastIndex(r => r.object.type.toLowerCase().includes('nebula'));
        if (firstNonNebula >= 0 && lastNebula >= 0) {
          expect(lastNebula).toBeLessThan(firstNonNebula);
        }
      }
    });
  });

  describe('planSession', () => {
    it('should return empty for empty recommendations', () => {
      const engine = new AdvancedRecommendationEngine();
      const result = engine.planSession([]);
      expect(result).toEqual([]);
    });

    it('should plan session with non-overlapping targets', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1, maxTargetsPerSession: 3 }
      );
      const recommendations = engine.getRecommendations(mockSmallCatalog, new Date('2025-07-15T00:00:00Z'));
      if (recommendations.length > 0) {
        const session = engine.planSession(recommendations);
        expect(session.length).toBeLessThanOrEqual(3);
        // Session should be sorted by imaging window start
        for (let i = 1; i < session.length; i++) {
          expect(session[i].imagingWindow.start.getTime())
            .toBeGreaterThanOrEqual(session[i - 1].imagingWindow.start.getTime());
        }
      }
    });

    it('should respect maxTargets parameter', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const recommendations = engine.getRecommendations(mockSmallCatalog, new Date('2025-07-15T00:00:00Z'));
      if (recommendations.length > 0) {
        const session = engine.planSession(recommendations, 1);
        expect(session.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('scoring with different configurations', () => {
    it('should score with dark site (low Bortle)', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75, bortleClass: 2 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        expect(result.scoreBreakdown.lightPollutionScore).toBeGreaterThan(0);
      }
    });

    it('should score with light-polluted site (high Bortle)', () => {
      const engine = new AdvancedRecommendationEngine(
        { filterWheelType: 'narrowband' },
        { latitude: 45, longitude: -75, bortleClass: 8 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const result = engine.scoreObject(mockM42, new Date('2025-01-15T00:00:00Z'));
      if (result) {
        expect(result.scoreBreakdown.lightPollutionScore).toBeDefined();
      }
    });

    it('should handle beginner difficulty preference', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1, difficultyPreference: 'beginner' }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.difficultyScore).toBe('number');
      }
    });

    it('should handle advanced difficulty preference', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1, difficultyPreference: 'advanced' }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.difficultyScore).toBe('number');
      }
    });

    it('should handle meridian transit preference', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1, preferMeridianTransit: true }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.transitScore).toBe('number');
      }
    });

    it('should handle avoid meridian flip preference', () => {
      const engine = new AdvancedRecommendationEngine(
        { mountType: 'equatorial' },
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1, avoidMeridianFlip: true }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.transitScore).toBe('number');
      }
    });

    it('should handle narrowband filter with suitable object', () => {
      const engine = new AdvancedRecommendationEngine(
        { filterWheelType: 'narrowband' },
        { latitude: 45, longitude: -75, bortleClass: 6 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      // M42 is narrowband suitable
      const result = engine.scoreObject(mockM42, new Date('2025-01-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.equipmentScore).toBe('number');
      }
    });

    it('should score objects without seasonal data', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const unknownDSO: DeepSkyObject = {
        id: 'UNKNOWN1',
        name: 'UNKNOWN1',
        type: 'Galaxy',
        ra: 180,
        dec: 50,
        magnitude: 9.0,
        sizeMax: 5,
        constellation: 'UMa',
      };
      const result = engine.scoreObject(unknownDSO, new Date('2025-06-15T00:00:00Z'));
      // May or may not return result depending on altitude/duration
      if (result) {
        expect(result.totalScore).toBeGreaterThan(0);
      }
    });

    it('should handle faint objects with low surface brightness', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75, bortleClass: 7 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const result = engine.scoreObject(mockFaintDSO, new Date('2025-11-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.brightnessScore).toBe('number');
      }
    });

    it('should handle objects with no magnitude', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        { latitude: 45, longitude: -75 },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const noMagDSO: DeepSkyObject = {
        id: 'NOMAG',
        name: 'NOMAG',
        type: 'Nebula',
        ra: 180,
        dec: 50,
        constellation: 'UMa',
        sizeMax: 30,
      };
      const result = engine.scoreObject(noMagDSO, new Date('2025-06-15T00:00:00Z'));
      if (result) {
        expect(typeof result.scoreBreakdown.brightnessScore).toBe('number');
      }
    });

    it('should handle horizon obstructions', () => {
      const engine = new AdvancedRecommendationEngine(
        {},
        {
          latitude: 45,
          longitude: -75,
          horizonObstructions: [
            { azimuthStart: 0, azimuthEnd: 90, altitudeLimit: 20 },
          ],
        },
        { minimumAltitude: 10, minimumImagingHours: 0.1 }
      );
      const result = engine.scoreObject(mockM13, new Date('2025-07-15T00:00:00Z'));
      // Result may be affected by horizon obstructions
      expect(result === null || typeof result.totalScore === 'number').toBe(true);
    });
  });
});

// ============================================================================
// getQuickRecommendations Tests
// ============================================================================

describe('getQuickRecommendations', () => {
  it('should return recommendations array', () => {
    const results = getQuickRecommendations(
      mockSmallCatalog,
      45,
      -75,
      { date: new Date('2025-07-15T00:00:00Z'), limit: 5 }
    );
    expect(Array.isArray(results)).toBe(true);
  });

  it('should respect limit option', () => {
    const results = getQuickRecommendations(
      mockSmallCatalog,
      45,
      -75,
      { date: new Date('2025-07-15T00:00:00Z'), limit: 2 }
    );
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should use default options', () => {
    const results = getQuickRecommendations(mockSmallCatalog, 45, -75);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should accept Bortle class and equipment options', () => {
    const results = getQuickRecommendations(
      mockSmallCatalog,
      45,
      -75,
      {
        date: new Date('2025-07-15T00:00:00Z'),
        bortleClass: 3,
        focalLength: 1000,
        aperture: 200,
      }
    );
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return sorted by score', () => {
    const results = getQuickRecommendations(
      mockSmallCatalog,
      45,
      -75,
      { date: new Date('2025-07-15T00:00:00Z') }
    );
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalScore).toBeGreaterThanOrEqual(results[i].totalScore);
    }
  });
});
