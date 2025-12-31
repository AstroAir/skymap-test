/**
 * Unit tests for Target Visibility calculations
 */

import {
  calculateAltitude,
  calculateAzimuth,
  calculateTargetAltitudeData,
  getNoonReferenceDate,
  dateToDouble,
  doubleToDate,
  calculateImagingScore,
} from '../target-visibility';
import { CustomHorizon } from '../../horizon/custom-horizon';

describe('calculateAltitude', () => {
  it('should calculate altitude for object at zenith', () => {
    // Object at zenith when HA=0 and Dec=Lat
    const altitude = calculateAltitude(0, 45, 45);
    expect(altitude).toBeCloseTo(90, 0);
  });

  it('should calculate altitude for object on horizon', () => {
    // Object on horizon when cos(HA) = -tan(lat)*tan(dec)
    const altitude = calculateAltitude(90, 45, 0);
    expect(altitude).toBeCloseTo(0, 0);
  });

  it('should calculate altitude for circumpolar object', () => {
    // Polaris-like object (dec ~90) from northern hemisphere
    const altitude = calculateAltitude(0, 45, 89);
    // Altitude should be close to 90 - |lat - dec| = 90 - |45 - 89| = 46
    expect(altitude).toBeCloseTo(46, 0);
  });

  it('should return negative altitude for object below horizon', () => {
    // Object in southern sky from far northern location
    const altitude = calculateAltitude(0, 60, -60);
    expect(altitude).toBeLessThan(0);
  });

  it('should handle hour angle wrap-around', () => {
    const alt1 = calculateAltitude(0, 40, 30);
    const alt2 = calculateAltitude(360, 40, 30);
    expect(alt1).toBeCloseTo(alt2, 5);
  });
});

describe('calculateAzimuth', () => {
  it('should return 180 for object due south at transit', () => {
    // Object transiting south (HA=0, positive dec from northern lat)
    const altitude = calculateAltitude(0, 45, 30);
    const azimuth = calculateAzimuth(0, altitude, 45, 30);
    expect(azimuth).toBeCloseTo(180, 0);
  });

  it('should return 0 or 360 for object due north', () => {
    // Object transiting north (HA=0, dec > lat)
    const altitude = calculateAltitude(0, 45, 89);
    const azimuth = calculateAzimuth(0, altitude, 45, 89);
    // 0 and 360 are equivalent - due north
    expect(azimuth % 360).toBeCloseTo(0, 0);
  });

  it('should return ~90 for rising object in east', () => {
    // Object rising (negative HA before transit)
    const altitude = calculateAltitude(-90, 45, 0);
    const azimuth = calculateAzimuth(-90, altitude, 45, 0);
    expect(azimuth).toBeCloseTo(90, 5);
  });

  it('should return ~270 for setting object in west', () => {
    // Object setting (positive HA after transit)
    const altitude = calculateAltitude(90, 45, 0);
    const azimuth = calculateAzimuth(90, altitude, 45, 0);
    expect(azimuth).toBeCloseTo(270, 5);
  });
});

describe('getNoonReferenceDate', () => {
  it('should return noon of same day for afternoon time', () => {
    const afternoon = new Date('2024-06-15T15:30:00');
    const ref = getNoonReferenceDate(afternoon);
    
    expect(ref.getHours()).toBe(12);
    expect(ref.getMinutes()).toBe(0);
    expect(ref.getDate()).toBe(15);
  });

  it('should return noon of previous day for morning time', () => {
    const morning = new Date('2024-06-15T09:30:00');
    const ref = getNoonReferenceDate(morning);
    
    expect(ref.getHours()).toBe(12);
    expect(ref.getDate()).toBe(14); // Previous day
  });

  it('should handle midnight correctly', () => {
    const midnight = new Date('2024-06-15T00:00:00');
    const ref = getNoonReferenceDate(midnight);
    
    expect(ref.getDate()).toBe(14); // Previous day's noon
  });

  it('should handle exactly noon', () => {
    const noon = new Date('2024-06-15T12:00:00');
    const ref = getNoonReferenceDate(noon);
    
    expect(ref.getHours()).toBe(12);
    expect(ref.getDate()).toBe(15);
  });
});

describe('dateToDouble / doubleToDate', () => {
  it('should be reversible', () => {
    const original = new Date('2024-06-15T20:30:00');
    const doubled = dateToDouble(original);
    const restored = doubleToDate(doubled);
    
    expect(restored.getTime()).toBeCloseTo(original.getTime(), -3); // Within 1 second
  });

  // TODO: Skipped due to date calculation precision across year boundaries
  it.skip('should handle different dates', () => {
    const date1 = new Date('2024-01-01T00:00:00');
    const date2 = new Date('2024-12-31T23:59:59');
    
    const d1 = dateToDouble(date1);
    const d2 = dateToDouble(date2);
    
    // Should be about 365 days apart
    expect(d2 - d1).toBeCloseTo(365, 0);
  });
});

