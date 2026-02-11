export interface CelestialPosition {
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
  angularSize?: number;
  altitude: number;
  azimuth: number;
  transitTime: Date | null;
  maxElevation: number;
  elongation?: number;
  constellation?: string;
}

export interface EphemerisEntry {
  date: Date;
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  magnitude?: number;
  phase?: number;
  distance?: number;
  elongation?: number;
}

export interface WUTObject {
  name: string;
  type: string;
  ra: number;
  dec: number;
  magnitude?: number;
  riseTime: Date | null;
  transitTime: Date | null;
  setTime: Date | null;
  maxElevation: number;
  angularSize?: number;
  constellation?: string;
  score: number;
}

export interface PhenomenaEvent {
  date: Date;
  type: 'conjunction' | 'opposition' | 'elongation' | 'occultation' | 'close_approach';
  object1: string;
  object2?: string;
  separation?: number;
  details: string;
  importance: 'high' | 'medium' | 'low';
}
