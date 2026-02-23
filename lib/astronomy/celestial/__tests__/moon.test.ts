/**
 * @jest-environment node
 */
import {
  SYNODIC_MONTH,
  MOON_PHASE_NAMES,
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonInfo,
  getMoonPosition,
  getMoonAltitude,
  isMoonUp,
  getNextMoonPhase,
} from '../moon';

describe('Moon Calculations', () => {
  // ============================================================================
  // Constants
  // ============================================================================
  describe('Constants', () => {
    it('SYNODIC_MONTH is approximately 29.53 days', () => {
      expect(SYNODIC_MONTH).toBeCloseTo(29.53058867, 4);
    });

    it('MOON_PHASE_NAMES has all phases', () => {
      expect(MOON_PHASE_NAMES.new).toBe('New Moon');
      expect(MOON_PHASE_NAMES.waxingCrescent).toBe('Waxing Crescent');
      expect(MOON_PHASE_NAMES.firstQuarter).toBe('First Quarter');
      expect(MOON_PHASE_NAMES.waxingGibbous).toBe('Waxing Gibbous');
      expect(MOON_PHASE_NAMES.full).toBe('Full Moon');
      expect(MOON_PHASE_NAMES.waningGibbous).toBe('Waning Gibbous');
      expect(MOON_PHASE_NAMES.lastQuarter).toBe('Last Quarter');
      expect(MOON_PHASE_NAMES.waningCrescent).toBe('Waning Crescent');
    });
  });

  // ============================================================================
  // getMoonPhase
  // ============================================================================
  describe('getMoonPhase', () => {
    it('returns value between 0 and 1', () => {
      const phase = getMoonPhase();
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    });

    it('accepts Julian Date parameter', () => {
      const phase = getMoonPhase(2451545.0);
      expect(typeof phase).toBe('number');
    });

    it('returns approximately 0 at known new moon', () => {
      // January 6, 2000 was a new moon (JD 2451550.1)
      const phase = getMoonPhase(2451550.1);
      // Depending on the exact algorithm/epoch, new moon can wrap near 1.0 as well as 0.0.
      const wrapped = Math.min(phase, 1 - phase);
      expect(wrapped).toBeLessThan(0.05);
    });

    it('returns approximately 0.5 at known full moon', () => {
      // About 14.77 days after new moon
      const fullMoonJD = 2451550.1 + SYNODIC_MONTH / 2;
      const phase = getMoonPhase(fullMoonJD);
      expect(phase).toBeCloseTo(0.5, 1);
    });

    it('phase increases over time', () => {
      const jd = 2451545.0;
      const phase1 = getMoonPhase(jd);
      const phase2 = getMoonPhase(jd + 5);
      
      // After 5 days, phase should increase by about 5/29.53 = 0.17
      const diff = (phase2 - phase1 + 1) % 1;
      expect(diff).toBeCloseTo(5 / SYNODIC_MONTH, 1);
    });

    it('completes cycle in synodic month', () => {
      const jd = 2451545.0;
      const phase1 = getMoonPhase(jd);
      const phase2 = getMoonPhase(jd + SYNODIC_MONTH);
      
      // SYNODIC_MONTH is an average; allow a small circular tolerance.
      const diff = Math.abs(phase2 - phase1);
      const circularDiff = Math.min(diff, 1 - diff);
      expect(circularDiff).toBeLessThan(0.03);
    });
  });

  // ============================================================================
  // getMoonPhaseName
  // ============================================================================
  describe('getMoonPhaseName', () => {
    it('returns "new" for phase near 0', () => {
      expect(getMoonPhaseName(0)).toBe('new');
      expect(getMoonPhaseName(0.02)).toBe('new');
      expect(getMoonPhaseName(0.98)).toBe('new');
    });

    it('returns "waxingCrescent" for phase 0.03-0.22', () => {
      expect(getMoonPhaseName(0.1)).toBe('waxingCrescent');
      expect(getMoonPhaseName(0.15)).toBe('waxingCrescent');
    });

    it('returns "firstQuarter" for phase 0.22-0.28', () => {
      expect(getMoonPhaseName(0.25)).toBe('firstQuarter');
    });

    it('returns "waxingGibbous" for phase 0.28-0.47', () => {
      expect(getMoonPhaseName(0.35)).toBe('waxingGibbous');
      expect(getMoonPhaseName(0.4)).toBe('waxingGibbous');
    });

    it('returns "full" for phase 0.47-0.53', () => {
      expect(getMoonPhaseName(0.5)).toBe('full');
    });

    it('returns "waningGibbous" for phase 0.53-0.72', () => {
      expect(getMoonPhaseName(0.6)).toBe('waningGibbous');
      expect(getMoonPhaseName(0.65)).toBe('waningGibbous');
    });

    it('returns "lastQuarter" for phase 0.72-0.78', () => {
      expect(getMoonPhaseName(0.75)).toBe('lastQuarter');
    });

    it('returns "waningCrescent" for phase 0.78-0.97', () => {
      expect(getMoonPhaseName(0.85)).toBe('waningCrescent');
      expect(getMoonPhaseName(0.9)).toBe('waningCrescent');
    });
  });

  // ============================================================================
  // getMoonIllumination
  // ============================================================================
  describe('getMoonIllumination', () => {
    it('returns 0 at new moon', () => {
      expect(getMoonIllumination(0)).toBe(0);
    });

    it('returns 100 at full moon', () => {
      expect(getMoonIllumination(0.5)).toBe(100);
    });

    it('returns approximately 50 at quarter', () => {
      expect(getMoonIllumination(0.25)).toBeCloseTo(50, 0);
      expect(getMoonIllumination(0.75)).toBeCloseTo(50, 0);
    });

    it('returns value between 0 and 100', () => {
      for (let phase = 0; phase <= 1; phase += 0.1) {
        const illumination = getMoonIllumination(phase);
        expect(illumination).toBeGreaterThanOrEqual(0);
        expect(illumination).toBeLessThanOrEqual(100);
      }
    });

    it('is symmetric around full moon', () => {
      expect(getMoonIllumination(0.3)).toBeCloseTo(getMoonIllumination(0.7), 0);
      expect(getMoonIllumination(0.1)).toBeCloseTo(getMoonIllumination(0.9), 0);
    });
  });

  // ============================================================================
  // getMoonInfo
  // ============================================================================
  describe('getMoonInfo', () => {
    it('returns phase, phaseName, and illumination', () => {
      const info = getMoonInfo();
      expect(info).toHaveProperty('phase');
      expect(info).toHaveProperty('phaseName');
      expect(info).toHaveProperty('illumination');
    });

    it('phase is between 0 and 1', () => {
      const info = getMoonInfo();
      expect(info.phase).toBeGreaterThanOrEqual(0);
      expect(info.phase).toBeLessThan(1);
    });

    it('phaseName is a valid phase', () => {
      const validPhases = [
        'new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous',
        'full', 'waningGibbous', 'lastQuarter', 'waningCrescent'
      ];
      const info = getMoonInfo();
      expect(validPhases).toContain(info.phaseName);
    });

    it('illumination is between 0 and 100', () => {
      const info = getMoonInfo();
      expect(info.illumination).toBeGreaterThanOrEqual(0);
      expect(info.illumination).toBeLessThanOrEqual(100);
    });

    it('accepts Julian Date parameter', () => {
      const info = getMoonInfo(2451545.0);
      expect(info.phase).toBeDefined();
    });
  });

  // ============================================================================
  // getMoonPosition
  // ============================================================================
  describe('getMoonPosition', () => {
    it('returns ra and dec', () => {
      const pos = getMoonPosition();
      expect(pos).toHaveProperty('ra');
      expect(pos).toHaveProperty('dec');
    });

    it('RA is between 0 and 360', () => {
      const pos = getMoonPosition();
      expect(pos.ra).toBeGreaterThanOrEqual(0);
      expect(pos.ra).toBeLessThan(360);
    });

    it('Dec is between -30 and 30 (approximate ecliptic)', () => {
      // Moon's declination varies roughly between -29° and +29°
      const pos = getMoonPosition();
      expect(pos.dec).toBeGreaterThan(-35);
      expect(pos.dec).toBeLessThan(35);
    });

    it('accepts Julian Date parameter', () => {
      const pos = getMoonPosition(2451545.0);
      expect(typeof pos.ra).toBe('number');
      expect(typeof pos.dec).toBe('number');
    });

    it('position changes over time', () => {
      const pos1 = getMoonPosition(2451545.0);
      const pos2 = getMoonPosition(2451545.0 + 1);
      
      // Moon moves about 13 degrees per day
      expect(pos1.ra).not.toEqual(pos2.ra);
    });
  });

  // ============================================================================
  // getMoonAltitude
  // ============================================================================
  describe('getMoonAltitude', () => {
    const latitude = 39.9; // Beijing
    const longitude = 116.4;

    it('returns a number', () => {
      const alt = getMoonAltitude(latitude, longitude);
      expect(typeof alt).toBe('number');
    });

    it('altitude is between -90 and 90', () => {
      const alt = getMoonAltitude(latitude, longitude);
      expect(alt).toBeGreaterThanOrEqual(-90);
      expect(alt).toBeLessThanOrEqual(90);
    });

    it('accepts date parameter', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const alt = getMoonAltitude(latitude, longitude, date);
      expect(typeof alt).toBe('number');
    });

    it('different times give different altitudes', () => {
      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-06-21T12:00:00Z');
      
      const alt1 = getMoonAltitude(latitude, longitude, date1);
      const alt2 = getMoonAltitude(latitude, longitude, date2);
      
      expect(alt1).not.toEqual(alt2);
    });
  });

  // ============================================================================
  // isMoonUp
  // ============================================================================
  describe('isMoonUp', () => {
    const latitude = 39.9;
    const longitude = 116.4;

    it('returns boolean', () => {
      const result = isMoonUp(latitude, longitude);
      expect(typeof result).toBe('boolean');
    });

    it('is true when altitude is positive', () => {
      // This is more of a sanity check
      const date = new Date();
      const alt = getMoonAltitude(latitude, longitude, date);
      const up = isMoonUp(latitude, longitude, date);
      
      expect(up).toBe(alt > 0);
    });

    it('accepts date parameter', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const result = isMoonUp(latitude, longitude, date);
      expect(typeof result).toBe('boolean');
    });
  });

  // ============================================================================
  // getNextMoonPhase
  // ============================================================================
  describe('getNextMoonPhase', () => {
    it('returns a Date', () => {
      const next = getNextMoonPhase(0.5);
      expect(next).toBeInstanceOf(Date);
    });

    it('returns date in the future', () => {
      const now = new Date();
      const next = getNextMoonPhase(0.5, now);
      expect(next.getTime()).toBeGreaterThan(now.getTime());
    });

    it('next new moon is within ~30 days', () => {
      const now = new Date();
      const next = getNextMoonPhase(0, now);
      
      const diffDays = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThanOrEqual(SYNODIC_MONTH);
      expect(diffDays).toBeGreaterThan(0);
    });

    it('next full moon is within ~30 days', () => {
      const now = new Date();
      const next = getNextMoonPhase(0.5, now);
      
      const diffDays = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThanOrEqual(SYNODIC_MONTH);
      expect(diffDays).toBeGreaterThan(0);
    });

    it('accepts custom start date', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const next = getNextMoonPhase(0.5, startDate);
      expect(next.getTime()).toBeGreaterThan(startDate.getTime());
    });
  });
});
