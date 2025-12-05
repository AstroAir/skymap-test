/**
 * Tauri API wrapper for Rust astronomy calculations
 * Only available in Tauri desktop environment
 */

import { isTauri } from '@/lib/storage/platform';

// Lazy import to avoid errors in web environment
async function getInvoke() {
  if (!isTauri()) {
    throw new Error('Tauri API is only available in desktop environment');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

// ============================================================================
// Types
// ============================================================================

export interface HorizontalCoords {
  alt: number;
  az: number;
}

export interface EquatorialCoords {
  ra: number;
  dec: number;
}

export interface GalacticCoords {
  l: number;
  b: number;
}

export interface EclipticCoords {
  lon: number;
  lat: number;
}

export interface VisibilityInfo {
  is_visible: boolean;
  current_altitude: number;
  current_azimuth: number;
  rise_time: number | null;
  set_time: number | null;
  transit_time: number | null;
  transit_altitude: number;
  is_circumpolar: boolean;
  never_rises: boolean;
  hours_visible: number;
}

export interface TwilightTimes {
  date: string;
  sunrise: number | null;
  sunset: number | null;
  civil_dawn: number | null;
  civil_dusk: number | null;
  nautical_dawn: number | null;
  nautical_dusk: number | null;
  astronomical_dawn: number | null;
  astronomical_dusk: number | null;
  solar_noon: number | null;
  is_polar_day: boolean;
  is_polar_night: boolean;
}

export interface MoonPhase {
  phase: number;
  illumination: number;
  age: number;
  phase_name: string;
  is_waxing: boolean;
}

export interface MoonPosition {
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  distance: number;
}

export interface SunPosition {
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
}

export interface FOVResult {
  width_deg: number;
  height_deg: number;
  width_arcmin: number;
  height_arcmin: number;
  image_scale: number;
  f_ratio: number;
}

export interface MosaicCoverage {
  total_width_deg: number;
  total_height_deg: number;
  total_panels: number;
  panel_width_deg: number;
  panel_height_deg: number;
}

// ============================================================================
// Coordinate Conversion API
// ============================================================================

export const coordinateApi = {
  async equatorialToHorizontal(
    ra: number,
    dec: number,
    latitude: number,
    longitude: number,
    timestamp?: number
  ): Promise<HorizontalCoords> {
    const invoke = await getInvoke();
    return invoke('equatorial_to_horizontal', { ra, dec, latitude, longitude, timestamp });
  },

  async horizontalToEquatorial(
    alt: number,
    az: number,
    latitude: number,
    longitude: number,
    timestamp?: number
  ): Promise<EquatorialCoords> {
    const invoke = await getInvoke();
    return invoke('horizontal_to_equatorial', { alt, az, latitude, longitude, timestamp });
  },

  async equatorialToGalactic(ra: number, dec: number): Promise<GalacticCoords> {
    const invoke = await getInvoke();
    return invoke('equatorial_to_galactic', { ra, dec });
  },

  async galacticToEquatorial(l: number, b: number): Promise<EquatorialCoords> {
    const invoke = await getInvoke();
    return invoke('galactic_to_equatorial', { l, b });
  },

  async equatorialToEcliptic(ra: number, dec: number, timestamp?: number): Promise<EclipticCoords> {
    const invoke = await getInvoke();
    return invoke('equatorial_to_ecliptic', { ra, dec, timestamp });
  },

  async eclipticToEquatorial(lon: number, lat: number, timestamp?: number): Promise<EquatorialCoords> {
    const invoke = await getInvoke();
    return invoke('ecliptic_to_equatorial', { lon, lat, timestamp });
  },

  async angularSeparation(ra1: number, dec1: number, ra2: number, dec2: number): Promise<number> {
    const invoke = await getInvoke();
    return invoke('angular_separation', { ra1, dec1, ra2, dec2 });
  },
};

// ============================================================================
// Visibility API
// ============================================================================

export const visibilityApi = {
  async calculateVisibility(
    ra: number,
    dec: number,
    latitude: number,
    longitude: number,
    timestamp?: number,
    minAltitude?: number
  ): Promise<VisibilityInfo> {
    const invoke = await getInvoke();
    return invoke('calculate_visibility', { 
      ra, dec, latitude, longitude, timestamp, 
      minAltitude: minAltitude ?? 0 
    });
  },

  async calculateTwilight(
    date: string,
    latitude: number,
    longitude: number
  ): Promise<TwilightTimes> {
    const invoke = await getInvoke();
    return invoke('calculate_twilight', { date, latitude, longitude });
  },
};

// ============================================================================
// Celestial Bodies API
// ============================================================================

export const celestialApi = {
  async getMoonPhase(timestamp?: number): Promise<MoonPhase> {
    const invoke = await getInvoke();
    return invoke('calculate_moon_phase', { timestamp });
  },

  async getMoonPosition(
    latitude: number,
    longitude: number,
    timestamp?: number
  ): Promise<MoonPosition> {
    const invoke = await getInvoke();
    return invoke('calculate_moon_position', { latitude, longitude, timestamp });
  },

  async getSunPosition(
    latitude: number,
    longitude: number,
    timestamp?: number
  ): Promise<SunPosition> {
    const invoke = await getInvoke();
    return invoke('calculate_sun_position', { latitude, longitude, timestamp });
  },
};

// ============================================================================
// Imaging API
// ============================================================================

export const imagingApi = {
  async calculateFOV(
    sensorWidth: number,
    sensorHeight: number,
    focalLength: number,
    pixelSize: number,
    aperture: number
  ): Promise<FOVResult> {
    const invoke = await getInvoke();
    return invoke('calculate_fov', { 
      sensorWidth, sensorHeight, focalLength, pixelSize, aperture 
    });
  },

  async calculateMosaicCoverage(
    sensorWidth: number,
    sensorHeight: number,
    focalLength: number,
    rows: number,
    cols: number,
    overlapPercent: number
  ): Promise<MosaicCoverage> {
    const invoke = await getInvoke();
    return invoke('calculate_mosaic_coverage', { 
      sensorWidth, sensorHeight, focalLength, rows, cols, overlapPercent 
    });
  },
};

// ============================================================================
// Formatting API
// ============================================================================

export const formatApi = {
  async formatRaHms(raDeg: number): Promise<string> {
    const invoke = await getInvoke();
    return invoke('format_ra_hms', { raDeg });
  },

  async formatDecDms(decDeg: number): Promise<string> {
    const invoke = await getInvoke();
    return invoke('format_dec_dms', { decDeg });
  },

  async parseRaHms(raStr: string): Promise<number> {
    const invoke = await getInvoke();
    return invoke('parse_ra_hms', { raStr });
  },

  async parseDecDms(decStr: string): Promise<number> {
    const invoke = await getInvoke();
    return invoke('parse_dec_dms', { decStr });
  },
};

// ============================================================================
// Unified API
// ============================================================================

export const astronomyApi = {
  coordinates: coordinateApi,
  visibility: visibilityApi,
  celestial: celestialApi,
  imaging: imagingApi,
  format: formatApi,
  isAvailable: isTauri,
};

export default astronomyApi;
