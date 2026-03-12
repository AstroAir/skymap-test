import type { ARAdaptiveLearnerState } from '@/lib/core/types/stellarium';
import type { ARCameraProfile } from '@/lib/core/ar-camera-profile';

export type ARAdaptiveLearnerEvent =
  | {
      type: 'manual_profile_override';
      overrides: Partial<Pick<ARCameraProfile, 'resolutionTier' | 'targetFps' | 'stabilizationStrength' | 'sensorSmoothingFactor' | 'calibrationSensitivity'>>;
    }
  | {
      type: 'recommendation_accepted';
      applied: Partial<Pick<ARCameraProfile, 'resolutionTier' | 'targetFps' | 'stabilizationStrength' | 'sensorSmoothingFactor' | 'calibrationSensitivity'>>;
      at?: number;
    }
  | {
      type: 'recommendation_rejected';
    }
  | {
      type: 'session_summary';
      averageFps: number;
      recoveryActionsPerSession: number;
    };

const ALPHA = 0.25;

function rollingAverage(previous: number, next: number): number {
  if (!Number.isFinite(previous) || previous <= 0) return Math.max(0, next);
  return (1 - ALPHA) * previous + ALPHA * Math.max(0, next);
}

export function createDefaultARAdaptiveLearnerState(): ARAdaptiveLearnerState {
  return {
    version: 1,
    acceptedRecommendations: 0,
    rejectedRecommendations: 0,
    repeatedManualAdjustmentCount: 0,
    lastRecommendationAt: null,
    lastAcceptedAt: null,
    preferredProfileOverrides: {},
    aggregateSignals: {
      averageSessionFps: 0,
      averageRecoveryActionsPerSession: 0,
    },
  };
}

export function normalizeARAdaptiveLearnerState(
  state: ARAdaptiveLearnerState | undefined,
): ARAdaptiveLearnerState {
  const defaults = createDefaultARAdaptiveLearnerState();
  if (!state) return defaults;
  return {
    ...defaults,
    ...state,
    preferredProfileOverrides: {
      ...defaults.preferredProfileOverrides,
      ...state.preferredProfileOverrides,
    },
    aggregateSignals: {
      ...defaults.aggregateSignals,
      ...state.aggregateSignals,
    },
  };
}

export function applyARAdaptiveLearnerEvent(
  previous: ARAdaptiveLearnerState | undefined,
  event: ARAdaptiveLearnerEvent,
): ARAdaptiveLearnerState {
  const state = normalizeARAdaptiveLearnerState(previous);

  if (event.type === 'manual_profile_override') {
    return {
      ...state,
      repeatedManualAdjustmentCount: state.repeatedManualAdjustmentCount + 1,
      preferredProfileOverrides: {
        ...state.preferredProfileOverrides,
        ...event.overrides,
      },
    };
  }

  if (event.type === 'recommendation_accepted') {
    return {
      ...state,
      acceptedRecommendations: state.acceptedRecommendations + 1,
      lastAcceptedAt: event.at ?? Date.now(),
      preferredProfileOverrides: {
        ...state.preferredProfileOverrides,
        ...event.applied,
      },
    };
  }

  if (event.type === 'recommendation_rejected') {
    return {
      ...state,
      rejectedRecommendations: state.rejectedRecommendations + 1,
    };
  }

  return {
    ...state,
    aggregateSignals: {
      averageSessionFps: rollingAverage(state.aggregateSignals.averageSessionFps, event.averageFps),
      averageRecoveryActionsPerSession: rollingAverage(
        state.aggregateSignals.averageRecoveryActionsPerSession,
        event.recoveryActionsPerSession,
      ),
    },
  };
}

export function deriveARAdaptiveAdjustments(
  state: ARAdaptiveLearnerState | undefined,
  options: { enabled: boolean },
): Partial<ARCameraProfile> {
  if (!options.enabled) return {};
  const normalized = normalizeARAdaptiveLearnerState(state);

  if (normalized.repeatedManualAdjustmentCount < 2 && normalized.acceptedRecommendations === 0) {
    return {};
  }

  return {
    ...normalized.preferredProfileOverrides,
  };
}

export function buildARAdaptiveRecommendationSummary(
  adjustments: Partial<ARCameraProfile>,
): string {
  const parts: string[] = [];
  if (adjustments.resolutionTier) {
    parts.push(`resolution=${adjustments.resolutionTier}`);
  }
  if (typeof adjustments.targetFps === 'number') {
    parts.push(`fps=${Math.round(adjustments.targetFps)}`);
  }
  if (typeof adjustments.stabilizationStrength === 'number') {
    parts.push(`stabilization=${adjustments.stabilizationStrength.toFixed(2)}`);
  }
  if (typeof adjustments.sensorSmoothingFactor === 'number') {
    parts.push(`smoothing=${adjustments.sensorSmoothingFactor.toFixed(2)}`);
  }
  if (typeof adjustments.calibrationSensitivity === 'number') {
    parts.push(`calibration=${adjustments.calibrationSensitivity.toFixed(2)}`);
  }

  return parts.join(', ');
}

export function buildARAdaptiveTelemetryPayload(
  state: ARAdaptiveLearnerState | undefined,
): Record<string, unknown> {
  const normalized = normalizeARAdaptiveLearnerState(state);
  return {
    version: normalized.version,
    acceptedRecommendations: normalized.acceptedRecommendations,
    rejectedRecommendations: normalized.rejectedRecommendations,
    repeatedManualAdjustmentCount: normalized.repeatedManualAdjustmentCount,
    aggregateSignals: {
      averageSessionFps: normalized.aggregateSignals.averageSessionFps,
      averageRecoveryActionsPerSession: normalized.aggregateSignals.averageRecoveryActionsPerSession,
    },
    // Explicitly limited to aggregate signals and counts.
    includesRawCameraMedia: false,
  };
}
