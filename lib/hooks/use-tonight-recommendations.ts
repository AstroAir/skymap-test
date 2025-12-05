'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStellariumStore } from '@/lib/stores';
import type { SearchResultItem } from '@/lib/core/types';
import {
  calculateNighttimeData,
  calculateAltitudeData,
  calculateMoonDistance,
  enrichDeepSkyObject,
  DSO_CATALOG,
  MOON_PHASE_NAMES,
  type DeepSkyObject,
  type NighttimeData,
} from '@/lib/catalogs';

// ============================================================================
// Types
// ============================================================================

export interface RecommendedTarget extends SearchResultItem {
  score: number;
  maxAltitude: number;
  transitTime: Date | null;
  riseTime: Date | null;
  setTime: Date | null;
  moonDistance: number;
  imagingHours: number;
  reasons: string[];
  warnings: string[];
  dsoData?: DeepSkyObject;
}

export interface TwilightInfo {
  sunset: Date | null;
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  astronomicalDusk: Date | null;
  astronomicalDawn: Date | null;
  nauticalDawn: Date | null;
  civilDawn: Date | null;
  sunrise: Date | null;
}

export interface TonightConditions {
  moonPhase: number;
  moonIllumination: number;
  moonPhaseName: string;
  darkHoursStart: Date | null;
  darkHoursEnd: Date | null;
  totalDarkHours: number;
  latitude: number;
  longitude: number;
  twilight: TwilightInfo;
  currentTime: Date;
  nighttimeData?: NighttimeData;
}

// ============================================================================
// Seasonal Best Months (for enhanced scoring)
// ============================================================================

