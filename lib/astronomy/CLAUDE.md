# astronomy-calculations Module

[Root](../../CLAUDE.md) > [lib](../) > **astronomy**

> **Last Updated:** 2025-01-31
> **Module Type:** TypeScript (Pure Functions)

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **astronomy**`

---

## Module Responsibility

The `astronomy` module provides pure astronomical calculation functions with no side effects. These functions are used for coordinate transformations, time calculations, celestial body positions, visibility predictions, and imaging calculations.

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
console.log(`Moon Alt: ${moonPos.altitude.toFixed(1)}°`);
console.log(`Moon Az: ${moonPos.azimuth.toFixed(1)}°`);
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
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
- [src-tauri/src/astronomy/CLAUDE.md](../../src-tauri/src/astronomy/CLAUDE.md) - Rust astronomy module
