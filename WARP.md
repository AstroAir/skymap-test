# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A desktop star map and astronomy planning application built with Next.js 16 + Tauri 2.9. Integrates with Stellarium Web Engine for sky visualization, observation planning, equipment management, and astronomical calculations.

**Tech Stack:**
- Framework: Next.js 16 (App Router) with React 19, TypeScript, Tailwind CSS v4
- Desktop: Tauri 2.9 (Rust backend)
- State: Zustand stores
- i18n: next-intl (English/Chinese)

**Key Files:**
- `app/layout.tsx`, `app/page.tsx` - Next.js entry points
- `app/globals.css` - Global styles with Tailwind v4
- `lib/utils.ts` - `cn()` utility (clsx + tailwind-merge)
- `components/ui/` - shadcn/ui components (Radix + class-variance-authority)
- `src-tauri/` - Rust backend modules

## Package Manager

Use **pnpm** (lockfile present). Examples below use pnpm.

## Common Commands

```bash
# Development
pnpm install                # Install dependencies
pnpm dev                    # Next.js dev server (http://localhost:3000)
pnpm tauri dev              # Desktop app with hot-reload

# Build
pnpm build                  # Production build (outputs to out/)
pnpm tauri build            # Build desktop binaries

# Quality
pnpm lint                   # ESLint (flat config)
pnpm lint --fix             # Auto-fix linting issues
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

## Architecture

### Frontend-Backend Communication

```
React Component → Zustand Store → lib/tauri/*-api.ts → Tauri invoke() → Rust command
```

### Key Directories

- `lib/astronomy/` - Pure astronomical calculations (coordinates, time, visibility, twilight)
- `lib/stores/` - Zustand state management
- `lib/tauri/` - TypeScript wrappers for Tauri IPC
- `components/starmap/` - Star map UI components
- `src-tauri/src/` - Rust backend modules
- `i18n/messages/` - Translation files (en.json, zh.json)

### Conventions

- **Routing:** App Router under `app/`
- **Styling:** Tailwind CSS v4 via PostCSS plugin
- **TypeScript:** Strict mode, `@/*` path alias to repo root
- **ESLint:** Flat config using `eslint-config-next`
- **Dark mode:** Class-based (apply `.dark` class to parent)

## Testing

- **Unit/Integration:** Jest with React Testing Library
- **E2E:** Playwright in `tests/e2e/`
- **Coverage thresholds:** 50% branches, 35% functions, 60% lines/statements
- **Mocks:** Tauri APIs mocked in `__mocks__/` directory

## AI/Assistant Rules

This repository has guidance files for multiple AI assistants:
- `CLAUDE.md` - Claude Code
- `GEMINI.md` - Google Gemini
- `AGENTS.md` - General agent guidelines
- `.github/copilot-instructions.md` - GitHub Copilot
