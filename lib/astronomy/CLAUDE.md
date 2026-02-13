# astronomy-calculations Module

[Root](../../CLAUDE.md) > [lib](../) > **astronomy**

> **Last Updated:** 2026-02-13
> **Module Type:** TypeScript (Pure Functions)

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **astronomy**`

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-02-13 | Added mount-safety.ts and mount-simulator.ts documentation |
| 2025-01-31 | Initial documentation |

---

## Module Responsibility

The `astronomy` module provides pure astronomical calculation functions with no side effects. These functions are used for coordinate transformations, time calculations, celestial body positions, visibility predictions, imaging calculations, and mount safety analysis.

**Design Principle:** All functions are pure - they take inputs and return outputs without modifying external state or making I/O operations.

---

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `coordinates/` | Coordinate system conversions |
| `time/` | Time calculations (Julian date, sidereal time) |
| `celestial/` | Sun and Moon position calculations |
| `visibility/` | Target visibility and circumpolar calculations |
| `twilight/` | Twilight time calculations |
| `imaging/` | Astrophotography exposure and feasibility |

---

## Top-Level Modules

| File | Purpose |
|------|---------|
| `mount-safety.ts` | GEM mount safety configuration and checks |
| `mount-simulator.ts` | Sequence simulation for mount safety analysis |

---

## Key Functions

### coordinates/

```typescript
// Convert equatorial (RA/Dec) to horizontal (Alt/Az)
equatorialToHorizontal(ra, dec, latitude, longitude, timestamp): HorizontalCoords

// Convert horizontal to equatorial
horizontalToEquatorial(alt, az, latitude, longitude, timestamp): EquatorialCoords

// Convert equatorial to galactic
equatorialToGalactic(ra, dec): GalacticCoords

// Convert galactic to equatorial
galacticToEquatorial(l, b): EquatorialCoords

// Format RA as HMS string
formatRAHMS(raDegrees): string

// Format Dec as DMS string
formatDecDMS(decDegrees): string
```

### time/

```typescript
// Convert DateTime to Julian Date
datetimeToJD(dt): number

// Convert NaiveDate to Julian Date
dateToJD(date): number

// Calculate Greenwich Mean Sidereal Time
calculateGMST(jd): number

// Calculate Local Sidereal Time
calculateLST(jd, longitude): number
```

### celestial/

```typescript
// Calculate sun position
calculateSunPosition(latitude, longitude, timestamp): SunPosition

// Calculate moon position
calculateMoonPosition(latitude, longitude, timestamp): MoonPosition

// Calculate moon phase
calculateMoonPhase(timestamp): MoonPhase

// Calculate angular separation between two objects
angularSeparation(ra1, dec1, ra2, dec2): number
```

### visibility/

```typescript
// Calculate target visibility information
calculateVisibility(ra, dec, latitude, longitude, timestamp, minAltitude): VisibilityInfo

// Check if target is circumpolar
isCircumpolar(dec, latitude): boolean

// Calculate transit altitude
calculateTransitAltitude(dec, latitude): number
```

### twilight/

```typescript
// Calculate twilight times for a date
calculateTwilight(date, latitude, longitude): TwilightTimes

// Calculate sun rise/set times
calculateSunriseSunset(date, latitude, longitude): { sunrise: number, sunset: number }
```

### imaging/

```typescript
// Calculate field of view
calculateFOV(sensorWidth, sensorHeight, focalLength, pixelSize, aperture): FOVResult

// Calculate exposure time
calculateExposure(objectMagnitude, focalRatio, iso, sensorGain): number

// Calculate imaging feasibility
isImagingFeasible(target, conditions, equipment): boolean
```

---

## Mount Safety Module (mount-safety.ts)

Pure functions for detecting potential equipment damage risks when running an equatorial mount through a target sequence.

### Types

```typescript
type MountType = 'gem' | 'fork' | 'altaz';

interface MeridianFlipConfig {
  enabled: boolean;
  minutesAfterMeridian: number;    // Default 5
  maxMinutesAfterMeridian: number; // Default 15
  pauseBeforeMeridian: number;     // Default 0
}

interface MountSafetyConfig {
  mountType: MountType;
  hourAngleLimitEast: number;      // Default -90
  hourAngleLimitWest: number;      // Default 90
  declinationLimitMin: number;     // Default -85
  declinationLimitMax: number;     // Default 85
  minAltitude: number;             // Default 15
  meridianFlip: MeridianFlipConfig;
  telescopeLength: number;         // mm, default 500
  counterweightBarLength: number;  // mm, default 300
}

type SafetyIssueSeverity = 'info' | 'warning' | 'danger';

