import {
  DEFAULT_AR_CAMERA_RUNTIME_STATE,
  DEFAULT_AR_SENSOR_RUNTIME_STATE,
  deriveARSessionState,
  type ARCameraRuntimeState,
  type ARSessionInput,
  type ARSessionStabilizationInput,
  type ARSensorRuntimeState,
} from '../ar-session';

type ARSessionInputOverrides = Omit<Partial<ARSessionInput>, 'camera' | 'sensor'> & {
  camera?: Partial<ARCameraRuntimeState>;
  sensor?: Partial<ARSensorRuntimeState>;
};

function buildInput(overrides: ARSessionInputOverrides = {}): ARSessionInput {
  const {
    camera: cameraOverrides,
    sensor: sensorOverrides,
    ...restOverrides
  } = overrides;
  const camera: ARCameraRuntimeState = {
    ...DEFAULT_AR_CAMERA_RUNTIME_STATE,
    hasStream: true,
    ...cameraOverrides,
  };
  const sensor: ARSensorRuntimeState = {
    ...DEFAULT_AR_SENSOR_RUNTIME_STATE,
    isPermissionGranted: true,
    status: 'active',
    calibrationRequired: false,
    ...sensorOverrides,
  };

  return {
    enabled: true,
    showCompassPreference: true,
    camera,
    sensor,
    ...restOverrides,
  };
}

