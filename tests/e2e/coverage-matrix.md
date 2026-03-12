# E2E Coverage Matrix

## Scope

This matrix tracks release-critical starmap workflows and maps each workflow to owning Playwright specs.
It reflects current implementation behavior and is used to decide smoke (`@smoke`) and regression (`@regression`) coverage.

## Workflow Matrix

| Workflow | Existing Coverage | Gap Identified | Target Spec Ownership |
| --- | --- | --- | --- |
| Object search (query, select, visible result) | `tests/e2e/starmap/search.spec.ts` | Existing assertions are often weak (`count >= 0`) and rely on loose selectors. | `tests/e2e/starmap/search.spec.ts` |
| Session planning (open planner, key actions, persistence signal) | `tests/e2e/starmap/session-planner.spec.ts` | Missing deterministic selectors for planner trigger/dialog/action buttons. | `tests/e2e/starmap/session-planner.spec.ts` |
| Map interaction (canvas pan/zoom + context interactions) | `tests/e2e/starmap/canvas-interactions.spec.ts`, `tests/e2e/starmap/zoom-controls.spec.ts` | Some tests depend on implicit waits and do not assert stable control readiness. | `tests/e2e/starmap/canvas-interactions.spec.ts` |
| Settings persistence across reload/revisit | `tests/e2e/starmap/settings.spec.ts`, `tests/e2e/starmap/data-persistence.spec.ts` | Existing settings persistence flow does not assert control state with stable IDs. | `tests/e2e/starmap/settings.spec.ts` |
| Core dialog workflow (open, action entrypoint, close/reopen) | `tests/e2e/starmap/about-dialog.spec.ts` | Existing dialog assertions are permissive and not consistently role/test-id driven. | `tests/e2e/starmap/about-dialog.spec.ts` |

## Tiering Rules

- `@smoke`
  - Fast validation subset for developer loops.
  - One deterministic, high-signal scenario per critical workflow category.
  - Default runner target: Chromium only.
- `@regression`
  - Broader release-confidence set covering all critical workflow categories.
  - Includes more complete interaction paths and persistence checks.
  - Default runner target: Chromium full regression profile.

## Selector and Wait Policy

- Selector order of preference:
  1. `getByRole` with accessible name
  2. `data-testid`
  3. constrained semantic locator with explicit intent
- Avoid:
  - transient CSS structure selectors
  - assertions that always pass (`count >= 0`)
- Readiness:
  - Use shared `waitForStarmapReady` bootstrap.
  - Add explicit checks for panel/dialog visibility before assertions.
  - Prefer deterministic polling (`expect.poll`) over fixed long sleeps.

## Planned Expansions In This Change

- Strengthen existing critical specs by adding tagged, deterministic scenarios.
- Add minimal test IDs in session planner, search, settings, and about-dialog entrypoints where semantic selectors are not stable enough.
- Add reusable helper methods for opening/awaiting critical panels.
