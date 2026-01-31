# state-management Module

[Root](../../CLAUDE.md) > [lib](../) > **stores**

> **Last Updated:** 2026-02-01
> **Module Type:** TypeScript (Zustand Stores)

---

## Breadcrumb

`[Root](../../CLAUDE.md) > [lib](../) > **stores**`

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

---

## Related Files

- [`settings-store.ts`](./settings-store.ts) - Settings store implementation
- [`index.ts`](./index.ts) - Module exports
- [lib/tauri/CLAUDE.md](../tauri/CLAUDE.md) - Tauri API wrappers
- [Root CLAUDE.md](../../CLAUDE.md) - Project documentation
