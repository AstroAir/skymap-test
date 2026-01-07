<!-- Documentation Coverage Analysis Report -->

### Code Sections (The Evidence)

## Backend Rust Modules (src-tauri/src/)

- `src-tauri/src/lib.rs` (Module Registration): Central command handler with 130+ registered Tauri commands across 11 feature modules. Comprehensive cross-module dependencies managed.
- `src-tauri/src/storage.rs` (JSON Storage): Generic JSON persistence system with size validation and path sandboxing. Implements `save_store_data`, `load_store_data`, `delete_store_data`, `list_stores`, `export_all_data`, `import_all_data`, `get_storage_stats`, `clear_all_data`.
- `src-tauri/src/equipment.rs` (Device Management): 14 commands for telescopes, cameras, eyepieces, filters, barlow/reducers. Includes preset equipment library and default device tracking.
- `src-tauri/src/astronomy.rs` (Coordinate Transform & Calculations): 14+ commands including `equatorial_to_horizontal`, `horizontal_to_equatorial`, coordinate system conversions (equatorial/galactic/ecliptic), visibility, twilight, moon phase calculations.
- `src-tauri/src/locations.rs` (Location Management): 7 commands for user observation locations with timezone support, current location tracking.
- `src-tauri/src/target_list.rs` (Target Management): 17+ commands for CRUD, batching, tagging, archiving, filtering, and statistics on observation targets.
- `src-tauri/src/markers.rs` (Sky Markers): 13 commands for custom sky markers, grouping, visibility control, persistence.
- `src-tauri/src/observation_log.rs` (Observation Sessions): 9 commands for session creation, observation recording, session management, statistics, search.
- `src-tauri/src/astro_events.rs` (Astronomical Events): 5 commands for moon phases, meteor showers, seasonal events, tonight's highlights.
- `src-tauri/src/offline_cache.rs` (Tile Caching): 11 commands for region-based sky survey tile caching with progress tracking, statistics, and cleanup.
- `src-tauri/src/unified_cache.rs` (Unified Caching): 10 commands for generic key-value caching with TTL, cleanup, and batch prefetching.
- `src-tauri/src/http_client.rs` (HTTP Client): 11 commands providing secure HTTP with proxy, retry, rate limiting, batch download, cancellation, progress events. Feature-rich error handling.
- `src-tauri/src/app_settings.rs` (Application Settings): 9 commands for app prefs, window state persistence, recent files, system info, path operations.
- `src-tauri/src/app_control.rs` (App Lifecycle): 4 commands for restart, quit, webview reload, dev mode detection. Well-documented with tests.
- `src-tauri/src/updater.rs` (Auto-Updates): Update checking, downloading, installation with progress events and status tracking. Desktop-only feature.
- `src-tauri/src/target_io.rs` (Target Import/Export): 2 commands supporting CSV, JSON, Stellarium, SkySafari formats.
- `src-tauri/src/security.rs` (Security Layer): Validation functions for size limits, URL safety, SSRF protection, path sandboxing.
- `src-tauri/src/rate_limiter.rs` (Rate Limiting): Sliding window algorithm with configurable tiers (conservative, moderate, relaxed, read-only).
- `src-tauri/src/utils.rs` (Utility Functions): Common helper functions and constants.

## Frontend TypeScript/React Components & APIs

### Tauri API Wrappers (lib/tauri/)