type SafetyIssueType =
  | 'meridian_flip'
  | 'hour_angle_limit'
  | 'dec_limit'
  | 'below_horizon'
  | 'counterweight_up'
  | 'cable_wrap'
  | 'pier_collision'
  | 'slew_through_pole';

interface SafetyIssue {
  type: SafetyIssueType;
  severity: SafetyIssueSeverity;
  targetId: string;
  targetName: string;
  time: Date;
  descriptionKey: string;
  suggestionKey: string;
  hourAngle?: number;
  altitude?: number;
  pierSide?: 'east' | 'west';
}

interface TargetSafetyCheck {
  targetId: string;
  targetName: string;
  ra: number;
  dec: number;
  startTime: Date;
  endTime: Date;
  pierSideAtStart: 'east' | 'west';
  pierSideAtEnd: 'east' | 'west';
  hourAngleAtStart: number;
  hourAngleAtEnd: number;
  minAltitude: number;
  maxAltitude: number;
  needsMeridianFlip: boolean;
  meridianFlipTime: Date | null;
  issues: SafetyIssue[];
  isSafe: boolean;
}
```

### Key Functions

```typescript
// Calculate Local Sidereal Time
getLSTAtTime(date: Date, longitude: number): number

// Calculate hour angle in degrees
calculateHourAngleAtTime(raDeg: number, longitude: number, time: Date): number

// Calculate altitude at specific time
calculateAltitudeAtTime(raDeg: number, decDeg: number, latitude: number, longitude: number, time: Date): number

// Determine pier side from hour angle (GEM)
determinePierSide(hourAngleDeg: number): 'east' | 'west'

// Get meridian crossing time
getMeridianCrossingTime(raDeg: number, longitude: number, afterTime: Date): Date

// Get meridian flip time
getMeridianFlipTime(raDeg: number, longitude: number, config: MountSafetyConfig, afterTime: Date): Date | null

// Check hour angle limits
checkHourAngleLimits(hourAngleDeg: number, config: MountSafetyConfig): { exceeded: boolean; side: 'east' | 'west' | null }

// Check declination limits
checkDeclinationLimits(decDeg: number, config: MountSafetyConfig): boolean

// Check altitude safety
checkAltitudeSafety(altitude: number, config: MountSafetyConfig): boolean

// Check counterweight-up condition
checkCounterweightUp(hourAngleDeg: number, pierSide: 'east' | 'west'): boolean

// Check meridian flip needed
checkMeridianFlipNeeded(raDeg: number, longitude: number, startTime: Date, endTime: Date, config: MountSafetyConfig): { needed: boolean; flipTime: Date | null; crossingTime: Date | null }

// Check pier collision risk
checkPierCollisionRisk(hourAngleDeg: number, decDeg: number, latitude: number, config: MountSafetyConfig): boolean

// Comprehensive single-target safety check
checkTargetSafety(targetId: string, targetName: string, raDeg: number, decDeg: number, startTime: Date, endTime: Date, latitude: number, longitude: number, config: MountSafetyConfig, sampleIntervalMinutes?: number): TargetSafetyCheck
```

### Usage

```typescript
import {
  checkTargetSafety,
  DEFAULT_MOUNT_SAFETY_CONFIG,
  type MountSafetyConfig,
  type TargetSafetyCheck
} from '@/lib/astronomy/mount-safety';

const config: MountSafetyConfig = {
  ...DEFAULT_MOUNT_SAFETY_CONFIG,
  minAltitude: 30,
  meridianFlip: {
    enabled: true,
    minutesAfterMeridian: 5,
    maxMinutesAfterMeridian: 15,
    pauseBeforeMeridian: 0
  }
};

const check: TargetSafetyCheck = checkTargetSafety(
  'm31',
  'Andromeda Galaxy',
  10.684,    // RA in degrees
  41.269,    // Dec in degrees
  new Date('2026-02-13T20:00:00'),
  new Date('2026-02-13T23:00:00'),
  40.7128,   // Latitude
  -74.0060,  // Longitude
  config
);

if (!check.isSafe) {
  console.log('Safety issues:', check.issues);
}
```

---

## Mount Simulator Module (mount-simulator.ts)

Simulates running an equatorial mount through a target sequence, detecting all potential safety issues before actual execution.

### Types

```typescript
interface SimulationTarget {
  id: string;
  name: string;
  ra: number;
  dec: number;
  startTime: Date;
  endTime: Date;
  exposureDuration?: number;  // Seconds per sub-frame
}

interface SlewEvent {
  fromTargetId: string;
  fromTargetName: string;
  toTargetId: string;
  toTargetName: string;
  time: Date;
  raSlewAngle: number;        // Degrees
  decSlewAngle: number;       // Degrees
  totalAngle: number;         // Degrees
  estimatedDuration: number;  // Seconds
  hasMeridianFlip: boolean;
  issues: SafetyIssue[];
}

