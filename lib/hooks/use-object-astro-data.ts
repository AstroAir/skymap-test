/**
 * Shared hook for computing astronomical data of a selected celestial object
 * Extracts duplicated logic from InfoPanel and ObjectDetailDrawer
 */

import { useMemo } from 'react';
import { raDecToAltAz, degreesToHMS } from '@/lib/astronomy/starmap-utils';
import {
  getMoonPhase,
  getMoonPhaseName,
  getMoonIllumination,
  getMoonPosition,
  getSunPosition,
  getJulianDateFromDate,
  angularSeparation,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  calculateTwilightTimes,
} from '@/lib/astronomy/astro-utils';
import type { SelectedObjectData } from '@/lib/core/types';
import type { TargetVisibility, ImagingFeasibility, TwilightTimes } from '@/lib/core/types';

// ============================================================================
// Types
// ============================================================================

/** Environmental astronomical data (moon, sun, LST, twilight) */
export interface AstroEnvironmentData {
  moonPhaseName: string;
  moonIllumination: number;
  moonAltitude: number;
  moonRa: number;
  moonDec: number;
  sunAltitude: number;
  lstString: string;
  twilight: TwilightTimes;
}

/** Target-specific computed astronomical data */
export interface TargetAstroData {
  altitude: number;
  azimuth: number;
  moonDistance: number;
  visibility: TargetVisibility;
  feasibility: ImagingFeasibility;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Compute environmental astronomical data (moon phase, sun position, LST, twilight)
 * Independent of any specific target object.
 */
export function useAstroEnvironment(
  latitude: number,
  longitude: number,
  currentTime: Date,
): AstroEnvironmentData {
  return useMemo(() => {
    const jd = getJulianDateFromDate(currentTime);
    const moonPhase = getMoonPhase(jd);
    const moonPhaseName = getMoonPhaseName(moonPhase);
    const moonIllumination = getMoonIllumination(moonPhase);
    const moonPos = getMoonPosition(jd);
    const sunPos = getSunPosition(jd);

    const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, latitude, longitude);
    const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);

    // Compute LST for the given time
    const S = jd - 2451545.0;
    const T = S / 36525.0;
    const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
    const lst = ((GST + longitude) % 360 + 360) % 360;
    const lstString = degreesToHMS(lst);

    const twilight = calculateTwilightTimes(latitude, longitude, currentTime);

    return {
      moonPhaseName,
      moonIllumination,
      moonAltitude: moonAltAz.altitude,
      moonRa: moonPos.ra,
      moonDec: moonPos.dec,
      sunAltitude: sunAltAz.altitude,
      lstString,
      twilight,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, Math.floor(currentTime.getTime() / 1000)]);
}

/**
 * Compute target-specific astronomical data (altitude, azimuth, moon distance,
 * visibility window, imaging feasibility).
 *
 * @param selectedObject - The currently selected celestial object (or null)
 * @param latitude - Observer latitude in degrees
 * @param longitude - Observer longitude in degrees
 * @param moonRa - Current moon RA (from useAstroEnvironment)
 * @param moonDec - Current moon Dec (from useAstroEnvironment)
 * @param currentTime - Current Date used as cache-buster for periodic refresh
 */
export function useTargetAstroData(
  selectedObject: SelectedObjectData | null,
  latitude: number,
  longitude: number,
  moonRa: number,
  moonDec: number,
  currentTime: Date,
): TargetAstroData | null {
  return useMemo(() => {
    if (!selectedObject) return null;

    const ra = selectedObject.raDeg;
    const dec = selectedObject.decDeg;

    const altAz = raDecToAltAz(ra, dec, latitude, longitude);
    const moonDistance = angularSeparation(ra, dec, moonRa, moonDec);
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30);
    const feasibility = calculateImagingFeasibility(ra, dec, latitude, longitude);

    return {
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      moonDistance,
      visibility,
      feasibility,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject, latitude, longitude, moonRa, moonDec, Math.floor(currentTime.getTime() / 1000)]);
}