interface SeasonalInfo {
  bestMonths: number[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const SEASONAL_DATA: Record<string, SeasonalInfo> = {
  'M31': { bestMonths: [9, 10, 11, 12, 1], difficulty: 'easy' },
  'M33': { bestMonths: [10, 11, 12, 1], difficulty: 'medium' },
  'M42': { bestMonths: [11, 12, 1, 2, 3], difficulty: 'easy' },
  'M45': { bestMonths: [10, 11, 12, 1, 2], difficulty: 'easy' },
  'M1': { bestMonths: [11, 12, 1, 2], difficulty: 'easy' },
  'M51': { bestMonths: [3, 4, 5, 6], difficulty: 'medium' },
  'M81': { bestMonths: [2, 3, 4, 5], difficulty: 'easy' },
  'M82': { bestMonths: [2, 3, 4, 5], difficulty: 'easy' },
  'M101': { bestMonths: [3, 4, 5, 6], difficulty: 'medium' },
  'NGC7000': { bestMonths: [7, 8, 9, 10], difficulty: 'medium' },
  'NGC6992': { bestMonths: [7, 8, 9, 10], difficulty: 'medium' },
  'NGC6960': { bestMonths: [7, 8, 9, 10], difficulty: 'medium' },
  'M8': { bestMonths: [6, 7, 8], difficulty: 'easy' },
  'M13': { bestMonths: [5, 6, 7, 8], difficulty: 'easy' },
  'M57': { bestMonths: [6, 7, 8, 9], difficulty: 'easy' },
  'M27': { bestMonths: [7, 8, 9, 10], difficulty: 'easy' },
};

// ============================================================================
// Utility Functions
// ============================================================================

// Memoized visibility check functions
const neverRisesCache = new Map<string, boolean>();
const circumpolarCache = new Map<string, boolean>();

function neverRises(dec: number, latitude: number): boolean {
  const key = `${dec.toFixed(2)}_${latitude.toFixed(2)}`;
  if (neverRisesCache.has(key)) return neverRisesCache.get(key)!;
  
  const result = latitude >= 0 ? dec < -(90 - latitude) : dec > (90 + latitude);
  neverRisesCache.set(key, result);
  return result;
}

function isCircumpolar(dec: number, latitude: number): boolean {
  const key = `${dec.toFixed(2)}_${latitude.toFixed(2)}`;
  if (circumpolarCache.has(key)) return circumpolarCache.get(key)!;
  
  const result = Math.abs(dec) > (90 - Math.abs(latitude));
  circumpolarCache.set(key, result);
  return result;
}

function calculateImagingHours(
  altitudeData: { points: Array<{ altitude: number; time: Date }> },
  minAltitude: number,
  darkStart: Date | null,
  darkEnd: Date | null
): number {
  if (!darkStart || !darkEnd) return 0;

  const darkStartMs = darkStart.getTime();
  const darkEndMs = darkEnd.getTime();

  let totalHours = 0;
  const intervalHours = 0.1; // 6 minutes

  for (const point of altitudeData.points) {
    const timeMs = point.time.getTime();
    if (timeMs >= darkStartMs && timeMs <= darkEndMs && point.altitude >= minAltitude) {
      totalHours += intervalHours;
    }
  }

  return totalHours;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useTonightRecommendations() {
  const stel = useStellariumStore((state) => state.stel);
  const [recommendations, setRecommendations] = useState<RecommendedTarget[]>([]);
  const [conditions, setConditions] = useState<TonightConditions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get observer location from Stellarium or default
  const getObserverLocation = useCallback(() => {
    if (stel?.core?.observer) {
      try {
        const obs = stel.core.observer;
        return {
          latitude: obs.latitude ?? 40,
          longitude: obs.longitude ?? -74,
        };
      } catch {
        // Fallback
      }
    }
    return { latitude: 40, longitude: -74 };
  }, [stel]);

  // Calculate tonight's conditions using Sky Atlas
  const calculateConditions = useCallback((): TonightConditions => {
    const { latitude, longitude } = getObserverLocation();
    const now = new Date();

    // Use Sky Atlas nighttime calculator
    const nighttimeData = calculateNighttimeData(latitude, longitude, now);

    const twilight: TwilightInfo = {
      sunset: nighttimeData.sunRiseAndSet.set,
      civilDusk: nighttimeData.civilTwilightRiseAndSet.set,
      nauticalDusk: nighttimeData.nauticalTwilightRiseAndSet.set,
      astronomicalDusk: nighttimeData.twilightRiseAndSet.set,
      astronomicalDawn: nighttimeData.twilightRiseAndSet.rise,
      nauticalDawn: nighttimeData.nauticalTwilightRiseAndSet.rise,
      civilDawn: nighttimeData.civilTwilightRiseAndSet.rise,
      sunrise: nighttimeData.sunRiseAndSet.rise,
    };

    const darkStart = nighttimeData.twilightRiseAndSet.set;
    const darkEnd = nighttimeData.twilightRiseAndSet.rise;

    const totalDarkHours = darkStart && darkEnd
      ? (darkEnd.getTime() - darkStart.getTime()) / (1000 * 60 * 60)
      : 0;

    return {
      moonPhase: nighttimeData.moonPhaseValue,
      moonIllumination: nighttimeData.moonIllumination,
      moonPhaseName: MOON_PHASE_NAMES[nighttimeData.moonPhase],
      darkHoursStart: darkStart,
      darkHoursEnd: darkEnd,
      totalDarkHours: Math.max(0, totalDarkHours),
      latitude,
      longitude,
      twilight,
      currentTime: now,
      nighttimeData,
    };
  }, [getObserverLocation]);

  // Calculate recommendations using Sky Atlas catalog
  const calculateRecommendations = useCallback(() => {
    setIsLoading(true);

    const cond = calculateConditions();
    setConditions(cond);

    const { latitude, longitude, darkHoursStart, darkHoursEnd, moonIllumination } = cond;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const referenceDate = cond.nighttimeData?.referenceDate || now;

    const scored: RecommendedTarget[] = [];

    // Use DSO_CATALOG from Sky Atlas
    for (const dso of DSO_CATALOG) {
      // Skip targets that never rise
      if (neverRises(dso.dec, latitude)) {
        continue;
      }

      const reasons: string[] = [];
      const warnings: string[] = [];
      let score = 50;

      // Enrich DSO with calculated data
      const enrichedDso = enrichDeepSkyObject(dso, latitude, longitude, referenceDate);
      const altitudeData = calculateAltitudeData(dso.ra, dso.dec, latitude, longitude, referenceDate);

      const maxAlt = altitudeData.maxAltitude;
      const isCircumpolarTarget = isCircumpolar(dso.dec, latitude);
      const moonDistance = enrichedDso.moonDistance ?? calculateMoonDistance(dso.ra, dso.dec, referenceDate);

      // Calculate imaging hours during dark time
      const imagingHours = calculateImagingHours(altitudeData, 25, darkHoursStart, darkHoursEnd);

      // Skip if not enough imaging time
      if (imagingHours < 1 && !isCircumpolarTarget) {
        continue;
      }

      // Get seasonal info if available
      const seasonal = SEASONAL_DATA[dso.id];

      // 1. Seasonal bonus
      if (seasonal?.bestMonths.includes(currentMonth)) {
        score += 20;
        reasons.push('Best season for this target');
      } else if (seasonal) {
        const nearBest = seasonal.bestMonths.some((m: number) =>
          Math.abs(m - currentMonth) <= 1 || Math.abs(m - currentMonth) >= 11
        );
        if (nearBest) score += 10;
      }

      // 2. Altitude score
      if (maxAlt > 70) {
        score += 15;
        reasons.push('Excellent altitude');
      } else if (maxAlt > 50) {
        score += 10;
        reasons.push('Good altitude');
      } else if (maxAlt > 30) {
        score += 5;
      } else {
        score -= 10;
        warnings.push('Low maximum altitude');
      }

      // 3. Moon distance score
      if (moonIllumination > 50) {
        if (moonDistance > 90) {
          score += 15;
          reasons.push('Far from moon');
        } else if (moonDistance > 60) {
          score += 5;
        } else if (moonDistance < 30) {
          score -= 15;
          warnings.push('Close to bright moon');
        }
      } else {
        score += 5;
        if (moonIllumination < 25) {
          reasons.push('Dark moon phase');
        }
      }

      // 4. Imaging duration score
      if (imagingHours > 6) {
        score += 15;
        reasons.push(`${imagingHours.toFixed(1)}h imaging window`);
      } else if (imagingHours > 4) {
        score += 10;
        reasons.push(`${imagingHours.toFixed(1)}h imaging window`);
      } else if (imagingHours > 2) {
        score += 5;
      } else if (!isCircumpolarTarget) {
        score -= 5;
        warnings.push('Limited imaging time');
      }

      // 5. Circumpolar bonus
      if (isCircumpolarTarget) {
        score += 5;
        reasons.push('Circumpolar - always visible');
      }

      // 6. Difficulty adjustment
      if (seasonal?.difficulty === 'easy') {
        score += 5;
      } else if (seasonal?.difficulty === 'hard') {
        score -= 5;
      }

      // 7. Apparent size bonus (larger objects are easier to image)
      const size = dso.sizeMax ?? dso.sizeMin;
      if (size) {
        if (size > 60) {
          score += 10;
          reasons.push('Large target - easy framing');
        } else if (size > 20) {
          score += 5;
        } else if (size < 3) {
          score -= 5;
          warnings.push('Very small - requires long focal length');
        }
      }

      // 8. Surface brightness bonus (brighter is better for short exposures)
      if (dso.surfaceBrightness) {
        if (dso.surfaceBrightness < 20) {
          score += 10;
          reasons.push('High surface brightness');
        } else if (dso.surfaceBrightness < 22) {
          score += 5;
        } else if (dso.surfaceBrightness > 24) {
          score -= 5;
          warnings.push('Low surface brightness - needs dark skies');
        }
      }

      // 9. Object type preference (popular categories)
      const objType = (dso.type || '').toLowerCase();
      if (objType.includes('nebula') || objType.includes('emission')) {
        score += 5; // Nebulae are photogenic
      } else if (objType.includes('galaxy') && (dso.magnitude ?? 99) < 10) {
        score += 5; // Bright galaxies
      } else if (objType.includes('cluster')) {
        score += 3; // Clusters are easy targets
      }

      // 10. Magnitude bonus (brighter objects score higher)
      const mag = dso.magnitude ?? 99;
      if (mag < 6) {
        score += 10;
        reasons.push('Very bright target');
      } else if (mag < 8) {
        score += 5;
      } else if (mag > 12) {
        score -= 5;
        warnings.push('Faint target - needs longer exposure');
      }

      // 11. Transit timing bonus
      if (darkHoursStart && darkHoursEnd && altitudeData.transitTime) {
        const transitMs = altitudeData.transitTime.getTime();
        const darkStartMs = darkHoursStart.getTime();
        const darkEndMs = darkHoursEnd.getTime();

        if (transitMs >= darkStartMs && transitMs <= darkEndMs) {
          score += 10;
          reasons.push('Transits during dark hours');
        }
      }

      // 8. Imaging score from Sky Atlas
      if (enrichedDso.imagingScore) {
        score += Math.floor(enrichedDso.imagingScore * 0.2);
      }

      // Get common name from alternate names
      const commonName = dso.alternateNames?.[0] || dso.name;

      scored.push({
        Name: dso.name,
        Type: 'DSO',
        RA: dso.ra,
        Dec: dso.dec,
        'Common names': commonName,
        score: Math.max(0, Math.min(100, score)),
        maxAltitude: maxAlt,
        transitTime: altitudeData.transitTime,
        riseTime: altitudeData.riseTime,
        setTime: altitudeData.setTime,
        moonDistance,
        imagingHours: isCircumpolarTarget ? cond.totalDarkHours : imagingHours,
        reasons,
        warnings,
        dsoData: enrichedDso,
      });
    }

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Take top 20
    setRecommendations(scored.slice(0, 20));
    setIsLoading(false);
  }, [calculateConditions]);

  // Auto-calculate on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      setTimeout(() => calculateRecommendations(), 0);
    }
  }, [calculateRecommendations]);

  return {
    recommendations,
    conditions,
    isLoading,
    refresh: calculateRecommendations,
  };
}

