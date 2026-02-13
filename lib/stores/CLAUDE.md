# state-management Module

[Root](../../CLAUDE.md) > [lib](../) > **stores**

> **Last Updated:** 2026-02-13
> **Module Type:** TypeScript (Zustand Stores)

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **stores**`

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-02-13 | Added event-sources-store and updater-store documentation |
| 2026-02-01 | Initial documentation |

---

## Module Responsibility

The `stores` module contains Zustand stores for client-side state management. Each store handles a specific domain of application state, with persistence to the Rust backend via Tauri.

**Design Principle:** Stores are the single source of truth for their domain. Components consume stores via hooks, and changes are persisted to JSON storage via Tauri.

---

## Available Stores

| Store | File | Domain | Persistence |
|-------|------|--------|-------------|
| `useSettingsStore` | `settings-store.ts` | App preferences and UI settings | `starmap-settings` |
| `useEquipmentStore` | `equipment-store.ts` | Telescopes, cameras, eyepieces | `starmap-equipment` |
| `useTargetListStore` | `target-list-store.ts` | Observation targets | `starmap-target-list` |
| `useMarkerStore` | `marker-store.ts` | Custom sky markers | `starmap-markers` |
| `useOnboardingStore` | `onboarding-store.ts` | First-run experience state | `starmap-onboarding` |
| `useBookmarksStore` | `bookmarks-store.ts` | View bookmarks | `starmap-bookmarks` |
| `useMountStore` | `mount-store.ts` | Telescope mount state | (session only) |
| `useFramingStore` | `framing-store.ts` | Camera framing state | (session only) |
| `usePlateSolverStore` | `plate-solver-store.ts` | Plate solving state | (session only) |
| `useStellariumStore` | `stellarium-store.ts` | Stellarium settings | (session only) |
| `useSatelliteStore` | `satellite-store.ts` | Satellite tracking state | (session only) |
| `useSearchStore` | `search-store.ts` | Search state | (session only) |
| `useThemeStore` | `theme-store.ts` | Theme preference | persisted |
| `useFavoritesStore` | `favorites-store.ts` | Favorite objects | persisted |
| `useSetupWizardStore` | `setup-wizard-store.ts` | Setup wizard state | (session only) |
| `useKeybindingStore` | `keybinding-store.ts` | Keyboard shortcuts | persisted |
| `useLogStore` | `log-store.ts` | Application logs | (session only) |
| `useEventSourcesStore` | `event-sources-store.ts` | Astronomical event source config | `starmap-event-sources` |
| `useUpdaterStore` | `updater-store.ts` | Application update state | (session only) |

---

## Key Store: useSettingsStore

The settings store is the most complex and serves as a good example:

```typescript
interface SettingsState {
  // Connection
  connection: { ip: string; port: string };
  backendProtocol: 'http' | 'https';

  // Stellarium settings
  stellarium: StellariumSettings;

  // App preferences
  preferences: AppPreferences;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  notifications: NotificationSettings;
  search: SearchSettings;

  // Actions
  setConnection: (connection: Partial<...>) => void;
  setStellariumSetting: <K>(key: K, value: StellariumSettings[K]) => void;
  setPreference: <K>(key: K, value: AppPreferences[K]) => void;
  resetToDefaults: () => void;
}
```

### Usage

```typescript
import { useSettingsStore } from '@/lib/stores/settings-store';

function MyComponent() {
  const { stellarium, setStellariumSetting } = useSettingsStore();

  const toggleNightMode = () => {
    setStellariumSetting('nightMode', !stellarium.nightMode);
  };

  return <button onClick={toggleNightMode}>Toggle Night Mode</button>;
}
```

---

## Key Store: useEquipmentStore

```typescript
interface EquipmentStore {
  // Equipment lists
  telescopes: Telescope[];
  cameras: Camera[];
  eyepieces: Eyepiece[];
  filters: Filter[];
  barlows: Barlow[];

  // Current selection
  selectedTelescopeId: string | null;
  selectedCameraId: string | null;

  // Actions
  addTelescope: (telescope: Telescope) => void;
  removeTelescope: (id: string) => void;
  setSelectedTelescope: (id: string | null) => void;

  // Helpers
  getSelectedTelescope: () => Telescope | undefined;
}
```

---

## Key Store: useTargetListStore

```typescript
interface TargetListStore {
  // Targets
  targets: Target[];
  activeTargetId: string | null;

  // Filtering
  filterStatus: TargetStatus | 'all';
  filterTags: string[];

  // Actions
  addTarget: (target: Target) => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, updates: Partial<Target>) => void;
  setActiveTarget: (id: string | null) => void;

  // Batch operations
  archiveCompleted: () => void;
  clearCompleted: () => void;
}
```

---

## New Store: useEventSourcesStore

Manages configuration for astronomical event data sources:

```typescript
interface EventSourceConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  cacheMinutes: number;
}

interface EventSourcesState {
  sources: EventSourceConfig[];

