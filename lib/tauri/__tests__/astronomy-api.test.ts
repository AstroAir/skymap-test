/**
 * @jest-environment jsdom
 */

// Mock isTauri
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => true),
}));

// Mock @tauri-apps/api/core
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import { isTauri } from '@/lib/storage/platform';
import {
  coordinateApi,
  visibilityApi,
  celestialApi,
  imagingApi,
  formatApi,
  astronomyApi,
} from '../astronomy-api';

const mockIsTauri = isTauri as jest.Mock;

describe('coordinateApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should convert equatorial to horizontal coordinates', async () => {
    const mockResult = { alt: 45.5, az: 120.3 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.equatorialToHorizontal(10.68, 41.27, 45.0, -75.0, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('equatorial_to_horizontal', {
      ra: 10.68,
      dec: 41.27,
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
      applyRefraction: undefined,
    });
    expect(result).toEqual(mockResult);
  });

  it('should pass applyRefraction parameter to equatorial_to_horizontal', async () => {
    const mockResult = { alt: 45.5, az: 120.3 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.equatorialToHorizontal(10.68, 41.27, 45.0, -75.0, 1704067200, false);

    expect(mockInvoke).toHaveBeenCalledWith('equatorial_to_horizontal', {
      ra: 10.68,
      dec: 41.27,
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
      applyRefraction: false,
    });
    expect(result).toEqual(mockResult);
  });

  it('should convert horizontal to equatorial coordinates', async () => {
    const mockResult = { ra: 10.68, dec: 41.27 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.horizontalToEquatorial(45.5, 120.3, 45.0, -75.0, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('horizontal_to_equatorial', {
      alt: 45.5,
      az: 120.3,
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
    });
    expect(result).toEqual(mockResult);
  });

  it('should convert equatorial to galactic coordinates', async () => {
    const mockResult = { l: 121.17, b: -21.57 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.equatorialToGalactic(10.68, 41.27);

    expect(mockInvoke).toHaveBeenCalledWith('equatorial_to_galactic', { ra: 10.68, dec: 41.27 });
    expect(result).toEqual(mockResult);
  });

  it('should convert galactic to equatorial coordinates', async () => {
    const mockResult = { ra: 10.68, dec: 41.27 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.galacticToEquatorial(121.17, -21.57);

    expect(mockInvoke).toHaveBeenCalledWith('galactic_to_equatorial', { l: 121.17, b: -21.57 });
    expect(result).toEqual(mockResult);
  });

  it('should convert equatorial to ecliptic coordinates', async () => {
    const mockResult = { lon: 350.0, lat: 35.0 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.equatorialToEcliptic(10.68, 41.27, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('equatorial_to_ecliptic', {
      ra: 10.68,
      dec: 41.27,
      timestamp: 1704067200,
    });
    expect(result).toEqual(mockResult);
  });

  it('should convert ecliptic to equatorial coordinates', async () => {
    const mockResult = { ra: 10.68, dec: 41.27 };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await coordinateApi.eclipticToEquatorial(350.0, 35.0, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('ecliptic_to_equatorial', {
      lon: 350.0,
      lat: 35.0,
      timestamp: 1704067200,
    });
    expect(result).toEqual(mockResult);
  });

  it('should calculate angular separation', async () => {
    mockInvoke.mockResolvedValue(2.5);

    const result = await coordinateApi.angularSeparation(10.68, 41.27, 12.0, 43.0);

    expect(mockInvoke).toHaveBeenCalledWith('angular_separation', {
      ra1: 10.68,
      dec1: 41.27,
      ra2: 12.0,
      dec2: 43.0,
    });
    expect(result).toBe(2.5);
  });

  it('should throw error when not in Tauri', async () => {
    mockIsTauri.mockReturnValue(false);

    await expect(coordinateApi.equatorialToHorizontal(10, 41, 45, -75)).rejects.toThrow(
      'Tauri API is only available in desktop environment'
    );
  });
});

describe('visibilityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should calculate visibility', async () => {
    const mockResult = {
      is_visible: true,
      current_altitude: 45.0,
      current_azimuth: 120.0,
      rise_time: 1704067200,
      set_time: 1704110400,
      transit_time: 1704088800,
      transit_altitude: 78.0,
      is_circumpolar: false,
      never_rises: false,
      hours_visible: 12.0,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await visibilityApi.calculateVisibility(10.68, 41.27, 45.0, -75.0, 1704067200, 10);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_visibility', {
      ra: 10.68,
      dec: 41.27,
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
      minAltitude: 10,
    });
    expect(result).toEqual(mockResult);
  });

  it('should use default minAltitude when not provided', async () => {
    const mockResult = { is_visible: true, current_altitude: 45.0 };
    mockInvoke.mockResolvedValue(mockResult);

    await visibilityApi.calculateVisibility(10.68, 41.27, 45.0, -75.0);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_visibility', {
      ra: 10.68,
      dec: 41.27,
      latitude: 45.0,
      longitude: -75.0,
      timestamp: undefined,
      minAltitude: 0,
    });
  });

  it('should calculate twilight times', async () => {
    const mockResult = {
      date: '2024-01-01',
      sunrise: 1704110400,
      sunset: 1704153600,
      civil_dawn: 1704108600,
      civil_dusk: 1704155400,
      nautical_dawn: 1704106800,
      nautical_dusk: 1704157200,
      astronomical_dawn: 1704105000,
      astronomical_dusk: 1704159000,
      solar_noon: 1704132000,
      is_polar_day: false,
      is_polar_night: false,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await visibilityApi.calculateTwilight('2024-01-01', 45.0, -75.0);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_twilight', {
      date: '2024-01-01',
      latitude: 45.0,
      longitude: -75.0,
    });
    expect(result).toEqual(mockResult);
  });
});

describe('celestialApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should get moon phase', async () => {
    const mockResult = {
      phase: 0.25,
      illumination: 50.0,
      age: 7.4,
      phase_name: 'First Quarter',
      is_waxing: true,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await celestialApi.getMoonPhase(1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_moon_phase', { timestamp: 1704067200 });
    expect(result).toEqual(mockResult);
  });

  it('should get moon position', async () => {
    const mockResult = {
      ra: 120.5,
      dec: 18.3,
      altitude: 45.0,
      azimuth: 180.0,
      distance: 384400,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await celestialApi.getMoonPosition(45.0, -75.0, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_moon_position', {
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
    });
    expect(result).toEqual(mockResult);
  });

  it('should get sun position', async () => {
    const mockResult = {
      ra: 280.5,
      dec: -23.0,
      altitude: 30.0,
      azimuth: 150.0,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await celestialApi.getSunPosition(45.0, -75.0, 1704067200);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_sun_position', {
      latitude: 45.0,
      longitude: -75.0,
      timestamp: 1704067200,
    });
    expect(result).toEqual(mockResult);
  });
});

describe('imagingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should calculate FOV', async () => {
    const mockResult = {
      width_deg: 2.5,
      height_deg: 1.67,
      width_arcmin: 150,
      height_arcmin: 100,
      image_scale: 1.5,
      f_ratio: 5.0,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await imagingApi.calculateFOV(36, 24, 1000, 4.5, 200);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_fov', {
      sensorWidth: 36,
      sensorHeight: 24,
      focalLength: 1000,
      pixelSize: 4.5,
      aperture: 200,
    });
    expect(result).toEqual(mockResult);
  });

  it('should calculate mosaic coverage', async () => {
    const mockResult = {
      total_width_deg: 7.0,
      total_height_deg: 4.67,
      total_panels: 6,
      panel_width_deg: 2.5,
      panel_height_deg: 1.67,
    };
    mockInvoke.mockResolvedValue(mockResult);

    const result = await imagingApi.calculateMosaicCoverage(36, 24, 1000, 2, 3, 20);

    expect(mockInvoke).toHaveBeenCalledWith('calculate_mosaic_coverage', {
      sensorWidth: 36,
      sensorHeight: 24,
      focalLength: 1000,
      rows: 2,
      cols: 3,
      overlapPercent: 20,
    });
    expect(result).toEqual(mockResult);
  });
});

