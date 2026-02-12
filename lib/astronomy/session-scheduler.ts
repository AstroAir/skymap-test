/**
 * Session scheduling algorithm
 * Extracted from components/starmap/planning/session-planner.tsx
 */

import type { TargetItem } from '@/lib/stores/target-list-store';
import type { ScheduledTarget, SessionPlan, OptimizationStrategy } from '@/types/starmap/planning';
import {
  type TwilightTimes,
  calculateTargetVisibility,
  calculateImagingFeasibility,
  getMoonPosition,
  getMoonPhase,
  getMoonIllumination,
  angularSeparation,
  formatDuration,
} from './astro-utils';

// ============================================================================
// Scheduling Algorithm
// ============================================================================

export function optimizeSchedule(
  targets: TargetItem[],
  latitude: number,
  longitude: number,
  twilight: TwilightTimes,
  strategy: OptimizationStrategy,
  minAltitude: number,
  minImagingTime: number // minutes
): SessionPlan {
  const moonPos = getMoonPosition();
  const moonPhase = getMoonPhase();
  const moonIllum = getMoonIllumination(moonPhase);
  
  // Calculate visibility for all targets
  const targetData = targets.map(target => {
    const visibility = calculateTargetVisibility(
      target.ra, target.dec, latitude, longitude, minAltitude
    );
    const feasibility = calculateImagingFeasibility(
      target.ra, target.dec, latitude, longitude
    );
    const moonDist = angularSeparation(target.ra, target.dec, moonPos.ra, moonPos.dec);
    
    return {
      target,
      visibility,
      feasibility,
      moonDistance: moonDist,
      transitTime: visibility.transitTime,
      maxAltitude: visibility.transitAltitude,
      darkStart: visibility.darkImagingStart,
      darkEnd: visibility.darkImagingEnd,
      darkHours: visibility.darkImagingHours,
    };
  });
  
  // Filter out targets without imaging time
  const viableTargets = targetData.filter(t => t.darkHours >= minImagingTime / 60);
  
  // Sort based on strategy
  const sortedTargets = [...viableTargets].sort((a, b) => {
    switch (strategy) {
      case 'altitude':
        return b.maxAltitude - a.maxAltitude;
      case 'transit':
        return (a.transitTime?.getTime() ?? 0) - (b.transitTime?.getTime() ?? 0);
      case 'moon':
        return b.moonDistance - a.moonDistance;
      case 'duration':
        return b.darkHours - a.darkHours;
      case 'balanced':
      default: {
        // Weighted score combining all factors
        const scoreA = (a.feasibility.score * 0.4) + 
                       (a.maxAltitude * 0.3) + 
                       (a.moonDistance * 0.3);
        const scoreB = (b.feasibility.score * 0.4) + 
                       (b.maxAltitude * 0.3) + 
                       (b.moonDistance * 0.3);
        return scoreB - scoreA;
      }
    }
  });
  
  // Schedule targets without overlap
  const scheduled: ScheduledTarget[] = [];
  const usedSlots: Array<{ start: number; end: number }> = [];
  
  for (let i = 0; i < sortedTargets.length; i++) {
    const td = sortedTargets[i];
    if (!td.darkStart || !td.darkEnd) continue;
    
    const targetStart = td.darkStart.getTime();
    const targetEnd = td.darkEnd.getTime();
    
    // Find available slot for this target
    let slotStart = targetStart;
    let slotEnd = targetEnd;
    
    // Check for overlaps and adjust
    for (const used of usedSlots) {
      if (slotStart < used.end && slotEnd > used.start) {
        // Overlap detected - try to fit around it
        if (used.start > slotStart && used.start - slotStart >= minImagingTime * 60000) {
          slotEnd = used.start;
        } else if (used.end < slotEnd && slotEnd - used.end >= minImagingTime * 60000) {
          slotStart = used.end;
        } else {
          // Can't fit - skip this target
          slotStart = 0;
          slotEnd = 0;
          break;
        }
      }
    }
    
    if (slotEnd - slotStart >= minImagingTime * 60000) {
      const duration = (slotEnd - slotStart) / 3600000;
      
      // Find conflicts
      const conflicts: string[] = [];
      for (const other of sortedTargets) {
        if (other.target.id === td.target.id) continue;
        if (!other.darkStart || !other.darkEnd) continue;
        
        const overlap = Math.max(0,
          Math.min(slotEnd, other.darkEnd.getTime()) -
          Math.max(slotStart, other.darkStart.getTime())
        ) / 3600000;
        
        if (overlap > 0.5) {
          conflicts.push(other.target.name);
        }
      }
      
      scheduled.push({
        target: td.target,
        startTime: new Date(slotStart),
        endTime: new Date(slotEnd),
        duration,
        transitTime: td.transitTime,
        maxAltitude: td.maxAltitude,
        moonDistance: td.moonDistance,
        feasibility: td.feasibility,
        conflicts,
        isOptimal: td.feasibility.score >= 70,
        order: scheduled.length + 1,
      });
      
      usedSlots.push({ start: slotStart, end: slotEnd });
      usedSlots.sort((a, b) => a.start - b.start);
    }
  }
  
  // Sort scheduled by start time
  scheduled.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  scheduled.forEach((s, i) => { s.order = i + 1; });
  
  // Calculate gaps
  const gaps: Array<{ start: Date; end: Date; duration: number }> = [];
  if (twilight.astronomicalDusk && twilight.astronomicalDawn) {
    const nightStart = twilight.astronomicalDusk.getTime();
    const nightEnd = twilight.astronomicalDawn.getTime();
    
    let lastEnd = nightStart;
    for (const s of scheduled) {
      if (s.startTime.getTime() > lastEnd) {
        const gapDuration = (s.startTime.getTime() - lastEnd) / 3600000;
        if (gapDuration > 0.25) { // > 15 min gap
          gaps.push({
            start: new Date(lastEnd),
            end: s.startTime,
            duration: gapDuration,
          });
        }
      }
      lastEnd = Math.max(lastEnd, s.endTime.getTime());
    }
    
    // Gap at end of night
    if (lastEnd < nightEnd) {
      const gapDuration = (nightEnd - lastEnd) / 3600000;
      if (gapDuration > 0.25) {
        gaps.push({
          start: new Date(lastEnd),
          end: new Date(nightEnd),
          duration: gapDuration,
        });
      }
    }
  }
  
  // Calculate totals
  const totalImagingTime = scheduled.reduce((sum, s) => sum + s.duration, 0);
  const nightCoverage = twilight.darknessDuration > 0
    ? (totalImagingTime / twilight.darknessDuration) * 100
    : 0;
  const efficiency = scheduled.length > 0
    ? scheduled.filter(s => s.isOptimal).length / scheduled.length * 100
    : 0;
  
  // Generate recommendations and warnings
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  if (nightCoverage < 50) {
    recommendations.push('Consider adding more targets to fill the night');
  }
  if (nightCoverage > 120) {
    warnings.push('Too many targets for one night - consider spreading across multiple sessions');
  }
  if (moonIllum > 70) {
    warnings.push('Bright moon tonight - consider narrowband imaging');
  }
  
  const excellentTargets = scheduled.filter(s => s.feasibility.recommendation === 'excellent');
  if (excellentTargets.length > 0) {
    recommendations.push(`Prioritize: ${excellentTargets.map(t => t.target.name).join(', ')}`);
  }
  
  if (gaps.length > 0) {
    const totalGapTime = gaps.reduce((sum, g) => sum + g.duration, 0);
    if (totalGapTime > 1) {
      recommendations.push(`${formatDuration(totalGapTime)} of unused dark time - consider adding targets`);
    }
  }
  
  return {
    targets: scheduled,
    totalImagingTime,
    nightCoverage,
    efficiency,
    gaps,
    recommendations,
    warnings,
  };
}
