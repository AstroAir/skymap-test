# tauri-api Module

[Root](../../CLAUDE.md) > [lib](../) > **tauri**

> **Last Updated:** 2026-02-01
> **Module Type:** TypeScript (Tauri IPC Wrapper)

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **tauri**`

---

## Module Responsibility

The `tauri` module provides TypeScript wrappers for all Tauri IPC commands. Each API file corresponds to a Rust backend module, offering type-safe interfaces for invoking Tauri commands from the frontend.

**Design Principle:** Thin wrappers that provide type safety and convenient async interfaces over Tauri's `invoke()` function.

---

## Module Structure

```
lib/tauri/
├── api.ts                    # Generic Tauri invoke wrapper
├── types.ts                  # Shared type definitions
├── hooks.ts                  # Custom React hooks
├── storage-api.ts            # Storage commands
├── astronomy-api.ts          # Astronomy calculation commands
├── events-api.ts             # Astro events commands
├── target-list-api.ts        # Target list commands
├── markers-api.ts            # Sky marker commands
├── geolocation-api.ts        # Geolocation commands
├── http-api.ts               # HTTP client commands
├── cache-api.ts              # Cache management commands
├── unified-cache-api.ts      # Unified cache commands
├── updater-api.ts            # Auto-update commands
├── updater-hooks.ts          # Update React hooks
├── app-control-api.ts        # App control commands
├── plate-solver-api.ts       # Plate solver commands
├── TauriSyncProvider.tsx     # Zustand sync provider component
├── index.ts                  # Module exports
└── __tests__/                # Unit tests
```

---

## Core API

### invoke()

The generic invoke wrapper that all other APIs use:

```typescript
import { invoke } from '@/lib/tauri/api';

async function callRustCommand<T>(command: string, args?: unknown): Promise<T> {
  return await invoke<T>(command, args);
}
```

**Usage:**

```typescript
const data = await invoke<DataType>('get_data', { id: 123 });
```

---

## Storage API

**File:** `storage-api.ts`

```typescript
// Generic storage operations
saveStoreData(storeName: string, data: string): Promise<void>
loadStoreData(storeName: string): Promise<string | null>
deleteStoreData(storeName: string): Promise<void>
listStores(): Promise<string[]>
getStorageStats(): Promise<StorageStats>
clearAllData(): Promise<void>
exportAllData(): Promise<ExportData>
importAllData(data: ExportData): Promise<void>
```

**Usage:**

```typescript
import { saveStoreData, loadStoreData } from '@/lib/tauri/storage-api';

await saveStoreData('my-store', JSON.stringify({ key: 'value' }));
const data = await loadStoreData('my-store');
```

---

## Astronomy API

**File:** `astronomy-api.ts`

```typescript
// Coordinate transforms
equatorialToHorizontal(ra: number, dec: number, lat: number, lon: number, timestamp: number): Promise<HorizontalCoords>
horizontalToEquatorial(alt: number, az: number, lat: number, lon: number, timestamp: number): Promise<EquatorialCoords>
equatorialToGalactic(ra: number, dec: number): Promise<GalacticCoords>
galacticToEquatorial(l: number, b: number): Promise<EquatorialCoords>

// Calculations
calculateVisibility(ra: number, dec: number, lat: number, lon: number): Promise<VisibilityInfo>
calculateTwilight(date: string, lat: number, lon: number): Promise<TwilightTimes>
calculateMoonPosition(lat: number, lon: number, timestamp: number): Promise<MoonPosition>
calculateSunPosition(lat: number, lon: number, timestamp: number): Promise<SunPosition>
calculateMoonPhase(timestamp: number): Promise<MoonPhase>
calculateFOV(params: FOVParams): Promise<FOVResult>

// Formatting
formatRAHMS(ra: number): Promise<string>
formatDecDMS(dec: number): Promise<string>
parseRAHMS(hms: string): Promise<number>
parseDecDMS(dms: string): Promise<number>
```

---

## Events API

**File:** `events-api.ts`

```typescript
getMoonPhasesForMonth(year: number, month: number): Promise<MoonPhase[]>
getMeteorShowers(year: number): Promise<MeteorShower[]>
getSeasonalEvents(year: number): Promise<SeasonalEvent[]>
getAstroEvents(year: number, month: number): Promise<AstroEvent[]>
getTonightHighlights(lat: number, lon: number): Promise<TonightHighlights>
```

---

## Target List API

**File:** `target-list-api.ts`

```typescript
// CRUD operations
loadTargetList(): Promise<Target[]>
saveTargetList(targets: Target[]): Promise<void>
addTarget(target: Target): Promise<void>
addTargetsBatch(targets: Target[]): Promise<void>
updateTarget(id: string, updates: Partial<Target>): Promise<void>
removeTarget(id: string): Promise<void>
removeTargetsBatch(ids: string[]): Promise<void>

// State management
setActiveTarget(id: string | null): Promise<void>
toggleTargetFavorite(id: string): Promise<void>
toggleTargetArchive(id: string): Promise<void>
setTargetsStatusBatch(ids: string[], status: TargetStatus): Promise<void>
setTargetsPriorityBatch(ids: string[], priority: TargetPriority): Promise<void>

// Tag management
addTagToTargets(tag: string, ids: string[]): Promise<void>
removeTagFromTargets(tag: string, ids: string[]): Promise<void>

// Bulk operations
archiveCompletedTargets(): Promise<void>
clearCompletedTargets(): Promise<void>
clearAllTargets(): Promise<void>

