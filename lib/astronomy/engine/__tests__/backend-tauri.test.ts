/**
 * @jest-environment node
 */

// Mock dependencies before importing
jest.mock('@/lib/tauri/astronomy-api', () => ({
  astronomyApi: {
    coordinates: {
      equatorialToHorizontal: jest.fn(),
      equatorialToGalactic: jest.fn(),
      equatorialToEcliptic: jest.fn(),
    },
    visibility: {
      calculateVisibility: jest.fn(),
    },
    celestial: {
      getSunPosition: jest.fn(),
      getMoonPosition: jest.fn(),
      getMoonPhase: jest.fn(),
    },
    isAvailable: jest.fn(),
  },
}));

jest.mock('@/lib/tauri/events-api', () => ({
  eventsApi: {
    getAstroEvents: jest.fn(),
    isAvailable: jest.fn(),
  },
}));

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(),
}));

jest.mock('@/lib/astronomy/twilight/calculator', () => ({
  calculateTwilightTimes: jest.fn(),
}));

jest.mock('@/lib/astronomy/time/sidereal', () => ({
  getLSTForDate: jest.fn(),
}));

import { tauriAstronomyBackend } from '../backend-tauri';
import { astronomyApi } from '@/lib/tauri/astronomy-api';
import { eventsApi } from '@/lib/tauri/events-api';
import { isTauri } from '@/lib/storage/platform';
import { calculateTwilightTimes } from '@/lib/astronomy/twilight/calculator';
import { getLSTForDate } from '@/lib/astronomy/time/sidereal';

const mockIsTauri = isTauri as jest.MockedFunction<typeof isTauri>;
const mockAstronomyApi = jest.mocked(astronomyApi, { shallow: false });
const mockEventsApi = eventsApi as jest.Mocked<typeof eventsApi>;
const mockCalcTwilight = calculateTwilightTimes as jest.MockedFunction<typeof calculateTwilightTimes>;
const mockGetLST = getLSTForDate as jest.MockedFunction<typeof getLSTForDate>;

const observer = { latitude: 39.9042, longitude: 116.4074, elevation: 50 };
const testDate = new Date('2025-06-15T12:00:00Z');
const testTimestamp = Math.floor(testDate.getTime() / 1000);

function setupTauriAvailable() {
  mockIsTauri.mockReturnValue(true);
  (mockAstronomyApi.isAvailable as jest.Mock).mockReturnValue(true);
  (mockEventsApi.isAvailable as jest.Mock).mockReturnValue(true);
}

function setupTauriUnavailable() {
  mockIsTauri.mockReturnValue(false);
}

