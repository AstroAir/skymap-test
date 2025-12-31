/**
 * Custom Horizon Support
 * Allows users to define custom horizons based on local obstructions
 * Ported from NINA's CustomHorizon implementation
 */

export interface HorizonPoint {
  azimuth: number;  // 0-360 degrees
  altitude: number; // degrees above horizon
}

export interface CustomHorizonData {
  name: string;
  points: HorizonPoint[];
  interpolated: Map<number, number>; // azimuth -> altitude lookup
}

/**
 * Custom Horizon class for handling local horizon obstructions
 * Based on NINA's CustomHorizon implementation
 */
export class CustomHorizon {
  private name: string;
  private points: HorizonPoint[];
  private altitudeMap: Map<number, number>;
  private sortedAzimuths: number[];

  constructor(name: string = 'Custom Horizon') {
    this.name = name;
    this.points = [];
    this.altitudeMap = new Map();
    this.sortedAzimuths = [];
  }

  /**
   * Get horizon altitude at a specific azimuth
   * Uses linear interpolation between defined points
   */
  getAltitude(azimuth: number): number {
    // Normalize azimuth to 0-360 range
    azimuth = ((azimuth % 360) + 360) % 360;

    if (this.sortedAzimuths.length === 0) {
      return 0; // No horizon defined, return 0
    }

    if (this.sortedAzimuths.length === 1) {
      return this.altitudeMap.get(this.sortedAzimuths[0]) ?? 0;
    }

    // Find surrounding points for interpolation
    let lowerIdx = -1;
    let upperIdx = -1;

    for (let i = 0; i < this.sortedAzimuths.length; i++) {
      if (this.sortedAzimuths[i] <= azimuth) {
        lowerIdx = i;
      }
      if (this.sortedAzimuths[i] >= azimuth && upperIdx === -1) {
        upperIdx = i;
      }
    }

    // Handle wrap-around case
    if (lowerIdx === -1) {
      lowerIdx = this.sortedAzimuths.length - 1;
    }
    if (upperIdx === -1) {
      upperIdx = 0;
    }

    const lowerAz = this.sortedAzimuths[lowerIdx];
    const upperAz = this.sortedAzimuths[upperIdx];
    const lowerAlt = this.altitudeMap.get(lowerAz) ?? 0;
    const upperAlt = this.altitudeMap.get(upperAz) ?? 0;

    // Handle exact match
    if (lowerAz === upperAz || lowerIdx === upperIdx) {
      return lowerAlt;
    }

    // Linear interpolation
    let azRange = upperAz - lowerAz;
    if (azRange < 0) {
      azRange += 360; // Handle wrap-around
    }

    let azOffset = azimuth - lowerAz;
    if (azOffset < 0) {
      azOffset += 360;
    }

    const fraction = azOffset / azRange;
    return lowerAlt + fraction * (upperAlt - lowerAlt);
  }

  /**
   * Check if a target at given altitude and azimuth is above the horizon
   */
  isAboveHorizon(altitude: number, azimuth: number): boolean {
    const horizonAlt = this.getAltitude(azimuth);
    return altitude > horizonAlt;
  }

  /**
   * Add a point to the horizon definition
   */
  addPoint(azimuth: number, altitude: number): void {
    // Normalize azimuth
    azimuth = ((azimuth % 360) + 360) % 360;
    
    // Remove existing point at this azimuth if any
    this.points = this.points.filter(p => Math.abs(p.azimuth - azimuth) > 0.001);
    
    this.points.push({ azimuth, altitude });
    this.rebuildLookup();
  }

  /**
   * Set all horizon points at once
   */
  setPoints(points: HorizonPoint[]): void {
    this.points = points.map(p => ({
      azimuth: ((p.azimuth % 360) + 360) % 360,
      altitude: p.altitude,
    }));
    this.rebuildLookup();
  }

  /**
   * Clear all horizon points
   */
  clear(): void {
    this.points = [];
    this.altitudeMap.clear();
    this.sortedAzimuths = [];
  }

  /**
   * Get all horizon points
   */
  getPoints(): HorizonPoint[] {
    return [...this.points].sort((a, b) => a.azimuth - b.azimuth);
  }