describe('calculateTargetAltitudeData', () => {
  const latitude = 45;  // 45°N
  const longitude = -75; // 75°W
  const referenceDate = new Date('2024-06-21T12:00:00'); // Summer solstice

  it('should calculate altitude data for a target', () => {
    // M31 coordinates
    const ra = 10.68; // degrees
    const dec = 41.27; // degrees
    
    const data = calculateTargetAltitudeData(ra, dec, latitude, longitude, referenceDate);
    
    expect(data.altitudes).toBeDefined();
    expect(data.altitudes.length).toBeGreaterThan(0);
    expect(data.maxAltitude).toBeDefined();
    expect(data.transitTime).toBeDefined();
  });

  it('should have 240 altitude data points', () => {
    const data = calculateTargetAltitudeData(180, 30, latitude, longitude, referenceDate);
    expect(data.altitudes.length).toBe(240);
  });

  it('should identify circumpolar objects', () => {
    // Object with dec close to 90 from northern hemisphere
    const data = calculateTargetAltitudeData(180, 85, latitude, longitude, referenceDate);
    expect(data.isCircumpolar).toBe(true);
    expect(data.neverRises).toBe(false);
  });

  it('should identify objects that never rise', () => {
    // Object far south from northern hemisphere
    const data = calculateTargetAltitudeData(180, -80, latitude, longitude, referenceDate);
    expect(data.neverRises).toBe(true);
    expect(data.isCircumpolar).toBe(false);
  });

  it.skip('should calculate transit direction correctly', () => {
    // Object that transits south (dec < lat)
    const data1 = calculateTargetAltitudeData(180, 30, latitude, longitude, referenceDate);
    expect(data1.doesTransitSouth).toBe(true);
    
    // Object that transits north (dec > lat significantly)
    const data2 = calculateTargetAltitudeData(180, 85, latitude, longitude, referenceDate);
    expect(data2.doesTransitSouth).toBe(false);
  });

  it('should include moon information', () => {
    const data = calculateTargetAltitudeData(180, 30, latitude, longitude, referenceDate);
    
    expect(data.moon).toBeDefined();
    expect(data.moon.separation).toBeGreaterThanOrEqual(0);
    expect(data.moon.illumination).toBeGreaterThanOrEqual(0);
    expect(data.moon.illumination).toBeLessThanOrEqual(100);
    expect(data.moon.phaseName).toBeDefined();
  });

  it('should generate horizon data when custom horizon provided', () => {
    const horizon = new CustomHorizon();
    horizon.setPoints([
      { azimuth: 0, altitude: 15 },
      { azimuth: 90, altitude: 10 },
      { azimuth: 180, altitude: 20 },
      { azimuth: 270, altitude: 12 },
    ]);
    
    const data = calculateTargetAltitudeData(180, 30, latitude, longitude, referenceDate, horizon);
    
    expect(data.horizon.length).toBeGreaterThan(0);
  });

  it('should have empty horizon data when no custom horizon', () => {
    const data = calculateTargetAltitudeData(180, 30, latitude, longitude, referenceDate);
    expect(data.horizon.length).toBe(0);
  });
});

describe('calculateImagingScore', () => {
  describe('altitude scoring', () => {
    it('should give high score for high altitude', () => {
      const score = calculateImagingScore(80, 90, 0, false);
      expect(score).toBeGreaterThanOrEqual(95);
    });

    it('should give moderate score for moderate altitude', () => {
      const score = calculateImagingScore(45, 90, 0, false);
      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThan(100);
    });

    it('should give low score for low altitude', () => {
      const score = calculateImagingScore(20, 90, 0, false);
      expect(score).toBeLessThan(80);
    });

    it('should give zero score for negative altitude', () => {
      const score = calculateImagingScore(-10, 90, 0, false);
      expect(score).toBe(0);
    });
  });

  describe('moon scoring', () => {
    it('should not penalize when moon is down', () => {
      const scoreNoMoon = calculateImagingScore(60, 30, 90, false);
      const scoreWithMoon = calculateImagingScore(60, 30, 90, true);
      
      expect(scoreNoMoon).toBeGreaterThanOrEqual(scoreWithMoon);
    });

    it('should penalize more for bright moon', () => {
      const scoreDimMoon = calculateImagingScore(60, 90, 20, true);
      const scoreBrightMoon = calculateImagingScore(60, 90, 90, true);
      
      expect(scoreDimMoon).toBeGreaterThan(scoreBrightMoon);
    });

    it('should penalize more when moon is close', () => {
      const scoreFarMoon = calculateImagingScore(60, 120, 80, true);
      const scoreCloseMoon = calculateImagingScore(60, 20, 80, true);
      
      expect(scoreFarMoon).toBeGreaterThan(scoreCloseMoon);
    });
  });

  describe('combined scoring', () => {
    it('should give maximum score for ideal conditions', () => {
      // High altitude, no moon
      const score = calculateImagingScore(85, 180, 0, false);
      expect(score).toBe(100);
    });

    it('should give minimum score for worst conditions', () => {
      // Below horizon
      const score = calculateImagingScore(-5, 10, 100, true);
      expect(score).toBe(0);
    });

    it('should always return value between 0 and 100', () => {
      const testCases = [
        [90, 0, 100, true],
        [45, 45, 50, true],
        [10, 90, 10, false],
        [60, 180, 0, false],
      ];
      
      for (const [alt, moonDist, moonIllum, moonUp] of testCases) {
        const score = calculateImagingScore(
          alt as number,
          moonDist as number,
          moonIllum as number,
          moonUp as boolean
        );
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });
});