describe('tauriAstronomyBackend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // Unavailability guards
  // ========================================================================
  describe('unavailability guards', () => {
    beforeEach(() => setupTauriUnavailable());

    it('computeCoordinates throws when Tauri unavailable', async () => {
      await expect(
        tauriAstronomyBackend.computeCoordinates({
          coordinate: { ra: 10, dec: 41 },
          observer,
          date: testDate,
        })
      ).rejects.toThrow('Tauri backend is unavailable');
    });

    it('computeEphemeris throws when Tauri unavailable', async () => {
      await expect(
        tauriAstronomyBackend.computeEphemeris({
          body: 'Custom',
          observer,
          startDate: testDate,
          stepHours: 1,
          steps: 2,
          customCoordinate: { ra: 10, dec: 41 },
        })
      ).rejects.toThrow('Tauri backend is unavailable');
    });

    it('computeRiseTransitSet throws when Tauri unavailable', async () => {
      await expect(
        tauriAstronomyBackend.computeRiseTransitSet({
          body: 'Custom',
          observer,
          date: testDate,
          customCoordinate: { ra: 10, dec: 41 },
        })
      ).rejects.toThrow('Tauri backend is unavailable');
    });

    it('searchPhenomena throws when Tauri events unavailable', async () => {
      mockIsTauri.mockReturnValue(true);
      (mockEventsApi.isAvailable as jest.Mock).mockReturnValue(false);
      await expect(
        tauriAstronomyBackend.searchPhenomena({
          startDate: testDate,
          endDate: new Date('2025-07-15T00:00:00Z'),
          observer,
        })
      ).rejects.toThrow('Tauri events backend is unavailable');
    });

    it('computeAlmanac throws when Tauri unavailable', async () => {
      await expect(
        tauriAstronomyBackend.computeAlmanac({ date: testDate, observer })
      ).rejects.toThrow('Tauri backend is unavailable');
    });
  });

  // ========================================================================
  // computeCoordinates
  // ========================================================================
  describe('computeCoordinates', () => {
    beforeEach(() => {
      setupTauriAvailable();
      mockAstronomyApi.coordinates.equatorialToHorizontal.mockResolvedValue({ alt: 45, az: 180 });
      mockAstronomyApi.coordinates.equatorialToGalactic.mockResolvedValue({ l: 121.17, b: -21.57 });
      mockAstronomyApi.coordinates.equatorialToEcliptic.mockResolvedValue({ lon: 8.5, lat: 36.8 });
      mockGetLST.mockReturnValue(100);
    });

    it('computes all coordinate systems', async () => {
      const result = await tauriAstronomyBackend.computeCoordinates({
        coordinate: { ra: 10.68, dec: 41.27 },
        observer,
        date: testDate,
      });

      expect(result.equatorial.ra).toBeCloseTo(10.68, 1);
      expect(result.equatorial.dec).toBe(41.27);
      expect(result.horizontal.altitude).toBe(45);
      expect(result.horizontal.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.galactic.l).toBeGreaterThanOrEqual(0);
      expect(result.ecliptic.longitude).toBeGreaterThanOrEqual(0);
      expect(result.sidereal.lst).toBe(100);
      expect(result.meta.backend).toBe('tauri');
    });

    it('passes refraction flag correctly', async () => {
      await tauriAstronomyBackend.computeCoordinates({
        coordinate: { ra: 10, dec: 41 },
        observer,
        date: testDate,
        refraction: 'none',
      });

      expect(mockAstronomyApi.coordinates.equatorialToHorizontal).toHaveBeenCalledWith(
        10, 41, observer.latitude, observer.longitude, testTimestamp, false
      );
    });
  });

  // ========================================================================
  // computeRiseTransitSet
  // ========================================================================
  describe('computeRiseTransitSet', () => {
    beforeEach(() => {
      setupTauriAvailable();
      mockAstronomyApi.coordinates.equatorialToHorizontal.mockResolvedValue({ alt: 30, az: 90 });
      mockAstronomyApi.coordinates.equatorialToGalactic.mockResolvedValue({ l: 100, b: -20 });
      mockAstronomyApi.coordinates.equatorialToEcliptic.mockResolvedValue({ lon: 50, lat: 10 });
      mockGetLST.mockReturnValue(200);
    });

    it('computes RTS for custom target', async () => {
      mockAstronomyApi.visibility.calculateVisibility.mockResolvedValue({
        is_visible: true,
        current_altitude: 30,
        current_azimuth: 90,
        rise_time: testTimestamp - 3600,
        set_time: testTimestamp + 3600,
        transit_time: testTimestamp,
        transit_altitude: 65,
        is_circumpolar: false,
        never_rises: false,
        hours_visible: 8,
      });
      mockCalcTwilight.mockReturnValue({
        astronomicalDawn: new Date('2025-06-15T20:00:00Z'),
        astronomicalDusk: new Date('2025-06-15T16:00:00Z'),
        nauticalDawn: new Date('2025-06-15T19:30:00Z'),
        nauticalDusk: new Date('2025-06-15T16:30:00Z'),
        civilDawn: new Date('2025-06-15T19:00:00Z'),
        civilDusk: new Date('2025-06-15T17:00:00Z'),
        sunrise: new Date('2025-06-15T18:30:00Z'),
        sunset: new Date('2025-06-15T17:30:00Z'),
        darknessDuration: 4,
        nightDuration: 4,
        isCurrentlyNight: true,
        currentTwilightPhase: 'night',
      });

      const result = await tauriAstronomyBackend.computeRiseTransitSet({
        body: 'Custom',
        observer,
        date: testDate,
        customCoordinate: { ra: 83.82, dec: -5.39 },
      });

      expect(result.transitAltitude).toBe(65);
      expect(result.currentAltitude).toBe(30);
      expect(result.isCircumpolar).toBe(false);
      expect(result.neverRises).toBe(false);
      expect(result.meta.backend).toBe('tauri');
    });

    it('throws for unsupported body', async () => {
      await expect(
        tauriAstronomyBackend.computeRiseTransitSet({
          body: 'Mars',
          observer,
          date: testDate,
        })
      ).rejects.toThrow('Tauri backend does not support Mars');
    });

    it('computes RTS for Sun', async () => {
      mockAstronomyApi.celestial.getSunPosition.mockResolvedValue({
        ra: 85.0, dec: 23.4, altitude: 60, azimuth: 180,
      });
      mockAstronomyApi.visibility.calculateVisibility.mockResolvedValue({
        is_visible: true,
        current_altitude: 60,
        current_azimuth: 180,
        rise_time: testTimestamp - 7200,
        set_time: testTimestamp + 7200,
        transit_time: testTimestamp,
        transit_altitude: 73,
        is_circumpolar: false,
        never_rises: false,
        hours_visible: 14,
      });
      mockCalcTwilight.mockReturnValue({
        astronomicalDawn: null,
        astronomicalDusk: null,
        nauticalDawn: null,
        nauticalDusk: null,
        civilDawn: null,
        civilDusk: null,
        sunrise: null,
        sunset: null,
        darknessDuration: 0,
        nightDuration: 0,
        isCurrentlyNight: false,
        currentTwilightPhase: 'day',
      });

      const result = await tauriAstronomyBackend.computeRiseTransitSet({
        body: 'Sun',
        observer,
        date: testDate,
      });

      expect(result.darkImagingStart).toBeNull();
      expect(result.darkImagingEnd).toBeNull();
      expect(result.darkImagingHours).toBe(0);
    });

    it('computes RTS for Moon', async () => {
      mockAstronomyApi.celestial.getMoonPosition.mockResolvedValue({
        ra: 120, dec: 18, altitude: 40, azimuth: 200, distance: 384400,
      });
      mockAstronomyApi.visibility.calculateVisibility.mockResolvedValue({
        is_visible: true,
        current_altitude: 40,
        current_azimuth: 200,
        rise_time: testTimestamp - 5000,
        set_time: testTimestamp + 5000,
        transit_time: testTimestamp,
        transit_altitude: 55,
        is_circumpolar: false,
        never_rises: false,
        hours_visible: 10,
      });
      mockCalcTwilight.mockReturnValue({
        astronomicalDawn: new Date('2025-06-15T20:00:00Z'),
        astronomicalDusk: new Date('2025-06-15T16:00:00Z'),
        nauticalDawn: null,
        nauticalDusk: null,
        civilDawn: null,
        civilDusk: null,
        sunrise: null,
        sunset: null,
        darknessDuration: 4,
        nightDuration: 4,
        isCurrentlyNight: true,
        currentTwilightPhase: 'night',
      });

      const result = await tauriAstronomyBackend.computeRiseTransitSet({
        body: 'Moon',
        observer,
        date: testDate,
      });

      expect(result.transitAltitude).toBe(55);
      expect(result.meta.backend).toBe('tauri');
    });
  });

  // ========================================================================
  // computeEphemeris
  // ========================================================================
  describe('computeEphemeris', () => {
    beforeEach(() => {
      setupTauriAvailable();
      mockAstronomyApi.coordinates.equatorialToHorizontal.mockResolvedValue({ alt: 50, az: 150 });
      mockAstronomyApi.coordinates.equatorialToGalactic.mockResolvedValue({ l: 100, b: -20 });
      mockAstronomyApi.coordinates.equatorialToEcliptic.mockResolvedValue({ lon: 50, lat: 10 });
      mockGetLST.mockReturnValue(200);
    });

    it('computes ephemeris for custom target', async () => {
      const result = await tauriAstronomyBackend.computeEphemeris({
        body: 'Custom',
        observer,
        startDate: testDate,
        stepHours: 1,
        steps: 3,
        customCoordinate: { ra: 83.82, dec: -5.39 },
      });

      expect(result.body).toBe('Custom');
      expect(result.points).toHaveLength(3);
      expect(result.meta.backend).toBe('tauri');
    });

    it('computes ephemeris for Moon with phase', async () => {
      mockAstronomyApi.celestial.getMoonPosition.mockResolvedValue({
        ra: 120, dec: 18, altitude: 40, azimuth: 200, distance: 384400,
      });
      mockAstronomyApi.celestial.getMoonPhase.mockResolvedValue({
        phase: 0.5, illumination: 100, age: 14.7, phase_name: 'Full Moon', is_waxing: false,
      });

      const result = await tauriAstronomyBackend.computeEphemeris({
        body: 'Moon',
        observer,
        startDate: testDate,
        stepHours: 1,
        steps: 2,
      });

      expect(result.body).toBe('Moon');
      expect(result.points).toHaveLength(2);
      expect(result.points[0].phaseFraction).toBe(0.5);
    });

    it('throws for unsupported body', async () => {
      await expect(
        tauriAstronomyBackend.computeEphemeris({
          body: 'Jupiter',
          observer,
          startDate: testDate,
          stepHours: 1,
          steps: 2,
        })
      ).rejects.toThrow('Tauri backend does not support Jupiter');
    });
  });

  // ========================================================================
  // searchPhenomena
  // ========================================================================
  describe('searchPhenomena', () => {
    beforeEach(() => setupTauriAvailable());

    it('maps and sorts phenomena events', async () => {
      (mockEventsApi.getAstroEvents as jest.Mock).mockResolvedValue([
        {
          id: '1',
          event_type: 'full_moon',
          name: 'Full Moon',
          description: 'Full Moon',
          date: '2025-07-01',
          time: null,
          timestamp: 1751328000,
          magnitude: null,
          visibility: null,
          details: null,
        },
        {
          id: '2',
          event_type: 'planetary_conjunction',
          name: 'Venus-Jupiter Conjunction',
          description: 'Venus meets Jupiter',
          date: '2025-06-20',
          time: null,
          timestamp: 1750377600,
          magnitude: 2.5,
          visibility: null,
          details: null,
        },
      ]);

      const result = await tauriAstronomyBackend.searchPhenomena({
        startDate: testDate,
        endDate: new Date('2025-07-15T00:00:00Z'),
        observer,
      });

      expect(result.events).toHaveLength(2);
      // Should be sorted by date
      expect(result.events[0].date.getTime()).toBeLessThanOrEqual(result.events[1].date.getTime());
      expect(result.events[0].type).toBe('conjunction');
      expect(result.events[1].type).toBe('moon_phase');
      expect(result.meta.backend).toBe('tauri');
    });

    it('maps different event types correctly', async () => {
      (mockEventsApi.getAstroEvents as jest.Mock).mockResolvedValue([
        { id: '1', event_type: 'planetary_opposition', name: 'Mars Opposition', description: '', date: '2025-07-01', time: null, timestamp: 1751328000, magnitude: null, visibility: null, details: null },
        { id: '2', event_type: 'planetary_elongation', name: 'Mercury Elongation', description: '', date: '2025-07-02', time: null, timestamp: 1751414400, magnitude: null, visibility: null, details: null },
        { id: '3', event_type: 'new_moon', name: 'New Moon', description: '', date: '2025-07-03', time: null, timestamp: 1751500800, magnitude: null, visibility: null, details: null },
        { id: '4', event_type: 'solar_eclipse', name: 'Solar Eclipse', description: '', date: '2025-07-04', time: null, timestamp: 1751587200, magnitude: null, visibility: null, details: null },
      ]);

      const result = await tauriAstronomyBackend.searchPhenomena({
        startDate: testDate,
        endDate: new Date('2025-07-15T00:00:00Z'),
        observer,
      });

      expect(result.events[0].type).toBe('opposition');
      expect(result.events[1].type).toBe('elongation');
      expect(result.events[2].type).toBe('moon_phase');
      expect(result.events[2].importance).toBe('high'); // new_moon
      expect(result.events[3].type).toBe('close_approach'); // unmapped defaults
      expect(result.events[3].importance).toBe('high'); // solar_eclipse
    });

    it('filters low-importance when includeMinor is false', async () => {
      (mockEventsApi.getAstroEvents as jest.Mock).mockResolvedValue([
        { id: '1', event_type: 'first_quarter', name: 'First Quarter', description: '', date: '2025-07-01', time: null, timestamp: 1751328000, magnitude: null, visibility: null, details: null },
      ]);

      const result = await tauriAstronomyBackend.searchPhenomena({
        startDate: testDate,
        endDate: new Date('2025-07-15T00:00:00Z'),
        observer,
        includeMinor: false,
      });

      // first_quarter has medium importance, should not be filtered
      expect(result.events).toHaveLength(1);
    });
  });

  // ========================================================================
  // computeAlmanac
  // ========================================================================
  describe('computeAlmanac', () => {
    beforeEach(() => {
      setupTauriAvailable();
      mockAstronomyApi.celestial.getSunPosition.mockResolvedValue({
        ra: 85, dec: 23, altitude: 60, azimuth: 180,
      });
      mockAstronomyApi.celestial.getMoonPosition.mockResolvedValue({
        ra: 120, dec: 18, altitude: 40, azimuth: 200, distance: 384400,
      });
      mockAstronomyApi.celestial.getMoonPhase.mockResolvedValue({
        phase: 0.5, illumination: 100, age: 14.7, phase_name: 'Full Moon', is_waxing: false,
      });
      mockAstronomyApi.visibility.calculateVisibility.mockResolvedValue({
        is_visible: true,
        current_altitude: 40,
        current_azimuth: 200,
        rise_time: testTimestamp - 5000,
        set_time: testTimestamp + 5000,
        transit_time: testTimestamp,
        transit_altitude: 55,
        is_circumpolar: false,
        never_rises: false,
        hours_visible: 10,
      });
      mockCalcTwilight.mockReturnValue({
        astronomicalDawn: new Date('2025-06-15T20:00:00Z'),
        astronomicalDusk: new Date('2025-06-15T16:00:00Z'),
        nauticalDawn: null,
        nauticalDusk: null,
        civilDawn: null,
        civilDusk: null,
        sunrise: null,
        sunset: null,
        darknessDuration: 4,
        nightDuration: 4,
        isCurrentlyNight: true,
        currentTwilightPhase: 'night',
      });
    });

    it('computes almanac with sun and moon data', async () => {
      const result = await tauriAstronomyBackend.computeAlmanac({
        date: testDate,
        observer,
      });

      expect(result.sun.ra).toBeGreaterThanOrEqual(0);
      expect(result.moon.ra).toBeGreaterThanOrEqual(0);
      expect(result.moon.phase).toBe(0.5);
      expect(result.moon.illumination).toBe(100);
      expect(result.meta.backend).toBe('tauri');
    });
  });
});
