# Star Map Loading System Design

Date: 2026-03-05  
Scope: Full loading flow verification and completion for Splash + Stellarium + Aladin  
Priority: Stability (A) + Consistency (B)  
Failure policy: Stay on current engine and provide manual retry (no auto engine switch)  
Acceptance standard: Automated tests only

## 1. Context and Goals

This design improves the existing loading system to ensure the complete star map load flow is correct, explicit, and recoverable without hidden simplifications.

Current load chain:

1. `app/starmap/page.tsx`: controls splash visibility and top-level boot hooks.
2. `components/starmap/view/stellarium-view.tsx`: mounts star map view.
3. `components/starmap/canvas/sky-map-canvas.tsx`: switches engine component by `skyEngine`.
4. `components/starmap/canvas/stellarium-canvas.tsx` + `lib/hooks/stellarium/use-stellarium-loader.ts`
5. `components/starmap/canvas/aladin-canvas.tsx` + `lib/hooks/aladin/use-aladin-loader.ts`
6. `components/starmap/canvas/components/loading-overlay.tsx`: visual loading/error/retry UI

Primary goals:

1. Eliminate stuck states and non-recoverable failures.
2. Unify loading behavior semantics between Stellarium and Aladin.
3. Keep existing feature scope, no automatic fallback engine switching.
4. Make behavior fully verifiable through automated tests.

## 2. Approaches and Decision

### Approach A (Chosen): Protocol unification + state-machine hardening in current architecture

- Keep current component/hook layering.
- Unify loader semantics and status contract across both engines.
- Strengthen timeout/retry/session handling and state transitions.

Trade-off:

- Pros: lowest regression risk, incremental delivery, aligns with current code organization.
- Cons: still two concrete loaders, not a single orchestrator implementation.

### Approach B: Introduce a shared loading orchestrator hook

- Build a new orchestrator to drive both engine loaders through one control plane.

Trade-off:

- Pros: strongest architectural unification.
- Cons: high refactor cost and regression risk now.

### Approach C: Full finite-state-machine framework rewrite

- Rebuild loading with an explicit FSM framework.

Trade-off:

- Pros: maximal formal rigor.
- Cons: over-engineering for current objective and timeline.

Decision: Use Approach A.

## 3. Target Architecture and Responsibilities

### 3.1 Unified loading contract

Both engines must expose and follow one shared semantic contract:

- Status stages: `idle | preparing | loading_script | initializing_engine | ready | retrying | failed | timed_out`
- Required state fields:
  - `isLoading`
  - `isReady`
  - `errorCode`
  - `errorMessage`
  - `retryCount`
  - `progress`
  - `sessionId`
  - `startedAt`
  - `deadlineAt`

### 3.2 Layer responsibilities

1. `SplashScreen`:
   - Handles splash lifecycle only.
   - Depends on readiness signal, not engine-specific details.

2. `StellariumView` / `SkyMapCanvas`:
   - Consume unified loader status only.
   - Do not implement engine-specific retry logic.

3. Engine loaders (`useStellariumLoader`, `useAladinLoader`):
   - Own initialization, timeout/retry, cleanup, and ready/fail transitions.

4. Store (`stellarium-store`):
   - Holds active engine instance and cross-engine saved view state.
   - Does not become a transient loading workflow state machine.

### 3.3 System invariants

1. Only one active load session per engine component mount.
2. `ready` and `failed/timed_out` are mutually exclusive terminal states.
3. Retry attempts share a single overall deadline window.
4. Engine switch restores saved view once, then clears saved state.

## 4. End-to-End Flow and State Transitions

### 4.1 Startup flow

1. Page mounts, splash may display by preference.
2. View mounts and canvas selects active engine component.
3. Loader transitions:
   - `preparing`
   - `loading_script` (when applicable)
   - `initializing_engine`
   - `ready`
4. Splash exits early when ready signal arrives; otherwise exits by configured minimum duration logic.

### 4.2 Failure and retry flow

1. Stage failure enters `retrying` if:
   - `retryCount < maxRetry`
   - `now < deadlineAt`
2. Otherwise terminal:
   - `timed_out` if overall deadline exceeded
   - `failed` for non-timeout terminal errors
3. User-triggered retry starts a new valid session path while preserving policy constraints.
4. No automatic engine switch on failure.

### 4.3 Engine switch flow

1. Before switch: save current view (`ra/dec/fov`).
2. Unmount old engine and clear helpers/listeners.
3. Mount new engine and start loader.
4. On ready: restore view once and clear saved view state.

## 5. Error Handling and Edge Cases

1. Container not ready (`null` or zero-size):
   - Retry via `ResizeObserver` + fallback timer.
   - Terminal timeout when overall deadline reached.

2. Script/WASM/init errors:
   - Surface explicit failure state and retry action.
   - Convert `onReady` callback exceptions into immediate load failure.

3. Concurrency/race:
   - Older sessions cannot overwrite latest session state.
   - Unmounted components cannot update state/store.

4. Readiness semantics:
   - `isReady` requires actual engine instance availability.
   - Progress is display-only and not the source of readiness truth.

## 6. Testing Strategy (Primary Acceptance)

Acceptance is based on automated tests only.

### 6.1 Loader unit/contract tests

1. Stellarium:
   - success path reaches `ready`
   - container never ready leads to overall timeout terminal
   - `onReady` throw produces immediate failure path
   - retry count and deadline respected
   - user retry restarts load attempt correctly

2. Aladin:
   - dynamic import timeout/error handled
   - retry recovers when possible
   - reload performs cleanup then re-init
   - status semantics aligned with Stellarium

### 6.2 Canvas/overlay integration tests

1. `SkyMapCanvas` saves view state on engine switch.
2. Restores once on new engine ready and clears saved state.
3. `LoadingOverlay` correctly renders:
   - loading state
   - error state
   - retry action
   - timeout terminal state

### 6.3 Splash-linkage tests

1. Splash can complete early on readiness signal.
2. No duplicate completion calls when fadeout already started.

## 7. Implementation Boundaries

In scope:

1. Loader semantics unification and resilience hardening.
2. Cross-engine consistency updates for status and retry behavior.
3. Automated tests required for the updated contract.

Out of scope:

1. Auto fallback to another engine.
2. Unrelated UI/feature changes in planning/search/management modules.
3. Major architectural rewrite to a brand-new orchestrator/FSM framework.

## 8. Planned File Touch Set

1. `lib/hooks/stellarium/use-stellarium-loader.ts`
2. `lib/hooks/aladin/use-aladin-loader.ts`
3. `components/starmap/canvas/stellarium-canvas.tsx`
4. `components/starmap/canvas/aladin-canvas.tsx`
5. `components/starmap/canvas/components/loading-overlay.tsx`
6. `components/starmap/canvas/sky-map-canvas.tsx` (if minor contract alignment needed)
7. Related test files under:
   - `lib/hooks/stellarium/__tests__/`
   - `lib/hooks/aladin/__tests__/`
   - `components/starmap/canvas/__tests__/`
   - `components/starmap/feedback/__tests__/` (splash linkage coverage as needed)