describe('deriveARSessionState', () => {
  const now = 10_000;

  function buildStabilization(overrides: Partial<ARSessionStabilizationInput> = {}): ARSessionStabilizationInput {
    return {
      previousStatus: 'ready',
      previousStatusSinceMs: now - 200,
      nowMs: now,
      windowMs: 1_000,
      ...overrides,
    };
  }

  it('returns idle state when AR is disabled', () => {
    const result = deriveARSessionState(buildInput({ enabled: false }));
    expect(result.status).toBe('idle');
    expect(result.rawStatus).toBe('idle');
    expect(result.isStabilizing).toBe(false);
    expect(result.cameraLayerEnabled).toBe(false);
    expect(result.sensorPointingEnabled).toBe(false);
    expect(result.compassEnabled).toBe(false);
    expect(result.needsUserAction).toBe(false);
  });

  it('returns ready when camera and sensor are operational', () => {
    const result = deriveARSessionState(buildInput());
    expect(result.status).toBe('ready');
    expect(result.rawStatus).toBe('ready');
    expect(result.cameraLayerEnabled).toBe(true);
    expect(result.sensorPointingEnabled).toBe(true);
    expect(result.compassEnabled).toBe(true);
    expect(result.needsUserAction).toBe(false);
  });

  it('returns preflight while camera is loading', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: true,
          isLoading: true,
          hasStream: false,
          errorType: null,
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: null,
          profileFallbackReason: null,
          lastKnownGoodProfile: null,
        },
      })
    );

    expect(result.status).toBe('preflight');
    expect(result.rawStatus).toBe('preflight');
    expect(result.needsUserAction).toBe(true);
  });

  it('returns degraded-camera-only when camera is operational but sensor needs calibration', () => {
    const result = deriveARSessionState(
      buildInput({
        sensor: {
          isSupported: true,
          isPermissionGranted: true,
          status: 'calibration-required',
          calibrationRequired: true,
          degradedReason: null,
          source: 'none',
          accuracyDeg: null,
          error: null,
        },
      })
    );

    expect(result.status).toBe('degraded-camera-only');
    expect(result.cameraLayerEnabled).toBe(true);
    expect(result.sensorPointingEnabled).toBe(false);
    expect(result.recoveryActions).toContain('calibrate-sensor');
  });

  it('treats degraded sensor confidence as camera-only degraded state', () => {
    const result = deriveARSessionState(
      buildInput({
        sensor: {
          isSupported: true,
          isPermissionGranted: true,
          status: 'degraded',
          calibrationRequired: false,
          degradedReason: 'low-confidence',
          source: 'webkitCompassHeading',
          accuracyDeg: 24,
          error: null,
        },
      })
    );

    expect(result.status).toBe('degraded-camera-only');
    expect(result.recoveryActions).toContain('calibrate-sensor');
  });

  it('returns degraded-sensor-only when sensor is operational but camera failed', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: true,
          isLoading: false,
          hasStream: false,
          errorType: 'in-use',
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: null,
          profileFallbackReason: null,
          lastKnownGoodProfile: null,
        },
      })
    );

    expect(result.status).toBe('degraded-sensor-only');
    expect(result.rawStatus).toBe('degraded-sensor-only');
    expect(result.cameraLayerEnabled).toBe(false);
    expect(result.sensorPointingEnabled).toBe(true);
    expect(result.recoveryActions).toContain('retry-camera');
  });

  it('returns blocked when camera and sensor are both unusable', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: false,
          isLoading: false,
          hasStream: false,
          errorType: 'not-supported',
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: null,
          profileFallbackReason: null,
          lastKnownGoodProfile: null,
        },
        sensor: {
          isSupported: false,
          isPermissionGranted: false,
          status: 'unsupported',
          calibrationRequired: true,
          degradedReason: null,
          source: 'none',
          accuracyDeg: null,
          error: null,
        },
      })
    );

    expect(result.status).toBe('blocked');
    expect(result.recoveryActions).toContain('disable-ar');
  });

  it('disables compass when preference is off', () => {
    const result = deriveARSessionState(
      buildInput({
        showCompassPreference: false,
      })
    );

    expect(result.status).toBe('ready');
    expect(result.compassEnabled).toBe(false);
  });

  it('keeps ready during stabilization window for transient degradation', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: true,
          isLoading: false,
          hasStream: false,
          errorType: 'in-use',
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: null,
          profileFallbackReason: null,
          lastKnownGoodProfile: null,
        },
      }),
      buildStabilization()
    );

    expect(result.status).toBe('ready');
    expect(result.rawStatus).toBe('degraded-sensor-only');
    expect(result.isStabilizing).toBe(true);
    expect(result.stabilizationRemainingMs).toBe(800);
    expect(result.recoveryActions).toEqual([]);
    expect(result.cameraLayerEnabled).toBe(true);
    expect(result.sensorPointingEnabled).toBe(true);
  });

  it('commits degraded status after stabilization window expires', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: true,
          isLoading: false,
          hasStream: false,
          errorType: 'in-use',
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: null,
          profileFallbackReason: null,
          lastKnownGoodProfile: null,
        },
      }),
      buildStabilization({
        previousStatusSinceMs: now - 1_200,
      })
    );

    expect(result.status).toBe('degraded-sensor-only');
    expect(result.rawStatus).toBe('degraded-sensor-only');
    expect(result.isStabilizing).toBe(false);
    expect(result.recoveryActions).toContain('retry-camera');
  });

  it('degrades AR and exposes camera-profile recovery actions when profile apply fails', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: true,
          isLoading: false,
          hasStream: true,
          errorType: null,
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: 'constraint failed',
          profileFallbackReason: 'profile_apply_failed',
          lastKnownGoodProfile: null,
        },
      }),
    );

    expect(result.status).toBe('degraded-camera-only');
    expect(result.recoveryActions).toEqual(expect.arrayContaining(['open-camera-settings', 'disable-ar']));
  });

  it('adds revert action when last known good profile exists', () => {
    const result = deriveARSessionState(
      buildInput({
        camera: {
          isSupported: true,
          isLoading: false,
          hasStream: true,
          errorType: null,
          capabilityMap: null,
          effectiveProfile: null,
          profileApplyError: 'constraint failed',
          profileFallbackReason: 'profile_apply_failed',
          lastKnownGoodProfile: {
            preset: 'balanced',
            facingMode: 'environment',
            resolutionTier: '1080p',
            targetFps: 30,
            overlayOpacity: 0.7,
            stabilizationStrength: 0.6,
            sensorSmoothingFactor: 0.2,
            calibrationSensitivity: 0.5,
            zoomLevel: 1,
            torchPreferred: false,
          },
        },
      }),
    );

    expect(result.recoveryActions).toContain('revert-last-known-good-profile');
  });
});
