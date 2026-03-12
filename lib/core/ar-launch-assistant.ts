import type {
  ARCameraRuntimeState,
  ARRecoveryAction,
  ARSensorRuntimeState,
  ARSessionDerivedState,
} from '@/lib/core/ar-session';

export type ARLaunchAssistantReason = 'enter-ar' | 'recheck' | 'settings' | 'recovery';

export type ARLaunchAssistantPhase =
  | 'idle'
  | 'camera-check'
  | 'sensor-check'
  | 'calibration-check'
  | 'summary'
  | 'completed';

export type ARLaunchAssistantOutcome = 'idle' | 'checking' | 'ready' | 'degraded' | 'blocked';

export type ARLaunchAssistantCheckKey = 'camera' | 'sensor' | 'calibration';
export type ARLaunchAssistantCheckStatus = 'pending' | 'pass' | 'warn' | 'block';

export interface ARLaunchAssistantCheck {
  key: ARLaunchAssistantCheckKey;
  status: ARLaunchAssistantCheckStatus;
  titleKey: string;
  detailKey: string;
}

export interface ARLaunchAssistantRuntimeState {
  visible: boolean;
  reason: ARLaunchAssistantReason | null;
  phase: ARLaunchAssistantPhase;
  outcome: ARLaunchAssistantOutcome;
  checks: ARLaunchAssistantCheck[];
  summaryActions: ARRecoveryAction[];
  degradedConfirmed: boolean;
  requestedAt: number | null;
  lastStepAt: number | null;
  lastResumeAt: number | null;
  resumeCount: number;
  activeDeviceLabel: string | null;
  currentAcquisitionStage: string | null;
}

export interface ARLaunchAssistantInput {
  enabled: boolean;
  requested: boolean;
  degradedConfirmed: boolean;
  session: ARSessionDerivedState;
  camera: ARCameraRuntimeState;
  sensor: ARSensorRuntimeState;
}

export interface ARLaunchAssistantDerivedState extends ARLaunchAssistantRuntimeState {
  shouldAutoClose: boolean;
  canContinueDegraded: boolean;
}

export const DEFAULT_AR_LAUNCH_ASSISTANT_STATE: ARLaunchAssistantRuntimeState = {
  visible: false,
  reason: null,
  phase: 'idle',
  outcome: 'idle',
  checks: [],
  summaryActions: [],
  degradedConfirmed: false,
  requestedAt: null,
  lastStepAt: null,
  lastResumeAt: null,
  resumeCount: 0,
  activeDeviceLabel: null,
  currentAcquisitionStage: null,
};

function uniqueActions(actions: ARRecoveryAction[]): ARRecoveryAction[] {
  return Array.from(new Set(actions));
}

function deriveCameraCheck(camera: ARCameraRuntimeState): ARLaunchAssistantCheck {
  if (camera.hasStream) {
    return {
      key: 'camera',
      status: 'pass',
      titleKey: 'settings.arLaunchCameraCheck',
      detailKey: 'settings.arStatusReady',
    };
  }

  if (camera.isLoading) {
    return {
      key: 'camera',
      status: 'pending',
      titleKey: 'settings.arLaunchCameraCheck',
      detailKey: 'settings.arStatusPreflight',
    };
  }

  if (!camera.isSupported || camera.errorType === 'not-supported') {
    return {
      key: 'camera',
      status: 'block',
      titleKey: 'settings.arLaunchCameraCheck',
      detailKey: 'settings.arNotSupported',
    };
  }

  if (camera.errorType === 'permission-denied') {
    return {
      key: 'camera',
      status: 'block',
      titleKey: 'settings.arLaunchCameraCheck',
      detailKey: 'settings.arCameraPermission',
    };
  }

  return {
    key: 'camera',
    status: camera.errorType ? 'block' : 'pending',
    titleKey: 'settings.arLaunchCameraCheck',
    detailKey: 'settings.arCameraError',
  };
}