// Search and stats
searchTargets(query: string): Promise<Target[]>
getTargetStats(): Promise<TargetStats>
```

---

## Markers API

**File:** `markers-api.ts`

```typescript
// CRUD operations
loadMarkers(): Promise<Marker[]>
saveMarkers(markers: Marker[]): Promise<void>
addMarker(marker: Marker): Promise<void>
updateMarker(id: string, updates: Partial<Marker>): Promise<void>
removeMarker(id: string): Promise<void>
removeMarkersByGroup(groupName: string): Promise<void>
clearAllMarkers(): Promise<void>

// Visibility
toggleMarkerVisibility(id: string): Promise<void>
setAllMarkersVisible(visible: boolean): Promise<void>
setShowMarkers(show: boolean): Promise<void>
getVisibleMarkers(): Promise<Marker[]>

// Group management
addMarkerGroup(name: string, color: string): Promise<void>
removeMarkerGroup(name: string): Promise<void>
renameMarkerGroup(oldName: string, newName: string): Promise<void>
```

---

## HTTP API

**File:** `http-api.ts`

```typescript
// HTTP requests
httpGet(config: RequestConfig): Promise<HttpResponse>
httpPost(config: RequestConfig, body: string): Promise<HttpResponse>
httpHead(config: RequestConfig): Promise<HttpResponse>
httpRequest(config: RequestConfig, method: string, body?: string): Promise<HttpResponse>
httpCheckUrl(url: string): Promise<boolean>

// Downloads
httpDownload(url: string, path: string, config?: RequestConfig): Promise<DownloadProgress>
httpBatchDownload(items: DownloadItem[]): Promise<BatchDownloadResult>

// Request management
cancelRequest(id: string): Promise<void>
getActiveRequests(): Promise<RequestInfo[]>
httpCancelAllRequests(): Promise<void>

// Configuration
getHttpConfig(): Promise<HttpClientConfig>
setHttpConfig(config: HttpClientConfig): Promise<void>
```

---

## Cache API

**File:** `cache-api.ts`

```typescript
// Offline tile cache
getCacheStats(): Promise<CacheStats>
listCacheRegions(): Promise<CacheRegion[]>
createCacheRegion(region: CacheRegion): Promise<void>
updateCacheRegion(id: string, updates: Partial<CacheRegion>): Promise<void>
deleteCacheRegion(id: string): Promise<void>
saveCachedTile(tile: CachedTile): Promise<void>
loadCachedTile(surveyId: string, level: number, x: number, y: number): Promise<Blob | null>
isTileCached(surveyId: string, level: number, x: number, y: number): Promise<boolean>
clearSurveyCache(surveyId: string): Promise<void>
clearAllCache(): Promise<void>
getCacheDirectory(): Promise<string>
```

---

## Unified Cache API

**File:** `unified-cache-api.ts`

```typescript
// General-purpose cache
getUnifiedCacheEntry(key: string): Promise<string | null>
putUnifiedCacheEntry(key: string, value: string, ttl?: number): Promise<void>
deleteUnifiedCacheEntry(key: string): Promise<void>
clearUnifiedCache(): Promise<void>
getUnifiedCacheSize(): Promise<number>
listUnifiedCacheKeys(): Promise<string[]>
getUnifiedCacheStats(): Promise<CacheStats>
cleanupUnifiedCache(): Promise<number>

// Prefetch
prefetchUrl(url: string): Promise<void>
prefetchUrls(urls: string[]): Promise<void>
```

---

## Updater API

**File:** `updater-api.ts`

```typescript
checkForUpdate(): Promise<UpdateInfo>
downloadUpdate(): Promise<DownloadProgress>
installUpdate(): Promise<void>
downloadAndInstallUpdate(): Promise<DownloadProgress>
getCurrentVersion(): Promise<string>
clearPendingUpdate(): Promise<void>
hasPendingUpdate(): Promise<boolean>
```

---

## Hooks

**File:** `hooks.ts`, `updater-hooks.ts`

```typescript
// Custom hooks
useGeolocation(): GeolocationResult
useUpdateChecker(): UpdateCheckerResult
```

---

## Sync Provider

**File:** `TauriSyncProvider.tsx`

A React component that syncs Zustand stores with the Rust backend:

```typescript
<TauriSyncProvider>
  <App />
</TauriSyncProvider>
```

This component:
- Loads initial state from Rust storage on mount
- Persists store changes to Rust backend
- Handles sync conflicts and errors

---

## Type Definitions

**File:** `types.ts`

Common type definitions used across APIs:

```typescript
// Coordinates
interface EquatorialCoords {
  ra: number;
  dec: number;
}

interface HorizontalCoords {
  alt: number;
  az: number;
}

// Visibility
interface VisibilityInfo {
  isVisible: boolean;
  currentAltitude: number;
  currentAzimuth: number;
  isCircumpolar: boolean;
  neverRises: boolean;
  transitAltitude: number;
}

// Moon phase
interface MoonPhase {
  date: string;
  phase: string;
  illumination: number;
}
```

---

## Testing

Tests are in `__tests__/`:

```bash
# Run all tauri API tests
pnpm test lib/tauri

# Run specific test
pnpm test lib/tauri/__tests__/storage-api.test.ts
```

---

## Error Handling

All APIs throw errors that include:

- Error message from Rust backend
- Stack trace
- Command name that failed

**Usage pattern:**

```typescript
try {
  const data = await loadTargetList();
} catch (error) {
  console.error('Failed to load targets:', error);
  // Handle error (show toast, retry, etc.)
}
```

---

## Related Files

- [`index.ts`](./index.ts) - Module exports
- [`api.ts`](./api.ts) - Core invoke wrapper
- [`types.ts`](./types.ts) - Type definitions
- [`TauriSyncProvider.tsx`](./TauriSyncProvider.tsx) - Zustand sync provider
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
- [src-tauri/src/CLAUDE.md](../../src-tauri/src/CLAUDE.md) - Rust backend documentation