describe('formatApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
  });

  it('should format RA to HMS', async () => {
    mockInvoke.mockResolvedValue('00h 42m 44s');

    const result = await formatApi.formatRaHms(10.68);

    expect(mockInvoke).toHaveBeenCalledWith('format_ra_hms', { raDeg: 10.68 });
    expect(result).toBe('00h 42m 44s');
  });

  it('should format Dec to DMS', async () => {
    mockInvoke.mockResolvedValue("+41° 16' 09\"");

    const result = await formatApi.formatDecDms(41.27);

    expect(mockInvoke).toHaveBeenCalledWith('format_dec_dms', { decDeg: 41.27 });
    expect(result).toBe("+41° 16' 09\"");
  });

  it('should parse RA from HMS', async () => {
    mockInvoke.mockResolvedValue(10.68);

    const result = await formatApi.parseRaHms('00h 42m 44s');

    expect(mockInvoke).toHaveBeenCalledWith('parse_ra_hms', { raStr: '00h 42m 44s' });
    expect(result).toBe(10.68);
  });

  it('should parse Dec from DMS', async () => {
    mockInvoke.mockResolvedValue(41.27);

    const result = await formatApi.parseDecDms("+41° 16' 09\"");

    expect(mockInvoke).toHaveBeenCalledWith('parse_dec_dms', { decStr: "+41° 16' 09\"" });
    expect(result).toBe(41.27);
  });
});

describe('astronomyApi', () => {
  it('should have all API modules', () => {
    expect(astronomyApi.coordinates).toBeDefined();
    expect(astronomyApi.visibility).toBeDefined();
    expect(astronomyApi.celestial).toBeDefined();
    expect(astronomyApi.imaging).toBeDefined();
    expect(astronomyApi.format).toBeDefined();
  });

  it('should have isAvailable function', () => {
    expect(astronomyApi.isAvailable).toBeDefined();
    expect(typeof astronomyApi.isAvailable).toBe('function');
  });
});
