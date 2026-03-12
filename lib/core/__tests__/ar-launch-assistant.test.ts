import {
  DEFAULT_AR_CAMERA_RUNTIME_STATE,
  DEFAULT_AR_SENSOR_RUNTIME_STATE,
  deriveARSessionState,
} from '@/lib/core/ar-session';
import {
  deriveARLaunchAssistantState,
  type ARLaunchAssistantInput,
} from '@/lib/core/ar-launch-assistant';

function buildInput(overrides: Partial<ARLaunchAssistantInput> = {}): ARLaunchAssistantInput {
  const camera = {
    ...DEFAULT_AR_CAMERA_RUNTIME_STATE,
    isSupported: true,
    hasStream: true,
    errorType: null,
    ...overrides.camera,
  };
  const sensor = {
    ...DEFAULT_AR_SENSOR_RUNTIME_STATE,
    isSupported: true,
    isPermissionGranted: true,
    status: 'active' as const,
    calibrationRequired: false,
    ...overrides.sensor,
  };

  const session =
    overrides.session
    ?? deriveARSessionState({
      enabled: overrides.enabled ?? true,
      showCompassPreference: true,
      camera,
      sensor,
    });

  return {
    enabled: true,
    requested: true,
    degradedConfirmed: false,
    camera,
    sensor,
    session,
    ...overrides,
  };
}

describe('deriveARLaunchAssistantState', () => {
  it('marks all checks passed and auto-closes when AR is ready', () => {
    const result = deriveARLaunchAssistantState(buildInput());

    expect(result.phase).toBe('summary');
    expect(result.outcome).toBe('ready');
    expect(result.shouldAutoClose).toBe(true);
    expect(result.checks.map((check) => check.status)).toEqual(['pass', 'pass', 'pass']);
  });

  it('keeps sensor step active and allows degraded continuation when sensor permission is missing', () => {
    const result = deriveARLaunchAssistantState(buildInput({
      sensor: {
        ...DEFAULT_AR_SENSOR_RUNTIME_STATE,
        isSupported: true,
        isPermissionGranted: false,
        status: 'permission-denied',
        calibrationRequired: true,
      },
      session: deriveARSessionState({
        enabled: true,
        showCompassPreference: true,
        camera: {
          ...DEFAULT_AR_CAMERA_RUNTIME_STATE,
          isSupported: true,
          hasStream: true,
        },
        sensor: {
          ...DEFAULT_AR_SENSOR_RUNTIME_STATE,
          isSupported: true,
          isPermissionGranted: false,
          status: 'permission-denied',
          calibrationRequired: true,
        },
      }),
    }));

    expect(result.phase).toBe('sensor-check');
    expect(result.outcome).toBe('degraded');
    expect(result.canContinueDegraded).toBe(true);
    expect(result.checks.find((check) => check.key === 'sensor')?.status).toBe('block');
    expect(result.summaryActions).toContain('request-sensor-permission');
  });

  it('stays on camera step and blocks launch when camera is unavailable', () => {
    const result = deriveARLaunchAssistantState(buildInput({
      camera: {
        ...DEFAULT_AR_CAMERA_RUNTIME_STATE,
        isSupported: false,
        hasStream: false,
        errorType: 'not-supported',
      },
      sensor: {
        ...DEFAULT_AR_SENSOR_RUNTIME_STATE,
        isSupported: false,
        isPermissionGranted: false,
        status: 'unsupported',
      },
      session: deriveARSessionState({
        enabled: true,
        showCompassPreference: true,
        camera: {
          ...DEFAULT_AR_CAMERA_RUNTIME_STATE,
          isSupported: false,
          hasStream: false,
          errorType: 'not-supported',
        },
        sensor: {
          ...DEFAULT_AR_SENSOR_RUNTIME_STATE,
          isSupported: false,
          isPermissionGranted: false,
          status: 'unsupported',
        },
      }),
    }));

    expect(result.phase).toBe('camera-check');
    expect(result.outcome).toBe('blocked');
    expect(result.canContinueDegraded).toBe(false);
    expect(result.checks.find((check) => check.key === 'camera')?.status).toBe('block');
  });
});
