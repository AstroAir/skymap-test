/**
 * Event aggregator - combines all event sources
 */

import type { AstroEvent, EventFetchResult, EventType } from './types';
import { getLunarPhaseEvents } from './lunar';
import { getUpcomingMeteorShowers } from './meteor';
import { getUpcomingEclipses } from './eclipse';
import { getBrightComets } from './comet';

// ============================================================================
// Event Cache
// ============================================================================

interface EventCache {
  events: AstroEvent[];
  fetchedAt: Date;
  expiresAt: Date;
}

let eventCache: EventCache | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Get all upcoming astronomical events
 * @param months - Number of months ahead to fetch
 * @param types - Event types to include (all if not specified)
 * @returns Aggregated events sorted by date
 */
export async function getAllEvents(
  months: number = 6,
  types?: EventType[]
): Promise<EventFetchResult> {
  const now = new Date();
  
  // Check cache
  if (eventCache && eventCache.expiresAt > now) {
    let events = eventCache.events;
    if (types) {
      events = events.filter(e => types.includes(e.type));
    }
    return {
      events,
      source: 'cache',
      fetchedAt: eventCache.fetchedAt,
    };
  }
  
  // Fetch all events
  const allEvents: AstroEvent[] = [];
  const errors: string[] = [];
  
  try {
    const lunar = getLunarPhaseEvents(months);
    allEvents.push(...lunar);
  } catch (e) {
    errors.push(`Lunar events: ${e}`);
  }
  
  try {
    const meteors = getUpcomingMeteorShowers(months);
    allEvents.push(...meteors);
  } catch (e) {
    errors.push(`Meteor showers: ${e}`);
  }
  
  try {
    const eclipses = getUpcomingEclipses(months);
    allEvents.push(...eclipses);
  } catch (e) {
    errors.push(`Eclipses: ${e}`);
  }
  
  try {
    const comets = getBrightComets();
    allEvents.push(...comets);
  } catch (e) {
    errors.push(`Comets: ${e}`);
  }
  
  // Sort by date
  allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Update cache
  eventCache = {
    events: allEvents,
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + CACHE_DURATION_MS),
  };
  
  // Filter by type if specified
  let filteredEvents = allEvents;
  if (types) {
    filteredEvents = allEvents.filter(e => types.includes(e.type));
  }
  
  return {
    events: filteredEvents,
    source: 'aggregated',
    fetchedAt: now,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * Get events for a specific date range
 */
export async function getEventsInRange(
  startDate: Date,
  endDate: Date,
  types?: EventType[]
): Promise<AstroEvent[]> {
  const months = Math.ceil(
    (endDate.getTime() - new Date().getTime()) / (30 * 24 * 3600 * 1000)
  );
  
  const result = await getAllEvents(Math.max(1, months), types);
  
  return result.events.filter(
    e => e.date >= startDate && e.date <= endDate
  );
}

/**
 * Get events for tonight
 */
export async function getTonightEvents(): Promise<AstroEvent[]> {
  const now = new Date();
  const tonight = new Date(now);
  tonight.setHours(18, 0, 0, 0);
  
  const tomorrow = new Date(tonight);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);
  
  return getEventsInRange(tonight, tomorrow);
}

/**
 * Get events for this week
 */
export async function getThisWeekEvents(): Promise<AstroEvent[]> {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  
  return getEventsInRange(now, endOfWeek);
}

/**
 * Get highlight events (most important/visible)
 */
export async function getHighlightEvents(limit: number = 5): Promise<AstroEvent[]> {
  const result = await getAllEvents(6);
  
  // Score events by importance
  const scored = result.events.map(e => ({
    event: e,
    score: getEventScore(e),
  }));
  
  // Sort by score and return top events
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.event);
}

/**
 * Calculate event importance score
 */
function getEventScore(event: AstroEvent): number {
  let score = 0;
  
  // Type scoring
  switch (event.type) {
    case 'eclipse':
      score += 100;
      break;
    case 'comet':
      score += 80;
      break;
    case 'meteor':
      score += 60;
      break;
    case 'lunar':
      score += 20;
      break;
    default:
      score += 10;
  }
  
  // Visibility scoring
  switch (event.visibility) {
    case 'excellent':
      score += 50;
      break;
    case 'good':
      score += 30;
      break;
    case 'fair':
      score += 10;
      break;
  }
  
  // Time proximity (events closer in time score higher)
  const daysAway = (event.date.getTime() - Date.now()) / (24 * 3600 * 1000);
  if (daysAway < 7) score += 40;
  else if (daysAway < 30) score += 20;
  
  // Magnitude scoring for comets
  if (event.magnitude !== undefined) {
    if (event.magnitude < 0) score += 50;
    else if (event.magnitude < 4) score += 30;
    else if (event.magnitude < 6) score += 10;
  }
  
  return score;
}

/**
 * Clear event cache
 */
export function clearEventCache(): void {
  eventCache = null;
}
