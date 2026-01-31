# frontend-services Module

[Root](../../CLAUDE.md) > [lib](../) > **services**

> **Last Updated:** 2025-01-31
> **Module Type:** TypeScript

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **services**`

---

## Module Responsibility

The `services` module provides service classes for external API integration. These services fetch astronomical data from online sources including object info, sky surveys, satellite data, and geocoding.

**Design Principle:** Services abstract away HTTP requests and provide typed responses with error handling.

---

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `astro_events/` | Moon phases, meteor showers, astronomical events |
| `hips/` | HiPS (Hierarchical Progressive Survey) service |
| `object-info/` | Object information from online sources |
| `satellite/` | Satellite TLE data and pass predictions |

---

## Services

### astro_events/

```typescript
class AstroEventsService {
  getMoonPhases(year: number, month: number): Promise<MoonPhase[]>
  getMeteorShowers(year: number): Promise<MeteorShower[]>
  getSeasonalEvents(year: number): Promise<SeasonalEvent[]>
  getTonightHighlights(lat: number, lon: number): Promise<TonightHighlights>
}
```

### hips/

```typescript
class HiPSService {
  getAvailableSurveys(): Promise<SurveyInfo[]>
  getSurveyTile(surveyId: string, level: number, x: number, y: number): Promise<Blob>
  getSurveyMetadata(surveyId: string): Promise<SurveyMetadata>
}
```

### object-info/

```typescript
class ObjectInfoService {
  getObjectInfo(name: string): Promise<ObjectInfo>
  searchObjects(query: string): Promise<ObjectSearchResult[]>
  getImageUrls(objectName: string): Promise<string[]>
}
```

### satellite/

```typescript
class SatelliteService {
  getTleData(satelliteId: string): Promise<TLEData>
  getPasses(lat: number, lon: number, startTime: Date): Promise<SatellitePass[]>
  getSatelliteCatalog(): Promise<SatelliteInfo[]>
}
```

---

## Standalone Services

| Service | File | Purpose |
|---------|------|---------|
| `geocoding-service.ts` | Forward/reverse geocoding |
| `online-search-service.ts` | Online object search |
| `connectivity-checker.ts` | Network connectivity detection |
| `satellite-propagator.ts` | Satellite position calculation |
| `celestial-icons.ts` | Celestial object icon mapping |
| `http-fetch.ts` | HTTP fetch utilities |
| `map-config.ts` | Map provider configuration |

---

## Data Types

### Event Types

```typescript
interface MoonPhase {
  date: Date;
  phase: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' |
           'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
  illumination: number;
}

interface MeteorShower {
  name: string;
  peakDate: Date;
  zenithalHourlyRate: number;
  parentBody: string;
}
```

### Object Info Types

```typescript
interface ObjectInfo {
  name: string;
  objectType: string;
  ra: number;
  dec: number;
  magnitude: number;
  size: string;
  constellation: string;
  description: string;
  imageUrl?: string;
}
```

### Satellite Types

```typescript
interface SatellitePass {
  satelliteId: string;
  riseTime: Date;
  setTime: Date;
  maxAltitude: number;
  maxAzimuth: number;
  magnitude: number;
}

interface TLEData {
  line1: string;
  line2: string;
  epoch: Date;
}
```

---

## Usage Examples

### Get Moon Phases

```typescript
import { AstroEventsService } from '@/lib/services/astro-events';

const service = new AstroEventsService();
const phases = await service.getMoonPhases(2025, 1);
```

### Search Objects

```typescript
import { ObjectInfoService } from '@/lib/services/object-info';

const service = new ObjectInfoService();
const results = await service.searchObjects('M31');
```

### Get Satellite Passes

```typescript
import { SatelliteService } from '@/lib/services/satellite';

const service = new SatelliteService();
const passes = await service.getPasses(40.7128, -74.0060, new Date());
```

---

## Testing

Tests are located in `lib/services/__tests__/`:

```bash
pnpm test lib/services
```

---

## Related Files

- [`index.ts`](./index.ts) - Module exports
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
