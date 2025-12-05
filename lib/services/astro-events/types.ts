/**
 * Astronomical event types
 */

// ============================================================================
// Base Event Types
// ============================================================================

export type EventType = 'lunar' | 'meteor' | 'eclipse' | 'comet' | 'conjunction' | 'other';

export interface AstroEvent {
  id: string;
  type: EventType;
  name: string;
  date: Date;
  endDate?: Date;
  description: string;
  magnitude?: number;
  ra?: number;
  dec?: number;
  constellation?: string;
  visibility?: 'excellent' | 'good' | 'fair' | 'poor';
  source: string;
}

// ============================================================================
// Lunar Events
// ============================================================================

export interface LunarPhaseEvent extends AstroEvent {
  type: 'lunar';
  phase: 'new' | 'firstQuarter' | 'full' | 'lastQuarter';
  illumination: number;
}

export interface LunarEclipse extends AstroEvent {
  type: 'eclipse';
  eclipseType: 'total' | 'partial' | 'penumbral';
  duration?: number;
  maxEclipse?: Date;
}

// ============================================================================
// Meteor Showers
// ============================================================================

export interface MeteorShower extends AstroEvent {
  type: 'meteor';
  zhr: number; // Zenithal Hourly Rate
  peakDate: Date;
  radiantRa: number;
  radiantDec: number;
  velocity: number; // km/s
  parentBody?: string;
  active: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Eclipses
// ============================================================================

export interface SolarEclipse extends AstroEvent {
  type: 'eclipse';
  eclipseType: 'total' | 'annular' | 'partial' | 'hybrid';
  pathWidth?: number; // km
  duration?: number; // seconds
  maxEclipse?: Date;
}

// ============================================================================
// Comets
// ============================================================================

export interface CometEvent extends AstroEvent {
  type: 'comet';
  cometName: string;
  perihelionDate?: Date;
  perihelionDistance?: number; // AU
  expectedMagnitude: number;
  tailLength?: number; // arcminutes
}

// ============================================================================
// Data Source Config
// ============================================================================

export interface EventDataSource {
  id: string;
  name: string;
  url: string;
  type: EventType[];
  enabled: boolean;
  lastFetch?: Date;
  cacheMinutes: number;
}

// ============================================================================
// Fetch Result
// ============================================================================

export interface EventFetchResult {
  events: AstroEvent[];
  source: string;
  fetchedAt: Date;
  error?: string;
}
