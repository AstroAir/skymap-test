'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStellariumStore } from '@/lib/starmap/stores';
import type { SearchResultItem } from '@/lib/starmap/types';
import {
  getMoonPhase,
  getMoonIllumination,
  getMoonPosition,
  angularSeparation,
  getJulianDateFromDate,
} from '@/lib/starmap/astro-utils';
import { getLST } from '@/lib/starmap/utils';

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
}

export interface TwilightInfo {
  sunset: Date | null;
  civilDusk: Date | null;      // Sun at -6°
  nauticalDusk: Date | null;   // Sun at -12°
  astronomicalDusk: Date | null; // Sun at -18°
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
}

// ============================================================================
// Target Database with seasonal visibility
// ============================================================================

interface TargetData {
  name: string;
  ra: number;
  dec: number;
  commonName: string;
  type: 'galaxy' | 'nebula' | 'cluster' | 'planetary';
  difficulty: 'easy' | 'medium' | 'hard';
  bestMonths: number[]; // 1-12
  minAperture?: number; // mm, for visibility
  magnitude?: number;
}

const TARGET_DATABASE: TargetData[] = [
  // Galaxies
  { name: 'M31', ra: 10.6847, dec: 41.2689, commonName: 'Andromeda Galaxy', type: 'galaxy', difficulty: 'easy', bestMonths: [9, 10, 11, 12, 1], magnitude: 3.4 },
  { name: 'M33', ra: 23.4621, dec: 30.6599, commonName: 'Triangulum Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [10, 11, 12, 1], magnitude: 5.7 },
  { name: 'M51', ra: 202.4696, dec: 47.1952, commonName: 'Whirlpool Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [3, 4, 5, 6], magnitude: 8.4 },
  { name: 'M81', ra: 148.8882, dec: 69.0653, commonName: "Bode's Galaxy", type: 'galaxy', difficulty: 'easy', bestMonths: [2, 3, 4, 5], magnitude: 6.9 },
  { name: 'M82', ra: 148.9685, dec: 69.6797, commonName: 'Cigar Galaxy', type: 'galaxy', difficulty: 'easy', bestMonths: [2, 3, 4, 5], magnitude: 8.4 },
  { name: 'M101', ra: 210.8024, dec: 54.3488, commonName: 'Pinwheel Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [3, 4, 5, 6], magnitude: 7.9 },
  { name: 'M104', ra: 189.9976, dec: -11.6231, commonName: 'Sombrero Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [4, 5, 6], magnitude: 8.0 },
  { name: 'M64', ra: 194.1825, dec: 21.6828, commonName: 'Black Eye Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [4, 5, 6], magnitude: 8.5 },
  { name: 'NGC253', ra: 11.888, dec: -25.2883, commonName: 'Sculptor Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [10, 11, 12], magnitude: 7.1 },
  { name: 'M63', ra: 198.9554, dec: 42.0294, commonName: 'Sunflower Galaxy', type: 'galaxy', difficulty: 'medium', bestMonths: [4, 5, 6], magnitude: 8.6 },
  { name: 'M106', ra: 184.7397, dec: 47.3039, commonName: 'NGC 4258', type: 'galaxy', difficulty: 'medium', bestMonths: [3, 4, 5], magnitude: 8.4 },
  
  // Nebulae
  { name: 'M42', ra: 83.8221, dec: -5.3911, commonName: 'Orion Nebula', type: 'nebula', difficulty: 'easy', bestMonths: [11, 12, 1, 2, 3], magnitude: 4.0 },
  { name: 'M43', ra: 83.8833, dec: -5.2667, commonName: "De Mairan's Nebula", type: 'nebula', difficulty: 'easy', bestMonths: [11, 12, 1, 2, 3], magnitude: 9.0 },
  { name: 'NGC7000', ra: 314.6833, dec: 44.3167, commonName: 'North America Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [7, 8, 9, 10], magnitude: 4.0 },
  { name: 'IC5070', ra: 312.75, dec: 44.37, commonName: 'Pelican Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [7, 8, 9, 10], magnitude: 8.0 },
  { name: 'NGC6992', ra: 312.7583, dec: 31.7167, commonName: 'Eastern Veil Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [7, 8, 9, 10], magnitude: 7.0 },
  { name: 'NGC6960', ra: 312.2417, dec: 30.7333, commonName: "Witch's Broom Nebula", type: 'nebula', difficulty: 'medium', bestMonths: [7, 8, 9, 10], magnitude: 7.0 },
  { name: 'IC1396', ra: 324.7458, dec: 57.4833, commonName: 'Elephant Trunk Nebula', type: 'nebula', difficulty: 'hard', bestMonths: [8, 9, 10, 11], magnitude: 3.5 },
  { name: 'NGC2244', ra: 97.9833, dec: 4.9333, commonName: 'Rosette Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [12, 1, 2, 3], magnitude: 4.8 },
  { name: 'M8', ra: 270.9208, dec: -24.3833, commonName: 'Lagoon Nebula', type: 'nebula', difficulty: 'easy', bestMonths: [6, 7, 8], magnitude: 6.0 },
  { name: 'M20', ra: 270.6208, dec: -23.0333, commonName: 'Trifid Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [6, 7, 8], magnitude: 6.3 },
  { name: 'M16', ra: 274.7, dec: -13.8167, commonName: 'Eagle Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [6, 7, 8], magnitude: 6.0 },
  { name: 'M17', ra: 275.1958, dec: -16.1833, commonName: 'Omega Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [6, 7, 8], magnitude: 6.0 },
  { name: 'NGC6888', ra: 303.0583, dec: 38.35, commonName: 'Crescent Nebula', type: 'nebula', difficulty: 'hard', bestMonths: [7, 8, 9, 10], magnitude: 7.4 },
  { name: 'M78', ra: 86.6917, dec: 0.0833, commonName: 'Reflection Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [11, 12, 1, 2], magnitude: 8.3 },
  { name: 'NGC2024', ra: 85.4208, dec: -1.9, commonName: 'Flame Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [11, 12, 1, 2], magnitude: 2.0 },
  { name: 'IC434', ra: 85.25, dec: -2.4583, commonName: 'Horsehead Nebula', type: 'nebula', difficulty: 'hard', bestMonths: [11, 12, 1, 2], magnitude: 6.8 },
  { name: 'M1', ra: 83.6333, dec: 22.0167, commonName: 'Crab Nebula', type: 'nebula', difficulty: 'easy', bestMonths: [11, 12, 1, 2], magnitude: 8.4 },
  { name: 'NGC7293', ra: 337.4108, dec: -20.8372, commonName: 'Helix Nebula', type: 'planetary', difficulty: 'medium', bestMonths: [9, 10, 11], magnitude: 7.6 },
  { name: 'Sh2-129', ra: 321.5, dec: 60.17, commonName: 'Flying Bat Nebula', type: 'nebula', difficulty: 'hard', bestMonths: [8, 9, 10, 11], magnitude: 7.0 },
  { name: 'NGC1499', ra: 60.2, dec: 36.4, commonName: 'California Nebula', type: 'nebula', difficulty: 'medium', bestMonths: [10, 11, 12, 1], magnitude: 5.0 },
  
  // Planetary Nebulae
  { name: 'M57', ra: 283.3962, dec: 33.0286, commonName: 'Ring Nebula', type: 'planetary', difficulty: 'easy', bestMonths: [6, 7, 8, 9], magnitude: 8.8 },
  { name: 'M27', ra: 299.9017, dec: 22.7211, commonName: 'Dumbbell Nebula', type: 'planetary', difficulty: 'easy', bestMonths: [7, 8, 9, 10], magnitude: 7.5 },
  { name: 'M97', ra: 168.6988, dec: 55.0192, commonName: 'Owl Nebula', type: 'planetary', difficulty: 'medium', bestMonths: [2, 3, 4, 5], magnitude: 9.9 },
  { name: 'NGC6826', ra: 295.375, dec: 50.525, commonName: 'Blinking Planetary', type: 'planetary', difficulty: 'medium', bestMonths: [7, 8, 9], magnitude: 8.8 },
  
  // Star Clusters
  { name: 'M45', ra: 56.75, dec: 24.1167, commonName: 'Pleiades', type: 'cluster', difficulty: 'easy', bestMonths: [10, 11, 12, 1, 2], magnitude: 1.6 },
  { name: 'M13', ra: 250.4217, dec: 36.4613, commonName: 'Hercules Cluster', type: 'cluster', difficulty: 'easy', bestMonths: [5, 6, 7, 8], magnitude: 5.8 },
  { name: 'M92', ra: 259.2808, dec: 43.1364, commonName: 'Hercules Globular', type: 'cluster', difficulty: 'easy', bestMonths: [5, 6, 7, 8], magnitude: 6.4 },
  { name: 'M3', ra: 205.5483, dec: 28.3772, commonName: 'Globular Cluster', type: 'cluster', difficulty: 'easy', bestMonths: [4, 5, 6], magnitude: 6.2 },
  { name: 'M5', ra: 229.6383, dec: 2.0811, commonName: 'Globular Cluster', type: 'cluster', difficulty: 'easy', bestMonths: [5, 6, 7], magnitude: 5.7 },
  { name: 'NGC869', ra: 34.75, dec: 57.13, commonName: 'Double Cluster h', type: 'cluster', difficulty: 'easy', bestMonths: [9, 10, 11, 12], magnitude: 5.3 },
  { name: 'NGC884', ra: 35.08, dec: 57.15, commonName: 'Double Cluster χ', type: 'cluster', difficulty: 'easy', bestMonths: [9, 10, 11, 12], magnitude: 6.1 },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate when a target transits (crosses the meridian)
 */
function calculateTransitTime(ra: number, longitude: number, date: Date): Date {
  const lst = getLST(longitude);
  let hourAngle = ra / 15 - lst / 15; // Convert RA and LST to hours
  
  // Normalize to -12 to +12 hours
  while (hourAngle < -12) hourAngle += 24;
  while (hourAngle > 12) hourAngle -= 24;
  
  const transitDate = new Date(date);
  transitDate.setHours(transitDate.getHours() + hourAngle);
  
  return transitDate;
}

/**
 * Calculate maximum altitude for a target
 */
function calculateMaxAltitude(dec: number, latitude: number): number {
  // Max altitude occurs at transit
  // Alt = 90 - |lat - dec|
  return 90 - Math.abs(latitude - dec);
}

/**
 * Check if target is circumpolar (never sets)
 */
function isCircumpolar(dec: number, latitude: number): boolean {
  return Math.abs(dec) > (90 - Math.abs(latitude));
}

/**
 * Check if target never rises
 */
function neverRises(dec: number, latitude: number): boolean {
  if (latitude >= 0) {
    return dec < -(90 - latitude);
  } else {
    return dec > (90 + latitude);
  }
}

/**
 * Calculate approximate rise/set times
 */
function calculateRiseSetTimes(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  date: Date,
  minAltitude: number = 20
): { rise: Date | null; set: Date | null } {
  if (neverRises(dec, latitude)) {
    return { rise: null, set: null };
  }
  
  if (isCircumpolar(dec, latitude)) {
    // Always visible
    return { rise: null, set: null };
  }
  
  // Calculate hour angle when target is at minAltitude
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const altRad = (minAltitude * Math.PI) / 180;
  
  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
               (Math.cos(latRad) * Math.cos(decRad));
  
  if (Math.abs(cosH) > 1) {
    return { rise: null, set: null };
  }
  
  const H = Math.acos(cosH) * 180 / Math.PI / 15; // Hour angle in hours
  
  const transitTime = calculateTransitTime(ra, longitude, date);
  
  const riseTime = new Date(transitTime);
  riseTime.setHours(riseTime.getHours() - H);
  
  const setTime = new Date(transitTime);
  setTime.setHours(setTime.getHours() + H);
  
  return { rise: riseTime, set: setTime };
}

/**
 * Calculate imaging hours during dark time
 */
function calculateImagingHours(
  riseTime: Date | null,
  setTime: Date | null,
  darkStart: Date | null,
  darkEnd: Date | null,
  isCircumpolarTarget: boolean
): number {
  if (!darkStart || !darkEnd) return 0;
  
  const darkStartMs = darkStart.getTime();
  const darkEndMs = darkEnd.getTime();
  
  if (isCircumpolarTarget) {
    // Always visible, return full dark hours
    return (darkEndMs - darkStartMs) / (1000 * 60 * 60);
  }
  
  if (!riseTime || !setTime) return 0;
  
  const riseMs = riseTime.getTime();
  const setMs = setTime.getTime();
  
  // Find overlap between visibility window and dark window
  const overlapStart = Math.max(riseMs, darkStartMs);
  const overlapEnd = Math.min(setMs, darkEndMs);
  
  if (overlapEnd <= overlapStart) return 0;
  
  return (overlapEnd - overlapStart) / (1000 * 60 * 60);
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
    return { latitude: 40, longitude: -74 }; // Default to NYC area
  }, [stel]);

  // Calculate tonight's conditions
  const calculateConditions = useCallback((): TonightConditions => {
    const { latitude, longitude } = getObserverLocation();
    const now = new Date();
    const jd = getJulianDateFromDate(now);
    
    const moonPhase = getMoonPhase(jd);
    const moonIllumination = getMoonIllumination(moonPhase);
    
    // Get moon phase name
    let moonPhaseName = 'New Moon';
    if (moonPhase < 0.03 || moonPhase > 0.97) moonPhaseName = 'New Moon';
    else if (moonPhase < 0.22) moonPhaseName = 'Waxing Crescent';
    else if (moonPhase < 0.28) moonPhaseName = 'First Quarter';
    else if (moonPhase < 0.47) moonPhaseName = 'Waxing Gibbous';
    else if (moonPhase < 0.53) moonPhaseName = 'Full Moon';
    else if (moonPhase < 0.72) moonPhaseName = 'Waning Gibbous';
    else if (moonPhase < 0.78) moonPhaseName = 'Last Quarter';
    else moonPhaseName = 'Waning Crescent';
    
    // Calculate twilight times based on latitude and time of year
    // These are approximate values - proper calculation would use solar position
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Approximate sunset time varies by latitude and season
    // Summer: later sunset, Winter: earlier sunset
    const summerSolstice = 172; // ~June 21
    const seasonalOffset = Math.cos((dayOfYear - summerSolstice) * 2 * Math.PI / 365) * 2; // ±2 hours
    const latitudeOffset = (latitude - 40) * 0.05; // Adjust for latitude
    
    const baseSunsetHour = 18.5 + seasonalOffset + latitudeOffset;
    const baseSunriseHour = 6.5 - seasonalOffset - latitudeOffset;
    
    // Create twilight times
    const sunset = new Date(now);
    sunset.setHours(Math.floor(baseSunsetHour), (baseSunsetHour % 1) * 60, 0, 0);
    
    const civilDusk = new Date(sunset);
    civilDusk.setMinutes(civilDusk.getMinutes() + 30); // ~30 min after sunset
    
    const nauticalDusk = new Date(sunset);
    nauticalDusk.setMinutes(nauticalDusk.getMinutes() + 60); // ~60 min after sunset
    
    const astronomicalDusk = new Date(sunset);
    astronomicalDusk.setMinutes(astronomicalDusk.getMinutes() + 90); // ~90 min after sunset
    
    const sunrise = new Date(now);
    sunrise.setDate(sunrise.getDate() + 1);
    sunrise.setHours(Math.floor(baseSunriseHour), (baseSunriseHour % 1) * 60, 0, 0);
    
    const astronomicalDawn = new Date(sunrise);
    astronomicalDawn.setMinutes(astronomicalDawn.getMinutes() - 90);
    
    const nauticalDawn = new Date(sunrise);
    nauticalDawn.setMinutes(nauticalDawn.getMinutes() - 60);
    
    const civilDawn = new Date(sunrise);
    civilDawn.setMinutes(civilDawn.getMinutes() - 30);
    
    const darkStart = astronomicalDusk;
    const darkEnd = astronomicalDawn;
    
    const totalDarkHours = (darkEnd.getTime() - darkStart.getTime()) / (1000 * 60 * 60);
    
    const twilight: TwilightInfo = {
      sunset,
      civilDusk,
      nauticalDusk,
      astronomicalDusk,
      astronomicalDawn,
      nauticalDawn,
      civilDawn,
      sunrise,
    };
    
    return {
      moonPhase,
      moonIllumination,
      moonPhaseName,
      darkHoursStart: darkStart,
      darkHoursEnd: darkEnd,
      totalDarkHours: Math.max(0, totalDarkHours),
      latitude,
      longitude,
      twilight,
      currentTime: now,
    };
  }, [getObserverLocation]);

  // Calculate recommendations
  const calculateRecommendations = useCallback(() => {
    setIsLoading(true);
    
    const cond = calculateConditions();
    setConditions(cond);
    
    const { latitude, longitude, darkHoursStart, darkHoursEnd, moonIllumination } = cond;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const jd = getJulianDateFromDate(now);
    
    // Get moon position for distance calculations
    const moonPos = getMoonPosition(jd);
    
    const scored: RecommendedTarget[] = [];
    
    for (const target of TARGET_DATABASE) {
      const reasons: string[] = [];
      const warnings: string[] = [];
      let score = 50; // Base score
      
      // Check if target is visible from this latitude
      if (neverRises(target.dec, latitude)) {
        continue; // Skip targets that never rise
      }
      
      // Calculate visibility
      const maxAlt = calculateMaxAltitude(target.dec, latitude);
      const isCircumpolarTarget = isCircumpolar(target.dec, latitude);
      const transitTime = calculateTransitTime(target.ra, longitude, now);
      const { rise: riseTime, set: setTime } = calculateRiseSetTimes(
        target.ra, target.dec, latitude, longitude, now, 25
      );
      
      // Calculate moon distance
      const moonDistance = angularSeparation(target.ra, target.dec, moonPos.ra, moonPos.dec);
      
      // Calculate imaging hours
      const imagingHours = calculateImagingHours(
        riseTime, setTime, darkHoursStart, darkHoursEnd, isCircumpolarTarget
      );
      
      // Skip if no imaging time available
      if (imagingHours < 1 && !isCircumpolarTarget) {
        continue;
      }
      
      // Scoring factors
      
      // 1. Seasonal bonus (best months)
      if (target.bestMonths.includes(currentMonth)) {
        score += 20;
        reasons.push('Best season for this target');
      } else {
        // Check if within 1 month of best season
        const nearBest = target.bestMonths.some(m => 
          Math.abs(m - currentMonth) <= 1 || Math.abs(m - currentMonth) >= 11
        );
        if (nearBest) {
          score += 10;
        }
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
        // Moon is dim, less impact
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
      if (target.difficulty === 'easy') {
        score += 5;
      } else if (target.difficulty === 'hard') {
        score -= 5;
      }
      
      // 7. Transit timing bonus (transits during dark hours)
      if (darkHoursStart && darkHoursEnd) {
        const transitMs = transitTime.getTime();
        const darkStartMs = darkHoursStart.getTime();
        const darkEndMs = darkHoursEnd.getTime();
        
        if (transitMs >= darkStartMs && transitMs <= darkEndMs) {
          score += 10;
          reasons.push('Transits during dark hours');
        }
      }
      
      // Create recommendation
      scored.push({
        Name: target.name,
        Type: 'DSO',
        RA: target.ra,
        Dec: target.dec,
        'Common names': target.commonName,
        score: Math.max(0, Math.min(100, score)),
        maxAltitude: maxAlt,
        transitTime,
        riseTime,
        setTime,
        moonDistance,
        imagingHours: isCircumpolarTarget ? cond.totalDarkHours : imagingHours,
        reasons,
        warnings,
      });
    }
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Take top 15
    setRecommendations(scored.slice(0, 15));
    setIsLoading(false);
  }, [calculateConditions]);

  // Auto-calculate on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Use setTimeout to avoid synchronous setState in effect
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
