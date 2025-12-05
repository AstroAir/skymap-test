'use client';

import { useMemo, useCallback } from 'react';
import { useTargetListStore, type ObservableWindow } from '@/lib/stores/target-list-store';
import { useMountStore } from '@/lib/stores';
import {
  calculateNighttimeData,
  calculateAltitudeData,
  calculateMoonDistance,
  type NighttimeData,
} from '@/lib/catalogs';

// ============================================================================
// Types
// ============================================================================

export interface TargetVisibility {
  targetId: string;
  name: string;
  ra: number;
  dec: number;
  // Visibility data
  maxAltitude: number;
  transitTime: Date | null;
  riseTime: Date | null;
  setTime: Date | null;
  // Dark sky window
  darkStart: Date | null;
  darkEnd: Date | null;
  darkHours: number;
  // Moon data
  moonDistance: number;
  moonInterference: 'none' | 'low' | 'moderate' | 'high';
  // Imaging feasibility
  imagingScore: number;
  isVisible: boolean;
  isCircumpolar: boolean;
  neverRises: boolean;
  // Optimal imaging window
  optimalStart: Date | null;
  optimalEnd: Date | null;
  optimalHours: number;
}

export interface SessionPlan {
  date: Date;
  nighttimeData: NighttimeData;
  targets: TargetVisibility[];
  totalImagingHours: number;
  scheduledOrder: string[]; // target IDs in optimal order
  conflicts: SessionConflict[];
  coverage: number; // percentage of dark time utilized
}

export interface SessionConflict {
  targetA: string;
  targetB: string;
  overlapStart: Date;
  overlapEnd: Date;
  type: 'overlap' | 'gap';
}

