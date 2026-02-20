/**
 * Astronomical event conversion utilities
 * Extracted from components/starmap/planning/astro-events-calendar.tsx
 */

import type { AstroEvent, EventType } from '@/lib/services/astro-data-sources';
import { createLogger } from '@/lib/logger';

const logger = createLogger('event-utils');

// ============================================================================
// Event Type Mapping
// ============================================================================

/**
 * Map a Tauri event type string to the canonical EventType
 */
export function mapEventType(t: string): EventType {
  if (t.includes('moon')) return 'lunar_phase';
  if (t.includes('eclipse')) return 'eclipse';
  if (t.includes('meteor')) return 'meteor_shower';
  if (t.includes('conjunction')) return 'planet_conjunction';
  if (t.includes('opposition')) return 'planet_opposition';
  if (t.includes('elongation')) return 'planet_elongation';
  if (t.includes('equinox') || t.includes('solstice')) return 'equinox_solstice';
  logger.warn('Unknown Tauri event type, defaulting to "other"', { eventType: t });
  return 'other';
}

// ============================================================================
// Tauri Event Conversion
// ============================================================================

interface TauriEventItem {
  id: string;
  event_type: string;
  name: string;
  date: string;
  time?: string | null;
  timestamp?: number;
  description: string;
  visibility?: string | null;
  magnitude?: number | null;
  details?: Record<string, unknown> | null;
}

function parseTauriDate(event: TauriEventItem): Date {
  if (typeof event.timestamp === 'number' && Number.isFinite(event.timestamp)) {
    return new Date(event.timestamp * 1000);
  }

  if (event.time && event.time.length > 0) {
    const parsedWithTime = new Date(`${event.date}T${event.time}Z`);
    if (!Number.isNaN(parsedWithTime.getTime())) return parsedWithTime;
  }

  const parsedDate = new Date(event.date);
  if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  return new Date();
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

/**
 * Convert Tauri desktop events to the canonical AstroEvent format
 */
export function convertTauriEvents(tauriEventList: TauriEventItem[]): AstroEvent[] {
  return tauriEventList.map(e => ({
    id: e.id,
    type: mapEventType(e.event_type),
    name: e.name,
    date: parseTauriDate(e),
    endDate: parseOptionalDate(e.details?.ends_at) ?? parseOptionalDate(e.details?.active_end),
    description: e.description,
    visibility: (e.visibility || 'good') as 'excellent' | 'good' | 'fair' | 'poor',
    magnitude: e.magnitude ?? undefined,
    source: 'Desktop',
  }));
}
