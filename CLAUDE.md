# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A desktop star map and astronomy planning application built with Next.js 16 + Tauri 2.9. The app integrates with Stellarium Web Engine for sky visualization and provides tools for observation planning, equipment management, and astronomical calculations.

**Tech Stack:**

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Desktop: Tauri 2.9 (Rust backend)
- UI: shadcn/ui, Radix UI, Lucide icons
- State: Zustand stores
- i18n: next-intl (English/Chinese)

## Development Commands

```bash
# Frontend
pnpm dev                    # Start Next.js dev server (localhost:3000)
pnpm build                  # Build for production (outputs to out/)
pnpm lint                   # ESLint

# Desktop App (Tauri)
pnpm tauri dev              # Run desktop app with hot-reload
pnpm tauri build            # Build production desktop app

# Testing (Jest - Unit/Integration)
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage (thresholds: 50% branches, 35% functions, 60% lines/statements)
pnpm test -- path/to/file   # Run specific test file

# Testing (Playwright - E2E)
pnpm exec playwright test                    # Run all E2E tests
pnpm exec playwright test --project=chromium # Single browser
pnpm exec playwright test tests/e2e/starmap/ # Specific directory

# Type checking
pnpm exec tsc --noEmit      # Check TypeScript without emitting

# Add shadcn/ui components
pnpm dlx shadcn@latest add [component-name]
```

**Important Build Note:** For Tauri production builds, Next.js must use static export mode. Ensure `output: "export"` is set in `next.config.ts` as `tauri.conf.json` expects the `out/` directory.

## Architecture

### Frontend-Backend Communication

The app uses Tauri's IPC for frontend-backend communication:

1. **Rust commands** are defined in `src-tauri/src/*.rs` modules (equipment, locations, astronomy, etc.)
2. **TypeScript APIs** in `lib/tauri/` wrap Tauri's `invoke()` calls with type safety
3. **Zustand stores** in `lib/stores/` manage client state and sync with Rust backend

```
React Component → Zustand Store → lib/tauri/*-api.ts → Tauri invoke() → Rust command
```

### Key Modules

**`lib/astronomy/`** - Pure astronomical calculations (no side effects):

- `coordinates/` - RA/Dec, Alt/Az, Galactic coordinate conversions
- `time/` - Julian date, sidereal time calculations
- `celestial/` - Sun, Moon position calculations
- `visibility/` - Target visibility, circumpolar calculations
- `twilight/` - Twilight times (civil, nautical, astronomical)
- `imaging/` - Exposure and imaging feasibility calculations

**`lib/stores/`** - Zustand state management:

- `stellarium-store` - Main sky view state
- `settings-store` - App preferences
- `equipment-store` - Telescopes, cameras, eyepieces with built-in presets
- `target-list-store` - Observation targets
- `marker-store` - Custom sky markers

**`lib/tauri/`** - Rust backend API wrappers:

- `astronomy-api` - Astronomical calculations (offloaded to Rust)
- `cache-api` - Offline tile caching for sky surveys
- `events-api` - Moon phases, meteor showers, astronomical events
- `target-list-api` - Target list persistence
- `markers-api` - Sky marker persistence

**`components/starmap/`** - Star map UI components:

- `core/` - Main view, search, clock, settings
- `overlays/` - FOV simulator, satellite tracker, ocular simulator
- `planning/` - Altitude charts, exposure calculator, session planning
- `objects/` - Object info panels, image galleries
- `management/` - Equipment, location, data managers

**`src-tauri/src/`** - Rust backend modules:

- `storage.rs` - Generic JSON storage system
- `equipment.rs`, `locations.rs` - Equipment and location management
- `astronomy.rs` - Coordinate transforms, visibility calculations
- `offline_cache.rs`, `unified_cache.rs` - Tile and data caching
- `astro_events.rs` - Astronomical event calculations
- `observation_log.rs` - Observation logging and history
- `target_list.rs`, `target_io.rs` - Target list management and import/export
- `markers.rs` - Custom sky marker persistence
- `security.rs`, `rate_limiter.rs` - Security utilities

### Data Storage

- User data stored in platform-specific app data directory
- Rust `storage.rs` provides generic JSON store operations
- Frontend syncs state via `TauriSyncProvider` component

### Internationalization

- Translations in `i18n/messages/{en,zh}.json`
- `next-intl` for i18n with `lib/i18n/locale-store.ts` for persistence
- Use `useTranslations()` hook in components

## Path Aliases

```typescript
@/components  → components/
@/lib         → lib/
@/ui          → components/ui/
@/hooks       → hooks/
@/utils       → lib/utils.ts
```

## Testing Conventions

- Test files: `__tests__/*.test.ts(x)` or `*.test.ts(x)`
- Uses Jest with React Testing Library
- E2E tests in `tests/e2e/` using Playwright
- Mock Tauri APIs in tests (see `__mocks__/` directory)
- Coverage reports output to `coverage/`

## Component Patterns

- Use `cn()` from `@/lib/utils` to merge Tailwind classes: `cn("base", conditional && "conditional", className)`
- Prefer composition with `asChild` for polymorphic components (Button as Link, etc.)
- Dark mode via class-based strategy (apply `.dark` class to parent)