interface SimulationSummary {
  safe: number;
  warnings: number;
  dangers: number;
}

interface SimulationResult {
  targets: TargetSafetyCheck[];
  slews: SlewEvent[];
  allIssues: SafetyIssue[];
  overallSafe: boolean;
  totalMeridianFlips: number;
  totalSlewTime: number;      // Seconds
  cumulativeRotation: number; // Degrees (for cable wrap detection)
  cableWrapRisk: boolean;
  summary: SimulationSummary;
}
```

### Key Function

```typescript
// Run full sequence simulation
simulateSequence(
  targets: SimulationTarget[],
  config: MountSafetyConfig,
  latitude: number,
  longitude: number,
  startPierSide?: 'east' | 'west'
): SimulationResult
```

### Usage

```typescript
import {
  simulateSequence,
  type SimulationTarget,
  type SimulationResult
} from '@/lib/astronomy/mount-simulator';
import { DEFAULT_MOUNT_SAFETY_CONFIG } from '@/lib/astronomy/mount-safety';

const targets: SimulationTarget[] = [
  {
    id: 'm31',
    name: 'Andromeda Galaxy',
    ra: 10.684,
    dec: 41.269,
    startTime: new Date('2026-02-13T20:00:00'),
    endTime: new Date('2026-02-13T22:00:00')
  },
  {
    id: 'm42',
    name: 'Orion Nebula',
    ra: 83.822,
    dec: -5.391,
    startTime: new Date('2026-02-13T22:30:00'),
    endTime: new Date('2026-02-14T00:30:00')
  }
];

const result: SimulationResult = simulateSequence(
  targets,
  DEFAULT_MOUNT_SAFETY_CONFIG,
  40.7128,  // Latitude
  -74.0060  // Longitude
);

console.log('Overall safe:', result.overallSafe);
console.log('Total issues:', result.allIssues.length);
console.log('Meridian flips:', result.totalMeridianFlips);
console.log('Total slew time:', result.totalSlewTime, 'seconds');

if (result.cableWrapRisk) {
  console.warn('Cable wrap risk detected!');
}
```

---

## Data Types

### Common Types

```typescript
interface EquatorialCoords {
  ra: number;   // Right Ascension in degrees (0-360)
  dec: number;  // Declination in degrees (-90 to +90)
}

interface HorizontalCoords {
  alt: number;  // Altitude in degrees (-90 to +90)
  az: number;   // Azimuth in degrees (0-360, N=0, E=90)
}

interface GalacticCoords {
  l: number;    // Galactic longitude in degrees
  b: number;    // Galactic latitude in degrees
}

interface VisibilityInfo {
  isVisible: boolean;
  currentAltitude: number;
  currentAzimuth: number;
  isCircumpolar: boolean;
  neverRises: boolean;
  hoursVisible: number;
  transitAltitude: number;
}
```

---

## Usage Examples

### Calculate Moon Position

```typescript
import { calculateMoonPosition } from '@/lib/astronomy/celestial';

const moonPos = calculateMoonPosition(40.7128, -74.0060, Date.now());
console.log(`Moon Alt: ${moonPos.altitude.toFixed(1)} deg`);
console.log(`Moon Az: ${moonPos.azimuth.toFixed(1)} deg`);
```

### Check Target Visibility

```typescript
import { calculateVisibility } from '@/lib/astronomy/visibility';

const visibility = calculateVisibility(
  83.633,  // RA of M31 (degrees)
  22.014,  // Dec of M31 (degrees)
  40.7128, // Latitude
  -74.0060 // Longitude
);

if (visibility.isVisible) {
  console.log('M31 is visible now');
}
```

---

## Testing

Tests are located in `__tests__/` subdirectories:

```bash
# Run all astronomy tests
pnpm test lib/astronomy

# Run specific test
pnpm test lib/astronomy/coordinates/__tests__/transforms.test.ts
pnpm test lib/astronomy/__tests__/mount-safety.test.ts
```

---

## Notes

- All calculations are self-contained and don't require external API calls
- For heavy calculations, consider using the Rust backend via `src-tauri/src/astronomy/`
- Functions use degrees for angles (not radians) for API consistency
- Timestamps should be Unix milliseconds

---

## Related Files

- [`index.ts`](./index.ts) - Module exports
- [`mount-safety.ts`](./mount-safety.ts) - Mount safety configuration and checks
- [`mount-simulator.ts`](./mount-simulator.ts) - Sequence simulation for mount safety
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
- [src-tauri/src/astronomy/CLAUDE.md](../../src-tauri/src/astronomy/CLAUDE.md) - Rust astronomy module
