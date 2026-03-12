import {
  applyARAdaptiveLearnerEvent,
  buildARAdaptiveRecommendationSummary,
  buildARAdaptiveTelemetryPayload,
  createDefaultARAdaptiveLearnerState,
  deriveARAdaptiveAdjustments,
} from '@/lib/core/ar-adaptive-learner';

describe('ar-adaptive-learner', () => {
  it('tracks manual overrides and derives adaptive adjustments', () => {
    let state = createDefaultARAdaptiveLearnerState();

    state = applyARAdaptiveLearnerEvent(state, {
      type: 'manual_profile_override',
      overrides: { targetFps: 24, resolutionTier: '720p' },
    });
    state = applyARAdaptiveLearnerEvent(state, {
      type: 'manual_profile_override',
      overrides: { stabilizationStrength: 0.72 },
    });

    const adjustments = deriveARAdaptiveAdjustments(state, { enabled: true });
    expect(adjustments.targetFps).toBe(24);
    expect(adjustments.resolutionTier).toBe('720p');
    expect(adjustments.stabilizationStrength).toBeCloseTo(0.72, 3);
  });

  it('stops producing adjustments when adaptive learning is disabled', () => {
    const state = applyARAdaptiveLearnerEvent(createDefaultARAdaptiveLearnerState(), {
      type: 'manual_profile_override',
      overrides: { targetFps: 24 },
    });

    const adjustments = deriveARAdaptiveAdjustments(state, { enabled: false });
    expect(adjustments).toEqual({});
  });

  it('updates acceptance/rejection counters', () => {
    let state = createDefaultARAdaptiveLearnerState();

    state = applyARAdaptiveLearnerEvent(state, {
      type: 'recommendation_accepted',
      applied: { sensorSmoothingFactor: 0.18 },
      at: 123,
    });
    state = applyARAdaptiveLearnerEvent(state, { type: 'recommendation_rejected' });

    expect(state.acceptedRecommendations).toBe(1);
    expect(state.rejectedRecommendations).toBe(1);
    expect(state.lastAcceptedAt).toBe(123);
  });

  it('builds aggregate-only telemetry payload', () => {
    let state = createDefaultARAdaptiveLearnerState();
    state = applyARAdaptiveLearnerEvent(state, {
      type: 'session_summary',
      averageFps: 26,
      recoveryActionsPerSession: 1,
    });

    const payload = buildARAdaptiveTelemetryPayload(state);
    expect(payload.includesRawCameraMedia).toBe(false);
    expect((payload.aggregateSignals as { averageSessionFps: number }).averageSessionFps).toBeGreaterThan(0);
  });

  it('builds explainable recommendation summary', () => {
    const summary = buildARAdaptiveRecommendationSummary({
      targetFps: 25,
      resolutionTier: '1080p',
      stabilizationStrength: 0.66,
    });

    expect(summary).toContain('fps=25');
    expect(summary).toContain('resolution=1080p');
    expect(summary).toContain('stabilization=0.66');
  });
});
