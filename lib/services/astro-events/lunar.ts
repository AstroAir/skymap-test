/**
 * Lunar phase event calculations
 */

import type { LunarPhaseEvent } from './types';
import { SYNODIC_MONTH } from '@/lib/astronomy/celestial/moon';

// ============================================================================
// Lunar Phase Events
// ============================================================================

/**
 * Calculate upcoming lunar phase events
 * @param months - Number of months ahead to calculate
 * @returns Array of lunar phase events
 */
export function getLunarPhaseEvents(months: number = 3): LunarPhaseEvent[] {
  const events: LunarPhaseEvent[] = [];
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);
  
  // Known new moon reference
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  
  // Calculate days since known new moon
  const daysSinceNew = (now.getTime() - knownNewMoon.getTime()) / (24 * 3600 * 1000);
  const cyclesSinceNew = Math.floor(daysSinceNew / SYNODIC_MONTH);
  
  // Start from current cycle
  const currentCycleStart = new Date(
    knownNewMoon.getTime() + cyclesSinceNew * SYNODIC_MONTH * 24 * 3600 * 1000
  );
  
  // If current cycle start is in the past, move forward
  if (currentCycleStart < now) {
    // Just find the next phase
  }
  
  let phaseDate = currentCycleStart;
  let eventId = 0;
  
  while (phaseDate < endDate) {
    // New Moon
    events.push(createLunarEvent(eventId++, phaseDate, 'new'));
    
    // First Quarter (7.38 days after new moon)
    const firstQuarter = new Date(phaseDate.getTime() + 7.38 * 24 * 3600 * 1000);
    if (firstQuarter >= now && firstQuarter < endDate) {
      events.push(createLunarEvent(eventId++, firstQuarter, 'firstQuarter'));
    }
    
    // Full Moon (14.77 days after new moon)
    const fullMoon = new Date(phaseDate.getTime() + 14.77 * 24 * 3600 * 1000);
    if (fullMoon >= now && fullMoon < endDate) {
      events.push(createLunarEvent(eventId++, fullMoon, 'full'));
    }
    
    // Last Quarter (22.15 days after new moon)
    const lastQuarter = new Date(phaseDate.getTime() + 22.15 * 24 * 3600 * 1000);
    if (lastQuarter >= now && lastQuarter < endDate) {
      events.push(createLunarEvent(eventId++, lastQuarter, 'lastQuarter'));
    }
    
    // Move to next cycle
    phaseDate = new Date(phaseDate.getTime() + SYNODIC_MONTH * 24 * 3600 * 1000);
  }
  
  // Filter to only future events and sort
  return events
    .filter(e => e.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Create a lunar phase event
 */
function createLunarEvent(
  id: number,
  date: Date,
  phase: LunarPhaseEvent['phase']
): LunarPhaseEvent {
  const phaseNames: Record<string, string> = {
    new: 'New Moon',
    firstQuarter: 'First Quarter',
    full: 'Full Moon',
    lastQuarter: 'Last Quarter',
  };
  
  const phaseIllumination: Record<string, number> = {
    new: 0,
    firstQuarter: 50,
    full: 100,
    lastQuarter: 50,
  };
  
  const descriptions: Record<string, string> = {
    new: 'Best time for deep sky imaging - no moonlight',
    firstQuarter: 'Moon rises around noon, sets around midnight',
    full: 'Avoid deep sky imaging - bright moonlight all night',
    lastQuarter: 'Moon rises around midnight, morning imaging affected',
  };
  
  return {
    id: `lunar-${id}`,
    type: 'lunar',
    name: phaseNames[phase],
    date,
    phase,
    illumination: phaseIllumination[phase],
    description: descriptions[phase],
    visibility: phase === 'new' ? 'excellent' : phase === 'full' ? 'poor' : 'good',
    source: 'calculated',
  };
}

/**
 * Get the next new moon date
 */
export function getNextNewMoon(from: Date = new Date()): Date {
  const events = getLunarPhaseEvents(2);
  const newMoon = events.find(e => e.phase === 'new' && e.date >= from);
  return newMoon?.date ?? from;
}

/**
 * Get the next full moon date
 */
export function getNextFullMoon(from: Date = new Date()): Date {
  const events = getLunarPhaseEvents(2);
  const fullMoon = events.find(e => e.phase === 'full' && e.date >= from);
  return fullMoon?.date ?? from;
}
