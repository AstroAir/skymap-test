# Repository Guidelines

## Project Overview

A desktop star map and astronomy planning application built with Next.js 16 + Tauri 2.9. Integrates with Stellarium Web Engine for sky visualization, observation planning, equipment management, and astronomical calculations.

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Desktop: Tauri 2.9 (Rust backend)
- UI: shadcn/ui, Radix UI, Lucide icons
- State: Zustand stores
- i18n: next-intl (English/Chinese)

## Project Structure & Module Organization

- `app/` Next.js App Router (routes: `page.tsx`, `layout.tsx`, global styles in `globals.css`).
- `components/ui/` Reusable UI components (shadcn patterns).
- `components/starmap/` Star map feature components (canvas, controls, overlays, planning, objects, management, settings, search, knowledge, mount, map, onboarding).
- `components/common/` Shared components (theme, language, log viewer, system status).
- `components/icons/` Brand icons, SkyMap logo, Stellarium/Zustand icons.
- `lib/astronomy/` Pure astronomical calculations (coordinates, time, celestial, visibility, twilight, imaging, engine, horizon, object-resolver, mount-safety).
- `lib/stores/` Zustand state management (settings, equipment, target-list, markers, stellarium, onboarding, theme, aladin, daily-knowledge, feedback, session-plan, etc.).
- `lib/tauri/` TypeScript wrappers for Tauri IPC calls (storage, astronomy, events, mount, cache, updater, etc.).
- `lib/services/` External API services (online search, object info, HiPS, satellite, geocoding, daily-knowledge, map-providers, search).
- `lib/hooks/` Custom React hooks (37+ hooks, aladin/, stellarium/ subdirs).
- `lib/i18n/` Internationalization utilities.
- `lib/storage/` Storage abstraction layer (Tauri/Web adapters, Zustand bridge).
- `lib/catalogs/` Astronomical catalog data and types.
- `lib/logger/` Structured logging system with transports.
- `lib/cache/` Cache compression, config, migration, stats.
- `lib/offline/` Offline cache manager, unified cache.
- `lib/core/` Core constants and type definitions.
- `lib/constants/` App constants (equipment presets, shortcuts, onboarding, satellite).
- `lib/data/` Curated data (daily knowledge content).
- `lib/plate-solving/` Astrometry API, FITS parser.
- `lib/security/` Frontend security utilities.
- `lib/feedback/` Feedback utilities.
- `lib/aladin/` Aladin Lite compatibility layer.
- `lib/utils/` Map utilities, observer location, scroll animation.
- `public/` Static assets (SVGs, icons, Stellarium engine).
- `src-tauri/` Tauri desktop wrapper (Rust backend: astronomy, data, cache, network, platform, mount).
- `i18n/messages/` Translation files (en.json, zh.json).
- `tests/e2e/` Playwright end-to-end tests.
- `docs/` MkDocs-based developer and user documentation.
- Root configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`.

## Build, Test, and Development Commands

```bash
# Development
pnpm dev                    # Run Next.js dev server (localhost:1420)
pnpm tauri dev              # Launch desktop app with hot-reload

# Build
pnpm build                  # Create production build (outputs to out/)
pnpm tauri build            # Build desktop binaries

# Linting & Type Checking
pnpm lint                   # Run ESLint (use --fix to auto-fix)
pnpm exec tsc --noEmit      # Type check without emitting

# Unit/Integration Testing (Jest)
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage
pnpm test path/to/file      # Run specific test file

# E2E Testing (Playwright)
pnpm exec playwright test                    # Run all E2E tests
pnpm exec playwright test --project=chromium # Single browser
pnpm exec playwright test tests/e2e/starmap/ # Specific directory
```

**Important:** For Tauri production builds, `output: "export"` must be set in `next.config.ts`.

## Coding Style & Naming Conventions

- Language: TypeScript with React 19 and Next.js 16.
- Linting: `eslint.config.mjs` is the source of truth; keep code warning-free.
- Styling: Tailwind CSS v4 (utility-first). Use `cn()` from `@/lib/utils` to merge classes.
- Components: PascalCase names/exports; files in `components/ui/` mirror export names.
- Routes: Next app files are lowercase (`page.tsx`, `layout.tsx`).
- Code: camelCase variables/functions; hooks start with `use*`.
- Path alias: `@/*` maps to repo root (e.g., `@/lib/utils`, `@/components/ui/button`).

## Testing Guidelines

- **Unit/Integration:** Jest with React Testing Library. Test files: `__tests__/*.test.ts(x)` or `*.test.ts(x)`.
- **E2E:** Playwright in `tests/e2e/`. Runs against `http://localhost:3001/starmap`.
- **Mocks:** Tauri APIs mocked in `__mocks__/` directory.
- **Coverage thresholds:** 50% branches, 35% functions, 60% lines/statements.
- Prioritize `lib/` utilities and complex UI logic for coverage.

## Commit & Pull Request Guidelines

- Prefer Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `ci:`.
- Link issues in the footer: `Closes #123`.
- PRs should include: brief scope/intent, screenshots for UI changes, validation steps, and pass `pnpm lint`.
- Keep changes focused; avoid unrelated refactors.

## Security & Configuration Tips

- Use `.env.local` for secrets; do not commit `.env*` files.
- Only expose safe client values via `NEXT_PUBLIC_*`.
- Tauri: minimize capabilities in `src-tauri/tauri.conf.json`; avoid broad filesystem access.