export interface TargetScheduleSlot {
  targetId: string;
  start: Date;
  end: Date;
  duration: number; // hours
  altitude: number; // average altitude during slot
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateOptimalWindow(
  altitudeData: ReturnType<typeof calculateAltitudeData>,
  nighttimeData: NighttimeData,
  minAltitude: number = 30
): { start: Date | null; end: Date | null; hours: number } {
  const darkStart = nighttimeData.twilightRiseAndSet.set;
  const darkEnd = nighttimeData.twilightRiseAndSet.rise;
  
  if (!darkStart || !darkEnd) {
    return { start: null, end: null, hours: 0 };
  }

  // Find points above minimum altitude during dark time
  const darkStartMs = darkStart.getTime();
  const darkEndMs = darkEnd.getTime();
  
  const validPoints = altitudeData.points.filter(p => {
    const timeMs = p.time.getTime();
    return timeMs >= darkStartMs && timeMs <= darkEndMs && p.altitude >= minAltitude;
  });

  if (validPoints.length === 0) {
    return { start: null, end: null, hours: 0 };
  }

  const start = validPoints[0].time;
  const end = validPoints[validPoints.length - 1].time;
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  return { start, end, hours };
}

function getMoonInterference(moonDistance: number, moonIllumination: number): 'none' | 'low' | 'moderate' | 'high' {
  if (moonIllumination < 20) return 'none';
  if (moonIllumination < 50) {
    return moonDistance < 30 ? 'moderate' : 'low';
  }
  if (moonDistance < 30) return 'high';
  if (moonDistance < 60) return 'moderate';
  return 'low';
}

function calculateImagingScore(
  maxAlt: number,
  darkHours: number,
  moonDistance: number,
  moonIllumination: number
): number {
  let score = 0;
  
  // Altitude score (0-35)
  if (maxAlt >= 70) score += 35;
  else if (maxAlt >= 60) score += 30;
  else if (maxAlt >= 50) score += 25;
  else if (maxAlt >= 40) score += 20;
  else if (maxAlt >= 30) score += 15;
  else score += Math.max(0, maxAlt / 2);
  
  // Dark hours score (0-35)
  if (darkHours >= 6) score += 35;
  else if (darkHours >= 4) score += 28;
  else if (darkHours >= 2) score += 20;
  else if (darkHours >= 1) score += 12;
  else score += darkHours * 10;
  
  // Moon score (0-30)
  const interference = getMoonInterference(moonDistance, moonIllumination);
  switch (interference) {
    case 'none': score += 30; break;
    case 'low': score += 22; break;
    case 'moderate': score += 12; break;
    case 'high': score += 0; break;
  }
  
  return Math.min(100, Math.max(0, score));
}

function scheduleTargets(
  targets: TargetVisibility[],
  nighttimeData: NighttimeData
): TargetScheduleSlot[] {
  const darkStart = nighttimeData.twilightRiseAndSet.set;
  const darkEnd = nighttimeData.twilightRiseAndSet.rise;
  
  if (!darkStart || !darkEnd) return [];
  
  // Sort targets by optimal start time
  const sortedTargets = [...targets]
    .filter(t => t.optimalStart && t.optimalEnd && t.optimalHours > 0)
    .sort((a, b) => {
      if (!a.optimalStart || !b.optimalStart) return 0;
      return a.optimalStart.getTime() - b.optimalStart.getTime();
    });
  
  const schedule: TargetScheduleSlot[] = [];
  let currentTime = darkStart.getTime();
  
  for (const target of sortedTargets) {
    if (!target.optimalStart || !target.optimalEnd) continue;
    
    const slotStart = Math.max(currentTime, target.optimalStart.getTime());
    const slotEnd = Math.min(darkEnd.getTime(), target.optimalEnd.getTime());
    
    if (slotEnd > slotStart) {
      const duration = (slotEnd - slotStart) / (1000 * 60 * 60);
      if (duration >= 0.5) { // Minimum 30 minutes
        schedule.push({
          targetId: target.targetId,
          start: new Date(slotStart),
          end: new Date(slotEnd),
          duration,
          altitude: target.maxAltitude,
        });
        currentTime = slotEnd;
      }
    }
  }
  
  return schedule;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useTargetPlanner() {
  const targets = useTargetListStore((state) => state.targets);
  const updateObservableWindow = useTargetListStore((state) => state.updateObservableWindow);
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  // Get location
  const location = useMemo(() => ({
    latitude: profileInfo.AstrometrySettings.Latitude || 40,
    longitude: profileInfo.AstrometrySettings.Longitude || -74,
  }), [profileInfo.AstrometrySettings.Latitude, profileInfo.AstrometrySettings.Longitude]);
  
  // Calculate nighttime data
  const nighttimeData = useMemo(() => {
    return calculateNighttimeData(location.latitude, location.longitude, new Date());
  }, [location.latitude, location.longitude]);
  
  // Calculate visibility for all targets
  const targetVisibilities = useMemo((): TargetVisibility[] => {
    const referenceDate = nighttimeData.referenceDate;
    
    return targets.map((target): TargetVisibility => {
      const altitudeData = calculateAltitudeData(
        target.ra,
        target.dec,
        location.latitude,
        location.longitude,
        referenceDate
      );
      
      const moonDistance = calculateMoonDistance(target.ra, target.dec, referenceDate);
      const optimalWindow = calculateOptimalWindow(altitudeData, nighttimeData, 30);
      
      // Calculate dark hours
      const darkStart = nighttimeData.twilightRiseAndSet.set;
      const darkEnd = nighttimeData.twilightRiseAndSet.rise;
      let darkHours = 0;
      
      if (darkStart && darkEnd && altitudeData.riseTime && altitudeData.setTime) {
        const overlapStart = Math.max(darkStart.getTime(), altitudeData.riseTime.getTime());
        const overlapEnd = Math.min(darkEnd.getTime(), altitudeData.setTime.getTime());
        if (overlapEnd > overlapStart) {
          darkHours = (overlapEnd - overlapStart) / (1000 * 60 * 60);
        }
      }
      
      const moonInterference = getMoonInterference(moonDistance, nighttimeData.moonIllumination);
      const imagingScore = calculateImagingScore(
        altitudeData.maxAltitude,
        optimalWindow.hours,
        moonDistance,
        nighttimeData.moonIllumination
      );
      
      // Check if target is visible
      const neverRises = target.dec < -(90 - Math.abs(location.latitude));
      const isCircumpolar = Math.abs(target.dec) > (90 - Math.abs(location.latitude));
      const isVisible = !neverRises && altitudeData.maxAltitude > 0;
      
      return {
        targetId: target.id,
        name: target.name,
        ra: target.ra,
        dec: target.dec,
        maxAltitude: altitudeData.maxAltitude,
        transitTime: altitudeData.transitTime,
        riseTime: altitudeData.riseTime,
        setTime: altitudeData.setTime,
        darkStart,
        darkEnd,
        darkHours,
        moonDistance,
        moonInterference,
        imagingScore,
        isVisible,
        isCircumpolar,
        neverRises,
        optimalStart: optimalWindow.start,
        optimalEnd: optimalWindow.end,
        optimalHours: optimalWindow.hours,
      };
    });
  }, [targets, location.latitude, location.longitude, nighttimeData]);
  
  // Generate session plan
  const sessionPlan = useMemo((): SessionPlan => {
    const visibleTargets = targetVisibilities.filter(t => t.isVisible && t.optimalHours > 0);
    const schedule = scheduleTargets(visibleTargets, nighttimeData);
    
    // Calculate total imaging hours
    const totalImagingHours = schedule.reduce((sum, slot) => sum + slot.duration, 0);
    
    // Calculate coverage
    const darkStart = nighttimeData.twilightRiseAndSet.set;
    const darkEnd = nighttimeData.twilightRiseAndSet.rise;
    const totalDarkHours = darkStart && darkEnd
      ? (darkEnd.getTime() - darkStart.getTime()) / (1000 * 60 * 60)
      : 0;
    const coverage = totalDarkHours > 0 ? (totalImagingHours / totalDarkHours) * 100 : 0;
    
    // Find conflicts (gaps > 30 min or overlaps)
    const conflicts: SessionConflict[] = [];
    for (let i = 0; i < schedule.length - 1; i++) {
      const current = schedule[i];
      const next = schedule[i + 1];
      const gap = (next.start.getTime() - current.end.getTime()) / (1000 * 60);
      
      if (gap > 30) {
        conflicts.push({
          targetA: current.targetId,
          targetB: next.targetId,
          overlapStart: current.end,
          overlapEnd: next.start,
          type: 'gap',
        });
      }
    }
    
    return {
      date: new Date(),
      nighttimeData,
      targets: targetVisibilities,
      totalImagingHours,
      scheduledOrder: schedule.map(s => s.targetId),
      conflicts,
      coverage: Math.min(100, coverage),
    };
  }, [targetVisibilities, nighttimeData]);
  
  // Update observable windows for all targets - called manually to avoid infinite loops
  const updateAllVisibility = useCallback(() => {
    for (const vis of targetVisibilities) {
      if (vis.isVisible) {
        const window: ObservableWindow = {
          start: vis.optimalStart || new Date(),
          end: vis.optimalEnd || new Date(),
          maxAltitude: vis.maxAltitude,
          transitTime: vis.transitTime || new Date(),
          isCircumpolar: vis.isCircumpolar,
        };
        updateObservableWindow(vis.targetId, window);
      }
    }
  }, [targetVisibilities, updateObservableWindow]);
  
  // Get sorted targets by various criteria
  const getSortedByScore = useCallback(() => {
    return [...targetVisibilities]
      .filter(t => t.isVisible)
      .sort((a, b) => b.imagingScore - a.imagingScore);
  }, [targetVisibilities]);
  
  const getSortedByTransit = useCallback(() => {
    return [...targetVisibilities]
      .filter(t => t.isVisible && t.transitTime)
      .sort((a, b) => {
        if (!a.transitTime || !b.transitTime) return 0;
        return a.transitTime.getTime() - b.transitTime.getTime();
      });
  }, [targetVisibilities]);
  
  const getSortedByAltitude = useCallback(() => {
    return [...targetVisibilities]
      .filter(t => t.isVisible)
      .sort((a, b) => b.maxAltitude - a.maxAltitude);
  }, [targetVisibilities]);
  
  const getSortedByDarkHours = useCallback(() => {
    return [...targetVisibilities]
      .filter(t => t.isVisible)
      .sort((a, b) => b.darkHours - a.darkHours);
  }, [targetVisibilities]);
  
  // Get best targets for tonight
  const getBestTargets = useCallback((limit: number = 5) => {
    return getSortedByScore().slice(0, limit);
  }, [getSortedByScore]);
  
  // Get targets with moon interference
  const getTargetsWithMoonIssues = useCallback(() => {
    return targetVisibilities.filter(t => 
      t.isVisible && (t.moonInterference === 'moderate' || t.moonInterference === 'high')
    );
  }, [targetVisibilities]);
  
  return {
    // Data
    location,
    nighttimeData,
    targetVisibilities,
    sessionPlan,
    
    // Sorted lists
    getSortedByScore,
    getSortedByTransit,
    getSortedByAltitude,
    getSortedByDarkHours,
    
    // Helpers
    getBestTargets,
    getTargetsWithMoonIssues,
    
    // Actions
    updateAllVisibility,
  };
}

