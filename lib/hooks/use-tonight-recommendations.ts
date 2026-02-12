'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStellariumStore } from '@/lib/stores';
import type { SearchResultItem, I18nMessage } from '@/lib/core/types';
import {
  neverRises,
  isCircumpolar,
  calculateImagingHours,
} from '@/lib/astronomy/astro-utils';
import {
  calculateNighttimeData,
  calculateAltitudeData,
  calculateMoonDistance,
  enrichDeepSkyObject,
  DSO_CATALOG,
  MOON_PHASE_NAMES,
  // Advanced scoring algorithms
  calculateAirmass,
  getAirmassQuality,
  calculateMeridianProximity,
  transitDuringDarkHours,
  calculateMoonImpact,
  calculateSeasonalScore,
  calculateComprehensiveImagingScore,
  EXTENDED_SEASONAL_DATA,
  type DeepSkyObject,
  type NighttimeData,
  type ImagingScoreResult,
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
  reasons: I18nMessage[];
  warnings: I18nMessage[];
  dsoData?: DeepSkyObject;
  // Enhanced scoring data
  airmass?: number;
  airmassQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  scoreBreakdown?: ImagingScoreResult['breakdown'];
  qualityRating?: ImagingScoreResult['quality'];
  seasonalOptimal?: boolean;
  transitDuringDark?: boolean;
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
// Using Extended Seasonal Data from scoring-algorithms.ts
// The EXTENDED_SEASONAL_DATA provides comprehensive information including:
// - bestMonths: optimal imaging months
// - optimalAltitude: recommended minimum altitude
// - requiresDarkSky: whether dark skies are needed
// - difficulty: beginner/intermediate/advanced/expert
// - recommendedExposure: suggested exposure times
// ============================================================================

// ============================================================================
// Utility Functions
// ============================================================================

// neverRises, isCircumpolar, calculateImagingHours imported from @/lib/astronomy/astro-utils

// ============================================================================
// Main Hook
// ============================================================================

export function useTonightRecommendations() {
  const stel = useStellariumStore((state) => state.stel);
  const [recommendations, setRecommendations] = useState<RecommendedTarget[]>([]);
  const [conditions, setConditions] = useState<TonightConditions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [planDate, setPlanDate] = useState<Date>(new Date());

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
  const calculateConditions = useCallback((date?: Date): TonightConditions => {
    const { latitude, longitude } = getObserverLocation();
    const now = date ?? planDate;

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
  }, [getObserverLocation, planDate]);

  // Calculate recommendations using Sky Atlas catalog with advanced scoring algorithms
  const calculateRecommendations = useCallback(() => {
    setIsLoading(true);

    const cond = calculateConditions();
    setConditions(cond);

    const { latitude, longitude, darkHoursStart, darkHoursEnd, moonIllumination } = cond;
    const refDate = planDate;
    const currentMonth = refDate.getMonth() + 1;
    const referenceDate = cond.nighttimeData?.referenceDate || refDate;

    const scored: RecommendedTarget[] = [];

    // Use DSO_CATALOG from Sky Atlas
    for (const dso of DSO_CATALOG) {
      // Skip targets that never rise
      if (neverRises(dso.dec, latitude)) {
        continue;
      }

      const reasons: I18nMessage[] = [];
      const warnings: I18nMessage[] = [];

      // Enrich DSO with calculated data
      const enrichedDso = enrichDeepSkyObject(dso, latitude, longitude, referenceDate);
      const altitudeData = calculateAltitudeData(dso.ra, dso.dec, latitude, longitude, referenceDate);

      const maxAlt = altitudeData.maxAltitude;
      const isCircumpolarTarget = isCircumpolar(dso.dec, latitude);
      const moonDistance = enrichedDso.moonDistance ?? calculateMoonDistance(dso.ra, dso.dec, referenceDate);

      // Calculate imaging hours during dark time
      const imagingHours = calculateImagingHours(altitudeData, 25, darkHoursStart, darkHoursEnd);

      // Skip if not enough imaging time (unless circumpolar)
      if (imagingHours < 1 && !isCircumpolarTarget) {
        continue;
      }

      // ========================================================================
      // Use Industry-Standard Comprehensive Scoring Algorithm
      // ========================================================================
      
      // Calculate airmass at maximum altitude (industry standard metric)
      const airmass = calculateAirmass(maxAlt);
      const airmassQuality = getAirmassQuality(airmass);
      
      // Calculate meridian transit proximity
      const transitProximity = calculateMeridianProximity(
        altitudeData.transitTime,
        referenceDate,
        6 // 6-hour window
      );
      
      // Check if transit occurs during dark hours
      const transitsDuringDark = transitDuringDarkHours(
        altitudeData.transitTime,
        darkHoursStart,
        darkHoursEnd
      );
      
      // Calculate moon impact score
      const moonImpact = calculateMoonImpact(moonDistance, moonIllumination);
      
      // Calculate seasonal score using extended data
      const seasonalScore = calculateSeasonalScore(dso.id, currentMonth);
      const seasonal = EXTENDED_SEASONAL_DATA[dso.id];
      const isSeasonalOptimal = seasonalScore >= 0.8;
      
      // Use comprehensive imaging score calculator
      const comprehensiveScore = calculateComprehensiveImagingScore({
        altitude: maxAlt,
        airmass,
        moonDistance,
        moonIllumination,
        magnitude: dso.magnitude,
        surfaceBrightness: dso.surfaceBrightness,
        sizeArcmin: dso.sizeMax,
        transitProximity,
        seasonalScore,
        darkSkyRequired: seasonal?.requiresDarkSky,
        bortleClass: 5, // Default suburban sky, could be made configurable
      });
      
      // ========================================================================
      // Generate I18n Reasons and Warnings
      // ========================================================================
      
      // Add recommendations from comprehensive score as raw warnings
      for (const r of comprehensiveScore.recommendations) {
        if (r.includes('too low') || r.includes('too high') || r.includes('faint') || 
            r.includes('close') || r.includes('not') || r.includes('needs')) {
          warnings.push({ key: 'tonightRec.compWarning', params: { text: r } });
        }
      }
      
      // Airmass quality
      if (airmassQuality === 'excellent') {
        reasons.push({ key: 'tonightRec.excellentAirmass', params: { value: airmass.toFixed(2) } });
      } else if (airmassQuality === 'good') {
        reasons.push({ key: 'tonightRec.goodAirmass', params: { value: airmass.toFixed(2) } });
      } else if (airmassQuality === 'poor' || airmassQuality === 'bad') {
        warnings.push({ key: 'tonightRec.highAirmass', params: { value: airmass.toFixed(2) } });
      }
      
      // Seasonal information
      if (isSeasonalOptimal) {
        reasons.push({ key: 'tonightRec.bestSeason' });
      } else if (seasonalScore < 0.3) {
        warnings.push({ key: 'tonightRec.notOptimalSeason' });
      }
      
      // Transit timing
      if (transitsDuringDark) {
        reasons.push({ key: 'tonightRec.transitDuringDark' });
      }
      
      // Moon impact
      if (moonImpact >= 0.9) {
        if (moonIllumination < 25) {
          reasons.push({ key: 'tonightRec.darkMoon' });
        } else {
          reasons.push({ key: 'tonightRec.farFromMoon' });
        }
      } else if (moonImpact < 0.5) {
        warnings.push({ key: 'tonightRec.moonInterference' });
      }
      
      // Imaging window
      const effectiveHours = isCircumpolarTarget ? cond.totalDarkHours : imagingHours;
      if (effectiveHours > 5) {
        reasons.push({ key: 'tonightRec.longWindow', params: { hours: effectiveHours.toFixed(1) } });
      } else if (effectiveHours < 2) {
        warnings.push({ key: 'tonightRec.limitedTime' });
      }
      
      // Circumpolar
      if (isCircumpolarTarget) {
        reasons.push({ key: 'tonightRec.circumpolar' });
      }
      
      // Difficulty and equipment recommendations
      if (seasonal?.difficulty === 'beginner') {
        reasons.push({ key: 'tonightRec.beginnerFriendly' });
      } else if (seasonal?.difficulty === 'advanced' || seasonal?.difficulty === 'expert') {
        warnings.push({ key: 'tonightRec.challenging' });
      }
      
      // Size recommendations
      const size = dso.sizeMax ?? dso.sizeMin;
      if (size && size > 60) {
        reasons.push({ key: 'tonightRec.largeTarget' });
      } else if (size && size < 3) {
        warnings.push({ key: 'tonightRec.smallTarget' });
      }
      
      // Surface brightness
      if (dso.surfaceBrightness) {
        if (dso.surfaceBrightness < 20) {
          reasons.push({ key: 'tonightRec.highSB' });
        } else if (dso.surfaceBrightness > 24) {
          warnings.push({ key: 'tonightRec.lowSB' });
        }
      }
      
      // Magnitude
      if (dso.magnitude !== undefined) {
        if (dso.magnitude < 6) {
          reasons.push({ key: 'tonightRec.veryBright' });
        } else if (dso.magnitude > 12) {
          warnings.push({ key: 'tonightRec.faint' });
        }
      }
      
      // ========================================================================
      // Calculate Final Score
      // ========================================================================
      
      // Base score from comprehensive algorithm (0-100)
      let finalScore = comprehensiveScore.totalScore;
      
      // Bonus adjustments
      if (isCircumpolarTarget) finalScore += 3;
      if (transitsDuringDark) finalScore += 5;
      if (effectiveHours > 4) finalScore += 5;
      
      // Difficulty bonus for easier targets (beginner-friendly)
      if (seasonal?.difficulty === 'beginner') finalScore += 5;
      else if (seasonal?.difficulty === 'intermediate') finalScore += 2;
      
      // Object type bonus (popular categories)
      const objType = (dso.type || '').toLowerCase();
      if (objType.includes('nebula') || objType.includes('emission')) {
        finalScore += 3; // Nebulae are photogenic
      } else if (objType.includes('galaxy') && (dso.magnitude ?? 99) < 10) {
        finalScore += 3; // Bright galaxies
      }

      // Get common name from alternate names
      const commonName = dso.alternateNames?.[0] || dso.name;

      scored.push({
        Name: dso.name,
        Type: 'DSO',
        RA: dso.ra,
        Dec: dso.dec,
        'Common names': commonName,
        score: Math.max(0, Math.min(100, Math.round(finalScore))),
        maxAltitude: maxAlt,
        transitTime: altitudeData.transitTime,
        riseTime: altitudeData.riseTime,
        setTime: altitudeData.setTime,
        moonDistance,
        imagingHours: effectiveHours,
        reasons: reasons.slice(0, 4), // Limit to top 4 reasons
        warnings: warnings.slice(0, 3), // Limit to top 3 warnings
        dsoData: enrichedDso,
        // Enhanced scoring data
        airmass,
        airmassQuality,
        scoreBreakdown: comprehensiveScore.breakdown,
        qualityRating: comprehensiveScore.quality,
        seasonalOptimal: isSeasonalOptimal,
        transitDuringDark: transitsDuringDark,
      });
    }

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Take top 25 for better selection
    setRecommendations(scored.slice(0, 25));
    setIsLoading(false);
  }, [calculateConditions, planDate]);

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
    planDate,
    setPlanDate,
  };
}

