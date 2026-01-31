# starmap-ui Module

[Root](../../CLAUDE.md) > [components](../) > **starmap**

> **Last Updated:** 2025-01-31
> **Module Type:** React Components (TSX)

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [components](../) > **starmap**`

---

## Module Responsibility

The `starmap` module contains all UI components for the star map interface. It is organized by feature into subdirectories, each containing related components and their tests.

---

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `canvas/` | Stellarium Web Engine canvas wrapper and integration |
| `view/` | Main sky view component that orchestrates the canvas and overlays |
| `search/` | Object search, advanced search, and favorites quick access |
| `settings/` | Settings panels and configuration dialogs |
| `controls/` | Zoom controls, navigation history, bookmarks, keyboard shortcuts |
| `time/` | Time control and clock display |
| `overlays/` | FOV simulator, satellite tracker, ocular simulator, sky markers |
| `planning/` | Altitude charts, exposure calculator, session planning |
| `objects/` | Object info panels, detail drawers, image galleries |
| `management/` | Equipment, location, cache, and data managers |
| `dialogs/` | About, credits, keyboard shortcuts dialogs |
| `onboarding/` | Welcome dialog and tour components |
| `setup-wizard/` | First-time setup wizard |
| `plate-solving/` | Image capture and plate solving |
| `feedback/` | Loading skeletons and splash screens |
| `mount/` | Telescope mount control |
| `map/` | Leaflet-based location picker |

---

## Entry Point

**File:** `index.ts`

All components are exported from the index for convenient importing:

```typescript
import {
  StellariumCanvas,
  StellariumView,
  StellariumSearch,
  ZoomControls,
  FOVSimulator,
  // ... etc
} from '@/components/starmap';
```

---

## Key Components

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| `StellariumCanvas` | `canvas/stellarium-canvas.tsx` | Wraps Stellarium Web Engine canvas |
| `StellariumView` | `view/stellarium-view.tsx` | Main view container |
| `StellariumSearch` | `search/stellarium-search.tsx` | Object search component |

### Overlays

| Component | File | Description |
|-----------|------|-------------|
| `FOVSimulator` | `overlays/fov-simulator.tsx` | Field of view simulator |
| `SatelliteTracker` | `overlays/satellite-tracker.tsx` | Satellite position tracking |
| `OcularSimulator` | `overlays/ocular-simulator.tsx` | Eyepiece view simulation |
| `SkyMarkers` | `overlays/sky-markers.tsx` | Custom marker overlay |

### Planning

| Component | File | Description |
|-----------|------|-------------|
| `AltitudeChart` | `planning/altitude-chart.tsx` | Target altitude over time |
| `ExposureCalculator` | `planning/exposure-calculator.tsx` | Astrophotography exposure |
| `AstroSessionPanel` | `planning/astro-session-panel.tsx` | Session planning panel |

### Objects

| Component | File | Description |
|-----------|------|-------------|
| `InfoPanel` | `objects/info-panel.tsx` | Selected object information |
| `ObjectDetailDrawer` | `objects/object-detail-drawer.tsx` | Detail side panel |
| `ObjectImageGallery` | `objects/object-image-gallery.tsx` | Object image viewer |

### Management

| Component | File | Description |
|-----------|------|-------------|
| `EquipmentManager` | `management/equipment-manager.tsx` | Equipment configuration |
| `LocationManager` | `management/location-manager.tsx` | Observing location setup |
| `OfflineCacheManager` | `management/offline-cache-manager.tsx` | Offline tile cache |

---

## Data Flow

```
User Interaction
       ↓
Component Event Handler
       ↓
Zustand Store Update
       ↓
Tauri API Call (if needed)
       ↓
Rust Backend Command
       ↓
State Update & Re-render
```

---

## Testing

Tests are located in `__tests__/` subdirectories within each feature directory:

```bash
# Run all starmap tests
pnpm test components/starmap

# Run specific test
pnpm test components/starmap/view/__tests__/stellarium-view.test.tsx
```

---

## Common Patterns

### Using Translations

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('starmap');
  return <div>{t('title')}</div>;
}
```

### Using Stores

```typescript
import { useSettingsStore } from '@/lib/stores/settings-store';

function MyComponent() {
  const { stellarium, setStellariumSetting } = useSettingsStore();
  return <button onClick={() => setStellariumSetting('nightMode', true)}>;
}
```

### Styling

```typescript
import { cn } from '@/lib/utils';

function MyComponent({ className }: { className?: string }) {
  return <div className={cn('base-styles', className)} />;
}
```

---

## Related Files

- [`index.ts`](./index.ts) - Module exports
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
- [lib/stores/CLAUDE.md](../../lib/stores/CLAUDE.md) - State management