function deriveSensorCheck(sensor: ARSensorRuntimeState): ARLaunchAssistantCheck {
  if (!sensor.isSupported || sensor.status === 'unsupported') {
    return {
      key: 'sensor',
      status: 'warn',
      titleKey: 'settings.arLaunchSensorCheck',
      detailKey: 'settings.sensorStatusUnsupported',
    };
  }

  if (sensor.status === 'active') {
    return {
      key: 'sensor',
      status: 'pass',
      titleKey: 'settings.arLaunchSensorCheck',
      detailKey: 'settings.sensorStatusActive',
    };
  }

  if (sensor.status === 'degraded') {
    return {
      key: 'sensor',
      status: 'warn',
      titleKey: 'settings.arLaunchSensorCheck',
      detailKey: 'settings.sensorStatusDegraded',
    };
  }

  if (sensor.status === 'permission-denied') {
    return {
      key: 'sensor',
      status: 'block',
      titleKey: 'settings.arLaunchSensorCheck',
      detailKey: 'settings.sensorStatusPermissionDenied',
    };
  }

  if (sensor.status === 'permission-required') {
    return {
      key: 'sensor',
      status: 'block',
      titleKey: 'settings.arLaunchSensorCheck',
      detailKey: 'settings.sensorControlPermission',
    };
  }

  if (sensor.status === 'error') {
    return {
      key: 'sensor',
      status: 'block',
      titleKey: 'settings.arLaunchSensorCheck',
      detailKey: 'settings.sensorStatusDegraded',
    };
  }

  return {
    key: 'sensor',
    status: 'pending',
    titleKey: 'settings.arLaunchSensorCheck',
    detailKey: 'settings.arStatusPreflight',
  };
}

function deriveCalibrationCheck(sensor: ARSensorRuntimeState): ARLaunchAssistantCheck {
  if (!sensor.isSupported || sensor.status === 'unsupported') {
    return {
      key: 'calibration',
      status: 'warn',
      titleKey: 'settings.arLaunchCalibrationCheck',
      detailKey: 'settings.sensorContinueManualNavigation',
    };
  }

  if (!sensor.isPermissionGranted && sensor.status !== 'active') {
    return {
      key: 'calibration',
      status: 'pending',
      titleKey: 'settings.arLaunchCalibrationCheck',
      detailKey: 'settings.sensorControlPermission',
    };
  }

  if (sensor.calibrationRequired || sensor.status === 'calibration-required') {
    return {
      key: 'calibration',
      status: 'block',
      titleKey: 'settings.arLaunchCalibrationCheck',
      detailKey: 'settings.sensorCalibrationRequired',
    };
  }

  return {
    key: 'calibration',
    status: 'pass',
    titleKey: 'settings.arLaunchCalibrationCheck',
    detailKey: 'settings.arStatusReady',
  };
}

function derivePhase(checks: ARLaunchAssistantCheck[]): ARLaunchAssistantPhase {
  const cameraCheck = checks.find((check) => check.key === 'camera');
  const sensorCheck = checks.find((check) => check.key === 'sensor');
  const calibrationCheck = checks.find((check) => check.key === 'calibration');

  if (cameraCheck && (cameraCheck.status === 'pending' || cameraCheck.status === 'block')) {
    return 'camera-check';
  }

  if (sensorCheck && (sensorCheck.status === 'pending' || sensorCheck.status === 'block')) {
    return 'sensor-check';
  }

  if (calibrationCheck && (calibrationCheck.status === 'pending' || calibrationCheck.status === 'block')) {
    return 'calibration-check';
  }

  return 'summary';
}

function deriveOutcome(session: ARSessionDerivedState): ARLaunchAssistantOutcome {
  if (session.status === 'ready') return 'ready';
  if (session.status === 'degraded-camera-only' || session.status === 'degraded-sensor-only') return 'degraded';
  if (session.status === 'blocked') return 'blocked';
  if (session.status === 'preflight') return 'checking';
  return 'idle';
}

export function deriveARLaunchAssistantState(
  input: ARLaunchAssistantInput,
): ARLaunchAssistantDerivedState {
  if (!input.enabled) {
    return {
      ...DEFAULT_AR_LAUNCH_ASSISTANT_STATE,
      shouldAutoClose: false,
      canContinueDegraded: false,
    };
  }

  const checks = [
    deriveCameraCheck(input.camera),
    deriveSensorCheck(input.sensor),
    deriveCalibrationCheck(input.sensor),
  ];

  const outcome = deriveOutcome(input.session);
  const canContinueDegraded = outcome === 'degraded' && !input.degradedConfirmed;
  const shouldAutoClose = input.requested && outcome === 'ready';

  return {
    visible: input.requested && !(input.degradedConfirmed && outcome === 'degraded'),
    reason: null,
    phase: derivePhase(checks),
    outcome,
    checks,
    summaryActions: uniqueActions(input.session.recoveryActions),
    degradedConfirmed: input.degradedConfirmed,
    requestedAt: null,
    lastStepAt: null,
    lastResumeAt: null,
    resumeCount: 0,
    activeDeviceLabel: input.camera.acquisitionDiagnostics.activeDevice?.label ?? null,
    currentAcquisitionStage: input.camera.acquisitionDiagnostics.currentStage,
    shouldAutoClose,
    canContinueDegraded,
  };
}