- `lib/tauri/storage-api.ts` (Storage): Type-safe wrappers for storage commands.
- `lib/tauri/astronomy-api.ts` (Astronomy): Wrappers for coordinate transforms, visibility, celestial calculations.
- `lib/tauri/cache-api.ts` (Offline Cache): Region-based tile caching API.
- `lib/tauri/unified-cache-api.ts` (Unified Cache): Generic caching wrapper.
- `lib/tauri/events-api.ts` (Astro Events): Moon phases, meteor showers, seasonal events.
- `lib/tauri/target-list-api.ts` (Target List): CRUD and batch operations on targets.
- `lib/tauri/markers-api.ts` (Markers): Sky marker persistence and visibility.
- `lib/tauri/http-api.ts` (HTTP Client): Request, download, batch operations with cancellation.
- `lib/tauri/updater-api.ts` (Updater): Check, download, install updates. Desktop-only (no tests for mobile).
- `lib/tauri/app-control-api.ts` (App Control): Restart, quit, reload, dev mode, window control. **NOT documented in developer guide**.
- `lib/tauri/geolocation-api.ts` (Geolocation): Mobile-only wrapper with permission handling. **NOT documented in backend API reference**.
- `lib/tauri/hooks.ts` (Custom Hooks): Tauri-based React hooks for data fetching. **Incomplete documentation**.
- `lib/tauri/api.ts` (Core API): Base Tauri invoke wrapper. **Minimal documentation**.

### Zustand State Management (lib/stores/)

- `lib/stores/stellarium-store.ts` (Star Map Engine): View state, search, camera controls.
- `lib/stores/equipment-store.ts` (Equipment): Telescope, camera, eyepiece, filter, barlow/reducer management with presets.
- `lib/stores/target-list-store.ts` (Target List): Observation targets with filtering, sorting, favorites.
- `lib/stores/marker-store.ts` (Sky Markers): Custom marker groups and visibility.
- `lib/stores/settings-store.ts` (App Settings): User preferences, display options, behavior settings.
- `lib/stores/satellite-store.ts` (Satellites): Real-time satellite tracking data. **Undocumented**.
- `lib/stores/mount-store.ts` (Mount Control): Equatorial mount tracking state. **Undocumented**.
- `lib/stores/framing-store.ts` (Image Framing): Composition guide and ROI state. **Undocumented**.
- `lib/stores/onboarding-store.ts` (Onboarding): Tutorial flow state. **Undocumented**.
- `lib/stores/setup-wizard-store.ts` (Setup Wizard): Initial setup state. **Undocumented**.
- `lib/stores/theme-store.ts` (Theme): Dark mode and UI customization. **Undocumented**.
- `lib/stores/bookmarks-store.ts` (View Bookmarks): Saved view positions. **Undocumented**.
- `lib/stores/favorites-store.ts` (Favorites): User-favorited objects. **Undocumented**.

### Astronomy Calculation Libraries (lib/astronomy/)

- `lib/astronomy/coordinates/conversions.ts` (Coordinate Transforms): RA/Dec ↔ Alt/Az, Equatorial ↔ Galactic, Equatorial ↔ Ecliptic.
- `lib/astronomy/coordinates/formats.ts` (Formatting): RA/Dec HMS/DMS formatting and parsing.
- `lib/astronomy/coordinates/transforms.ts` (Coordinate Systems): Matrix transformations and precession.
- `lib/astronomy/time/julian.ts` (Julian Dates): Date ↔ JD conversions, MJD, J2000.
- `lib/astronomy/time/sidereal.ts` (Sidereal Time): GMST, LMST, apparent sidereal time.
- `lib/astronomy/time/formats.ts` (Time Formatting): ISO, HMS, local time formatting. **Minimal documentation**.
- `lib/astronomy/celestial/sun.ts` (Sun Position): Position, rise/set, solar noon. **Incomplete documentation**.
- `lib/astronomy/celestial/moon.ts` (Moon Position & Phase): Position, phase, illumination, rise/set, future phases. **Incomplete documentation**.
- `lib/astronomy/celestial/separation.ts` (Angular Separation): Great-circle distance calculations.
- `lib/astronomy/twilight/calculator.ts` (Twilight Times): Civil, nautical, astronomical twilight. **Documented but incomplete**.
- `lib/astronomy/visibility/altitude.ts` (Altitude Calculations): Altitude over time, max altitude, transit time. **NOT documented**.
- `lib/astronomy/visibility/circumpolar.ts` (Circumpolar Objects): Circumpolar/never-rise classification. **NOT documented**.
- `lib/astronomy/visibility/target.ts` (Target Visibility): Rise, set, best observation time. **NOT documented**.
- `lib/astronomy/visibility/target-visibility.ts` (Extended Visibility): Multi-day visibility patterns. **NOT documented**.
- `lib/astronomy/imaging/exposure.ts` (Exposure Calculation): Exposure time recommendations based on target and conditions. **Minimal documentation**.
- `lib/astronomy/imaging/feasibility.ts` (Feasibility Analysis): Image feasibility assessment. **Minimal documentation**.
- `lib/astronomy/imaging/planning.ts` (Imaging Planning): Multi-target observation planning. **Minimal documentation**.
- `lib/astronomy/horizon/custom-horizon.ts` (Custom Horizon): Local obstruction modeling with azimuth/altitude interpolation. **NOT documented**.
- `lib/astronomy/astro-utils.ts` (Utility Functions): Common constants and helper functions. **NOT documented**.
- `lib/astronomy/starmap-utils.ts` (Starmap Utilities): Starmap-specific calculations. **Minimal documentation**.

