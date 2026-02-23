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
import { transformCoordinate } from '@/lib/astronomy/pipeline';
import { buildTimeScaleContext } from '@/lib/astronomy/time-scales';
import type { SelectedObjectData } from '@/lib/core/types';
import type { TargetVisibility, ImagingFeasibility, TwilightTimes } from '@/lib/core/types';
import type { AstronomicalFrame, CoordinateQualityFlag, EopFreshness, TimeScale } from '@/lib/core/types';

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
  lstSource: 'UT1' | 'UTC';
  lstTimeScale: TimeScale;
  dataFreshness: EopFreshness;
  qualityFlag: CoordinateQualityFlag;
  epochJd: number;
  twilight: TwilightTimes;
}

/** Target-specific computed astronomical data */
export interface TargetAstroData {
  altitude: number;
  azimuth: number;
  moonDistance: number;
  visibility: TargetVisibility;
  feasibility: ImagingFeasibility;
  frame: AstronomicalFrame;
  timeScale: TimeScale;
  qualityFlag: CoordinateQualityFlag;
  dataFreshness: EopFreshness;
  epochJd: number;
  updatedAt: string;
  riskHints: string[];
}

export type ObjectAstroDataV2 = TargetAstroData;

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
    const context = buildTimeScaleContext(currentTime);
    const jd = getJulianDateFromDate(currentTime);
    const moonPhase = getMoonPhase(jd);
    const moonPhaseName = getMoonPhaseName(moonPhase);
    const moonIllumination = getMoonIllumination(moonPhase);
    const moonPos = getMoonPosition(jd);
    const sunPos = getSunPosition(jd);

    const moonAltAz = raDecToAltAz(moonPos.ra, moonPos.dec, latitude, longitude);
    const sunAltAz = raDecToAltAz(sunPos.ra, sunPos.dec, latitude, longitude);

    const lst = transformCoordinate(
      { raDeg: moonPos.ra, decDeg: moonPos.dec },
      { latitude, longitude, date: currentTime, fromFrame: 'ICRF', toFrame: 'OBSERVED' }
    ).lstDeg;
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
      lstSource: context.eop.freshness === 'fallback' ? 'UTC' : 'UT1',
      lstTimeScale: context.eop.freshness === 'fallback' ? 'UTC' : 'UT1',
      dataFreshness: context.eop.freshness,
      qualityFlag: context.eop.freshness === 'fallback' ? 'fallback' : 'precise',
      epochJd: context.jdUtc,
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

    const transformed = transformCoordinate(
      { raDeg: ra, decDeg: dec },
      { latitude, longitude, date: currentTime, fromFrame: 'ICRF', toFrame: 'OBSERVED' }
    );
    const altAz = {
      altitude: transformed.altitudeDeg,
      azimuth: transformed.azimuthDeg,
    };
    const moonDistance = angularSeparation(ra, dec, moonRa, moonDec);
    const visibility = calculateTargetVisibility(ra, dec, latitude, longitude, 30, currentTime);
    const feasibility = calculateImagingFeasibility(ra, dec, latitude, longitude, 30, currentTime);

    const riskHints: string[] = [];
    if (visibility.neverRises) riskHints.push('never-rises');
    if (moonDistance < 25) riskHints.push('moon-interference');
    if (feasibility.score < 45) riskHints.push('low-feasibility');

    return {
      altitude: altAz.altitude,
      azimuth: altAz.azimuth,
      moonDistance,
      visibility,
      feasibility,
      frame: transformed.metadata.frame,
      timeScale: transformed.metadata.timeScale,
      qualityFlag: transformed.metadata.qualityFlag,
      dataFreshness: transformed.metadata.dataFreshness,
      epochJd: transformed.metadata.epochJd,
      updatedAt: transformed.metadata.generatedAt,
      riskHints,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject, latitude, longitude, moonRa, moonDec, Math.floor(currentTime.getTime() / 1000)]);
}