  // Actions
  updateSource: (id: string, updates: Partial<Omit<EventSourceConfig, 'id'>>) => void;
  toggleSource: (id: string) => void;
  addSource: (source: EventSourceConfig) => void;
  removeSource: (id: string) => void;
  reorderSources: (sourceIds: string[]) => void;
  resetToDefaults: () => void;
}
```

### Default Sources

- **USNO** - US Naval Observatory API
- **IMO** - International Meteor Organization
- **NASA** - NASA Eclipse data
- **MPC** - Minor Planet Center (comets)
- **AstronomyAPI** - Astronomy API (disabled by default)
- **Local** - Local calculations

### Usage

```typescript
import { useEventSourcesStore } from '@/lib/stores';

function EventSettings() {
  const sources = useEventSourcesStore((state) => state.sources);
  const toggleSource = useEventSourcesStore((state) => state.toggleSource);

  return (
    <div>
      {sources.map((source) => (
        <Switch
          key={source.id}
          checked={source.enabled}
          onCheckedChange={() => toggleSource(source.id)}
        />
      ))}
    </div>
  );
}
```

---

## New Store: useUpdaterStore

Manages application update state and progress:

```typescript
interface UpdaterState {
  status: UpdateStatus;  // 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'
  currentVersion: string | null;
  lastChecked: number | null;
  skippedVersion: string | null;
  downloadSpeed: number | null;
  estimatedTimeRemaining: number | null;
}

interface UpdaterActions {
  setStatus: (status: UpdateStatus) => void;
  setCurrentVersion: (version: string) => void;
  setLastChecked: (timestamp: number) => void;
  setSkippedVersion: (version: string | null) => void;
  setDownloadMetrics: (speed: number | null, eta: number | null) => void;
  reset: () => void;
}
```

### Selectors

```typescript
// Check update states
selectIsChecking(state)    // status === 'checking'
selectIsDownloading(state) // status === 'downloading'
selectIsReady(state)       // status === 'ready'
selectHasUpdate(state)     // status === 'available' || status === 'ready'

// Get update data
selectUpdateInfo(state)    // Returns UpdateInfo | null
selectProgress(state)      // Returns UpdateProgress | null
selectError(state)         // Returns error string | null
```

### Usage

```typescript
import { useUpdaterStore, selectHasUpdate, selectProgress } from '@/lib/stores';

function UpdateIndicator() {
  const hasUpdate = useUpdaterStore(selectHasUpdate);
  const progress = useUpdaterStore(selectProgress);

  if (hasUpdate && progress) {
    return <ProgressBar value={progress.percent} />;
  }
  return null;
}
```

---

## Persistence Pattern

All persistent stores follow this pattern:

1. Store created with `zustand` + `persist` middleware
2. Storage adapter from `lib/storage` bridges to Tauri
3. State changes trigger automatic persistence
4. Store versioning with migrations

```typescript
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ... state and actions
    }),
    {
      name: 'starmap-settings',
      storage: getZustandStorage(), // Bridges to Tauri
      version: 5,
      migrate: (state, version) => { /* migration logic */ }
    }
  )
);
```

---

## Storage Adapter

The `getZustandStorage()` function in `lib/storage` creates a Zustand storage adapter that uses Tauri commands:

```typescript
// lib/storage/index.ts

export const getZustandStorage = () => ({
  getItem: async (name: string) => {
    const result = await loadStoreData(name);
    return result || null;
  },
  setItem: async (name: string, value: string) => {
    await saveStoreData(name, value);
  },
  removeItem: async (name: string) => {
    await deleteStoreData(name);
  }
});
```

---

## Testing

Tests are located in `__tests__/` subdirectories:

```bash
# Run all store tests
pnpm test lib/stores

# Run specific test
pnpm test lib/stores/__tests__/settings-store.test.ts
pnpm test lib/stores/__tests__/event-sources-store.test.ts
pnpm test lib/stores/__tests__/updater-store.test.ts
```

---

## Common Patterns

### Selecting State Slices

Use Zustand's selector to avoid unnecessary re-renders:

```typescript
// GOOD - Only re-renders when nightMode changes
const nightMode = useSettingsStore(state => state.stellarium.nightMode);

// AVOID - Re-renders on any store change
const { stellarium } = useSettingsStore();
```

### Async Actions

For actions that need to call Tauri, use async handlers:

```typescript
const syncWithBackend = async () => {
  try {
    const data = await loadFromBackend();
    set({ data });
  } catch (error) {
    console.error('Sync failed', error);
  }
};
```

### Using Selectors for Computed State

```typescript
// Define selector outside component for stability
const selectEnabledSources = (state: EventSourcesState) =>
  state.sources.filter(s => s.enabled).sort((a, b) => a.priority - b.priority);

function EventList() {
  const enabledSources = useEventSourcesStore(selectEnabledSources);
  // ...
}
```

---

## Related Files

- [`settings-store.ts`](./settings-store.ts) - Settings store implementation
- [`event-sources-store.ts`](./event-sources-store.ts) - Event sources configuration
- [`updater-store.ts`](./updater-store.ts) - Application update state
- [`index.ts`](./index.ts) - Module exports
- [lib/tauri/CLAUDE.md](../tauri/CLAUDE.md) - Tauri API wrappers
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