### React Components (components/starmap/) - 144 components

- `components/starmap/canvas/stellarium-canvas.tsx` (Star Map Canvas): Renders Stellarium Web Engine sky visualization.
- `components/starmap/controls/zoom-controls.tsx` (Zoom): Zoom in/out controls.
- `components/starmap/controls/keyboard-shortcuts-manager.tsx` (Keyboard): Global keyboard shortcut handling. **NOT documented**.
- `components/starmap/controls/navigation-history.tsx` (Navigation History): Pan/zoom history with undo/redo. **NOT documented**.
- `components/starmap/controls/view-bookmarks.tsx` (View Bookmarks): Save/restore view positions. **NOT documented**.
- `components/starmap/dialogs/about-dialog.tsx` (About Dialog): App information dialog.
- `components/starmap/dialogs/keyboard-shortcuts-dialog.tsx` (Shortcuts Dialog): Keyboard reference. **NOT documented**.
- `components/starmap/feedback/splash-screen.tsx` (Splash Screen): Loading screen.
- `components/starmap/feedback/loading-skeleton.tsx` (Loading): Skeleton loaders. **NOT documented**.
- `components/starmap/management/data-manager.tsx` (Data Manager): Import/export user data.
- `components/starmap/management/equipment-manager.tsx` (Equipment Manager): Device configuration UI.
- `components/starmap/management/location-manager.tsx` (Location Manager): Observation location management.
- `components/starmap/management/marker-manager.tsx` (Marker Manager): Custom marker management.
- `components/starmap/management/offline-cache-manager.tsx` (Cache Manager): Tile cache region management.
- `components/starmap/management/settings/` (Settings Panel): 8+ settings-related components. **Partially documented**.
- `components/starmap/management/updater/` (Updater Panel): Update checking and installation. **NOT documented**.
- `components/starmap/overlays/` (Overlay Components): 10+ components for FOV, satellite tracker, ocular simulator, grid, etc. **Minimally documented**.
- `components/starmap/planning/` (Planning Tools): 12+ components for altitude charts, exposure calculator, session planning. **Minimally documented**.
- `components/starmap/objects/` (Object Display): 8+ components for object info, image galleries, search results. **Minimally documented**.
- `components/starmap/core/` (Core Components): Main starmap, search, clock, status bar. **Partially documented**.

## Documentation Status Assessment

### Documentation Files Reviewed

- `docs/index.md` - Project overview (Chinese only)
- `docs/developer-guide/apis/backend-apis/tauri-commands.md` - Backend command reference (comprehensive, 883 lines)
- `docs/developer-guide/architecture/backend-architecture.md` - Backend architecture overview
- `docs/developer-guide/apis/frontend-apis/stores.md` - Zustand stores API (partial coverage)
- `docs/developer-guide/core-modules/astronomy-engine.md` - Astronomy module guide (240+ lines, partial)
- `docs/developer-guide/frontend-development/react-components.md` - React component guidelines (60+ lines)
- 60+ other markdown files covering user guides, deployment, security, etc.

---

### Report (The Answers)

#### result

**Documentation Coverage Summary:**