  /**
   * Check if horizon has any points defined
   */
  hasPoints(): boolean {
    return this.points.length > 0;
  }

  /**
   * Get number of defined points
   */
  get pointCount(): number {
    return this.points.length;
  }

  /**
   * Get horizon name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Set horizon name
   */
  setName(name: string): void {
    this.name = name;
  }

  /**
   * Rebuild internal lookup structures after points change
   */
  private rebuildLookup(): void {
    this.altitudeMap.clear();
    for (const point of this.points) {
      this.altitudeMap.set(point.azimuth, point.altitude);
    }
    this.sortedAzimuths = [...this.altitudeMap.keys()].sort((a, b) => a - b);
  }

  /**
   * Export horizon data for serialization
   */
  toJSON(): CustomHorizonData {
    return {
      name: this.name,
      points: this.getPoints(),
      interpolated: this.altitudeMap,
    };
  }

  /**
   * Create CustomHorizon from serialized data
   */
  static fromJSON(data: Partial<CustomHorizonData>): CustomHorizon {
    const horizon = new CustomHorizon(data.name ?? 'Custom Horizon');
    if (data.points) {
      horizon.setPoints(data.points);
    }
    return horizon;
  }

  /**
   * Generate horizon altitude data for a full 360° chart
   * @param resolution Number of points to generate (default 360 = 1° resolution)
   */
  generateChartData(resolution: number = 360): Array<{ azimuth: number; altitude: number }> {
    const data: Array<{ azimuth: number; altitude: number }> = [];
    const step = 360 / resolution;
    
    for (let az = 0; az < 360; az += step) {
      data.push({
        azimuth: az,
        altitude: this.getAltitude(az),
      });
    }
    
    return data;
  }
}

/**
 * Parse horizon file content
 * Supports common formats:
 * - CSV: azimuth,altitude
 * - Space/tab separated: azimuth altitude
 * - NINA format compatibility
 */
export function parseHorizonFile(content: string): HorizonPoint[] {
  const lines = content.split(/\r?\n/);
  const points: HorizonPoint[] = [];
  
  for (const line of lines) {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }
    
    // Try different separators
    let parts: string[] = [];
    if (trimmed.includes(',')) {
      parts = trimmed.split(',');
    } else if (trimmed.includes('\t')) {
      parts = trimmed.split('\t');
    } else {
      parts = trimmed.split(/\s+/);
    }
    
    if (parts.length >= 2) {
      const azimuth = parseFloat(parts[0]);
      const altitude = parseFloat(parts[1]);
      
      if (!isNaN(azimuth) && !isNaN(altitude)) {
        points.push({ azimuth, altitude });
      }
    }
  }
  
  return points;
}

/**
 * Export horizon to file content
 */
export function exportHorizonFile(horizon: CustomHorizon): string {
  const lines = ['# Custom Horizon File', '# Format: azimuth,altitude', ''];
  
  for (const point of horizon.getPoints()) {
    lines.push(`${point.azimuth.toFixed(1)},${point.altitude.toFixed(1)}`);
  }
  
  return lines.join('\n');
}

/**
 * Create a simple flat horizon
 */
export function createFlatHorizon(altitude: number = 0): CustomHorizon {
  const horizon = new CustomHorizon('Flat Horizon');
  horizon.setPoints([
    { azimuth: 0, altitude },
    { azimuth: 90, altitude },
    { azimuth: 180, altitude },
    { azimuth: 270, altitude },
  ]);
  return horizon;
}

/**
 * Create a sample horizon with common obstructions
 */
export function createSampleHorizon(): CustomHorizon {
  const horizon = new CustomHorizon('Sample Horizon');
  horizon.setPoints([
    { azimuth: 0, altitude: 10 },     // North - trees
    { azimuth: 45, altitude: 5 },
    { azimuth: 90, altitude: 0 },     // East - clear
    { azimuth: 135, altitude: 0 },
    { azimuth: 180, altitude: 15 },   // South - building
    { azimuth: 225, altitude: 20 },
    { azimuth: 270, altitude: 5 },    // West - trees
    { azimuth: 315, altitude: 8 },
  ]);
  return horizon;
}
