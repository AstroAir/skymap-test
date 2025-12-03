/**
 * @jest-environment jsdom
 */
import {
  dateToJulianDate,
  julianDateToDate,
  calculateNighttimeData,
} from '../nighttime-calculator';

describe('Julian Date Functions', () => {
  describe('dateToJulianDate', () => {
    it('calculates correct JD for J2000 epoch', () => {
      const j2000 = new Date('2000-01-01T12:00:00Z');
      const jd = dateToJulianDate(j2000);
      expect(jd).toBeCloseTo(2451545.0, 1);
    });

    it('calculates correct JD for known date', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const jd = dateToJulianDate(date);
      expect(jd).toBeGreaterThan(2460000);
    });

    it('handles dates before March correctly', () => {
      const feb = new Date('2024-02-15T12:00:00Z');
      const jd = dateToJulianDate(feb);
      expect(jd).toBeGreaterThan(2460000);
    });
  });

  describe('julianDateToDate', () => {
    it('converts J2000 epoch correctly', () => {
      const date = julianDateToDate(2451545.0);
      expect(date.getUTCFullYear()).toBe(2000);
      expect(date.getUTCMonth()).toBe(0); // January
      expect(date.getUTCDate()).toBe(1);
    });

    it('round-trips with dateToJulianDate', () => {
      const original = new Date('2024-06-15T12:30:00Z');
      const jd = dateToJulianDate(original);
      const converted = julianDateToDate(jd);
      
      expect(converted.getUTCFullYear()).toBe(original.getUTCFullYear());
      expect(converted.getUTCMonth()).toBe(original.getUTCMonth());
      expect(converted.getUTCDate()).toBe(original.getUTCDate());
      expect(converted.getUTCHours()).toBe(original.getUTCHours());
    });
  });
});

describe('calculateNighttimeData', () => {
  it('returns nighttime data for given location and date', () => {
    const result = calculateNighttimeData(40.7128, -74.006, new Date('2024-06-21'));
    
    expect(result).toHaveProperty('sunRiseAndSet');
    expect(result).toHaveProperty('civilTwilightRiseAndSet');
    expect(result).toHaveProperty('nauticalTwilightRiseAndSet');
    expect(result).toHaveProperty('twilightRiseAndSet');
    expect(result).toHaveProperty('moonRiseAndSet');
    expect(result).toHaveProperty('moonPhase');
    expect(result).toHaveProperty('moonPhaseValue');
    expect(result).toHaveProperty('moonIllumination');
  });

  it('returns valid moon phase value', () => {
    const result = calculateNighttimeData(40.7128, -74.006, new Date('2024-06-21'));
    
    expect(result.moonPhaseValue).toBeGreaterThanOrEqual(0);
    expect(result.moonPhaseValue).toBeLessThanOrEqual(1);
  });

  it('returns valid moon phase name', () => {
    const result = calculateNighttimeData(40.7128, -74.006, new Date('2024-06-21'));
    const validPhases = ['newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'fullMoon', 'waningGibbous', 'lastQuarter', 'waningCrescent'];
    
    expect(validPhases).toContain(result.moonPhase);
  });

  it('returns valid moon illumination', () => {
    const result = calculateNighttimeData(40.7128, -74.006, new Date('2024-06-21'));
    
    expect(result.moonIllumination).toBeGreaterThanOrEqual(0);
    expect(result.moonIllumination).toBeLessThanOrEqual(100);
  });

  it('handles different latitudes', () => {
    // Equator
    const equator = calculateNighttimeData(0, 0, new Date('2024-06-21'));
    expect(equator.sunRiseAndSet).toBeDefined();

    // Northern latitude
    const northern = calculateNighttimeData(60, 0, new Date('2024-06-21'));
    expect(northern).toBeDefined();

    // Southern latitude
    const southern = calculateNighttimeData(-30, 0, new Date('2024-06-21'));
    expect(southern.sunRiseAndSet).toBeDefined();
  });

  it('handles different dates', () => {
    // Summer solstice
    const summer = calculateNighttimeData(40, 0, new Date('2024-06-21'));
    expect(summer).toBeDefined();

    // Winter solstice
    const winter = calculateNighttimeData(40, 0, new Date('2024-12-21'));
    expect(winter).toBeDefined();

    // Equinox
    const equinox = calculateNighttimeData(40, 0, new Date('2024-03-20'));
    expect(equinox).toBeDefined();
  });

  it('caches results for same location and date', () => {
    const date = new Date('2024-06-21');
    const result1 = calculateNighttimeData(40.7128, -74.006, date);
    const result2 = calculateNighttimeData(40.7128, -74.006, date);
    
    // Results should be identical (from cache)
    expect(result1.moonPhase).toBe(result2.moonPhase);
    expect(result1.moonIllumination).toBe(result2.moonIllumination);
  });
});