1. **Well-Documented Areas:**
   - Backend Tauri Commands: 120+ commands documented with complete API reference, data structures, usage examples
   - Core Astronomy Functions: Coordinate transforms, time calculations, celestial positions documented
   - Storage and Equipment Management: Full API documentation with examples
   - Security Features: Rate limiting, input validation documented
   - Zustand Stores: Main 11 stores documented with state interfaces and actions

2. **Incomplete Documentation:**
   - Astronomy Visibility Module: 5 visibility-related files (altitude, circumpolar, target visibility, target-visibility, visibility/index.ts) have **no developer guide documentation**
   - Astronomy Imaging Module: Exposure calculation, feasibility assessment, imaging planning have minimal documentation
   - Custom Horizon System: NINA-compatible custom horizon implementation is **not documented**
   - 7 Zustand Stores: `satellite-store`, `mount-store`, `framing-store`, `onboarding-store`, `setup-wizard-store`, `theme-store`, `bookmarks-store`, `favorites-store` are **completely undocumented**

3. **Undocumented APIs:**
   - `lib/tauri/app-control-api.ts`: 10 functions for app control (restart, quit, reload, window control, fullscreen, etc.) - **NOT mentioned in any documentation**
   - `lib/tauri/geolocation-api.ts`: Mobile-specific geolocation API (11 functions) - **mentioned only in hooks documentation**, no dedicated API reference
   - `lib/tauri/hooks.ts`: Custom React hooks for Tauri (incomplete, no standalone documentation)
   - `lib/tauri/updater-hooks.ts`: Update-specific React hooks - **not documented**

4. **Component Documentation Gaps:**
   - 144 React components exist in `components/starmap/`
   - Only ~30% have dedicated documentation sections
   - Undocumented: keyboard shortcuts manager, navigation history, loading skeleton, updater panel components, most overlay and planning components
   - No component API reference (props, examples) for most components

5. **Utility Modules Not Documented:**
   - `lib/astronomy/astro-utils.ts` - Common constants and helpers
   - `lib/astronomy/starmap-utils.ts` - Starmap-specific calculations
   - `lib/astronomy/time/formats.ts` - Time formatting utilities
   - `src-tauri/src/utils.rs` - Backend utilities
   - HTTP client advanced features: retry logic, proxy support, batch operations details

#### conclusions

**Factual Findings:**

- **130+ Backend Commands**: All registered in `lib.rs` handler, mostly documented in `tauri-commands.md`
- **27 Zustand Stores**: 11 main stores documented, 8 stores completely undocumented, 2 missing (bookmarks, favorites)
- **18 Astronomy Modules**: 6 modules well-documented, 5 visibility modules undocumented, 3+ imaging utilities minimally documented
- **144 React Components**: ~40 components documented, ~80+ components undocumented (especially overlays, planning, management subcomponents)
- **12 Tauri API Files**: 7 fully documented, 2 partially documented, 3 completely undocumented
- **0 Dedicated Component API Reference**: No markdown file lists all starmap components with their props and examples
- **0 Astronomy Visibility Guide**: Despite 5 implementation files, no guide explaining altitude, circumpolar, transit, visibility patterns
- **Language Gap**: Documentation is primarily in Chinese; some English-only files (backend-apis reference mostly English examples)

**Documentation Quality Issues:**

1. Newer features (satellite tracking, mount control, framing, onboarding wizard, theme customization) lack state documentation
2. Mobile-specific APIs (geolocation) lack dedicated reference documentation
3. App control features (window management, restart, reload) undocumented in developer guide
4. Component prop documentation incomplete - need `@types` exports or JSDoc
5. Visibility calculation algorithms not explained (altitude curves, circumpolar classification, transit time)
6. Custom horizon implementation not documented despite being NINA-compatible feature
7. Imaging planning algorithms not documented (feasibility criteria, exposure calculations)

#### relations

**Documentation Structure Relationships:**

- `src-tauri/src/lib.rs` → ALL commands listed → documented in `docs/developer-guide/apis/backend-apis/tauri-commands.md`
- `lib/tauri/*-api.ts` → wraps Rust commands → documented in `docs/developer-guide/apis/frontend-apis/` (partial)
- `lib/stores/*.ts` → state management → documented in `docs/developer-guide/apis/frontend-apis/stores.md` (11/19 stores)
- `lib/astronomy/*` → pure calculations → documented in `docs/developer-guide/core-modules/astronomy-engine.md` (partial)
- `components/starmap/*` → React UI → documented in `docs/developer-guide/frontend-development/react-components.md` (guidelines only)

**Key Dependencies Not Fully Documented:**

- `app-control-api.ts` invokes Rust `app_control.rs` commands (4 desktop commands) → no documentation bridge
- `geolocation-api.ts` wraps Tauri mobile geolocation plugin → only mentioned in hooks guide
- `updater-api.ts` invokes 7 Rust update commands → desktop-only feature matrix not documented
- Astronomy visibility modules (`altitude.ts`, `circumpolar.ts`, `target.ts`) are pure functions but integration pattern not documented
- Custom horizon system (`lib/astronomy/horizon/custom-horizon.ts`) is complete implementation but zero documentation
- `satellite-store`, `mount-store`, `framing-store` have no documentation but are referenced in components

---

## Missing Documentation Checklist

### Backend Modules (3 areas need docs)
- [ ] Updater module details: check flow, download progress, installation states
- [ ] HTTP client advanced features: retry strategy, proxy handling, batch downloads with cancellation
- [ ] Security validations: size limits, URL checking algorithm, SSRF prevention specifics

### Frontend APIs (3 files need docs)
- [ ] `app-control-api.ts` - Create dedicated API reference with examples
- [ ] `geolocation-api.ts` - Create mobile API guide with permission handling
- [ ] `updater-hooks.ts` - Document update status hooks and event handling

### Zustand Stores (8 stores need docs)
- [ ] `satellite-store.ts` - Real-time satellite tracking state
- [ ] `mount-store.ts` - Equatorial mount position and tracking
- [ ] `framing-store.ts` - Image composition and ROI state
- [ ] `onboarding-store.ts` - Tutorial progress tracking
- [ ] `setup-wizard-store.ts` - Initial configuration flow state
- [ ] `theme-store.ts` - Dark mode and color customization
- [ ] `bookmarks-store.ts` - Saved view positions (implied but undocumented)
- [ ] `favorites-store.ts` - Favorited objects (implied but undocumented)

### Astronomy Modules (9 items need docs)
- [ ] Visibility module guide: altitude calculations, circumpolar detection, transit times
- [ ] `altitude.ts` - Altitude curve generation, max altitude timing
- [ ] `circumpolar.ts` - Circumpolar object classification algorithm
- [ ] `target.ts` - Rise/set time calculation, best observation time
- [ ] `target-visibility.ts` - Multi-day visibility patterns
- [ ] Imaging module guide: exposure calculations, feasibility metrics
- [ ] `exposure.ts` - Exposure time recommendations, SNR calculations
- [ ] `feasibility.ts` - Image quality assessment criteria
- [ ] `custom-horizon.ts` - Custom horizon modeling with interpolation

### React Components (4 categories need docs)
- [ ] Component API reference: all 144 components with props, examples, state management
- [ ] Overlay components (FOV simulator, satellite tracker, grid, compass, etc.) - 10+ components
- [ ] Planning components (altitude chart, exposure calculator, session planner, etc.) - 12+ components
- [ ] Management subcomponents (settings panels, updater panel, etc.) - 15+ components
- [ ] Utility/feedback components (loading skeleton, splash screen, dialogs, etc.) - 10+ components

### Utility Libraries (3 files need docs)
- [ ] `astro-utils.ts` - List common constants and helper functions
- [ ] `starmap-utils.ts` - Starmap-specific calculation helpers
- [ ] `time/formats.ts` - Time formatting and parsing utility reference

### Testing & Examples
- [ ] No E2E or integration examples for complex workflows (satellite tracking, custom horizons, multi-day planning)
- [ ] Mobile platform-specific behaviors not documented (geolocation permissions, mobile-only stores)
