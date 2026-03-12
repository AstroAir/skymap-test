import type { ARCameraCapabilityMap, ARCameraProfile } from '@/lib/core/ar-camera-profile';
import type {
  ARCameraAcquisitionStage,
  ARCameraLastKnownGoodAcquisition,
} from '@/lib/core/types/stellarium';

export type ARSessionStatus =
  | 'idle'
  | 'preflight'
  | 'ready'
  | 'degraded-camera-only'
  | 'degraded-sensor-only'
  | 'blocked';

export type ARRecoveryAction =
  | 'retry-camera'
  | 'switch-camera'
  | 'request-sensor-permission'
  | 'calibrate-sensor'
  | 'open-camera-settings'
  | 'revert-last-known-good-profile'
  | 'disable-ar';

export type ARCameraErrorType =
  | 'not-supported'
  | 'not-found'
  | 'permission-denied'
  | 'in-use'
  | 'unknown'
  | null;

export type ARSensorStatus =
  | 'idle'
  | 'unsupported'
  | 'permission-required'
  | 'permission-denied'
  | 'calibration-required'
  | 'degraded'
  | 'active'
  | 'error';

export type ARSensorDegradedReason =
  | 'relative-source'
  | 'low-confidence'
  | 'stale-sample'
  | null;

export interface ARCameraRuntimeDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface ARCameraAcquisitionDiagnostics {
  currentStage: ARCameraAcquisitionStage | null;
  attemptedStages: ARCameraAcquisitionStage[];
  lastFailureStage: ARCameraAcquisitionStage | null;
  lastFailureMessage: string | null;
  stalePreferredDevice: boolean;
  staleRememberedDevice: boolean;
  usedRememberedPlan: boolean;
  activeDevice: ARCameraRuntimeDevice | null;
}

export interface ARCameraRuntimeState {
  isSupported: boolean;
  isLoading: boolean;
  hasStream: boolean;
  errorType: ARCameraErrorType;
  capabilityMap: ARCameraCapabilityMap | null;
  effectiveProfile: ARCameraProfile | null;
  profileApplyError: string | null;
  profileFallbackReason: string | null;
  lastKnownGoodProfile: ARCameraProfile | null;
  lastKnownGoodAcquisition: ARCameraLastKnownGoodAcquisition | null;
  availableDevices: ARCameraRuntimeDevice[];
  acquisitionDiagnostics: ARCameraAcquisitionDiagnostics;
}

export interface ARSensorRuntimeState {
  isSupported: boolean;
  isPermissionGranted: boolean;
  status: ARSensorStatus;
  calibrationRequired: boolean;
  degradedReason: ARSensorDegradedReason;
  source: 'deviceorientationabsolute' | 'deviceorientation' | 'webkitCompassHeading' | 'none';
  accuracyDeg: number | null;
  error: string | null;
}

export interface ARSessionInput {
  enabled: boolean;
  showCompassPreference: boolean;
  camera: ARCameraRuntimeState;
  sensor: ARSensorRuntimeState;
}

export interface ARSessionStabilizationInput {
  previousStatus: ARSessionStatus;
  previousStatusSinceMs: number;
  nowMs: number;
  windowMs?: number;
}

export interface ARSessionDerivedState {
  status: ARSessionStatus;
  rawStatus: ARSessionStatus;
  isStabilizing: boolean;
  stabilizationRemainingMs: number;
  cameraLayerEnabled: boolean;
  sensorPointingEnabled: boolean;
  compassEnabled: boolean;
  needsUserAction: boolean;
  recoveryActions: ARRecoveryAction[];
}

export const DEFAULT_AR_SESSION_STABILIZATION_WINDOW_MS = 1200;

export const DEFAULT_AR_CAMERA_RUNTIME_STATE: ARCameraRuntimeState = {
  isSupported: true,
  isLoading: false,
  hasStream: false,
  errorType: null,
  capabilityMap: null,
  effectiveProfile: null,
  profileApplyError: null,
  profileFallbackReason: null,
  lastKnownGoodProfile: null,
  lastKnownGoodAcquisition: null,
  availableDevices: [],
  acquisitionDiagnostics: {
    currentStage: null,
    attemptedStages: [],
    lastFailureStage: null,
    lastFailureMessage: null,
    stalePreferredDevice: false,
    staleRememberedDevice: false,
    usedRememberedPlan: false,
    activeDevice: null,
  },
};

export const DEFAULT_AR_SENSOR_RUNTIME_STATE: ARSensorRuntimeState = {
  isSupported: true,
  isPermissionGranted: false,
  status: 'idle',
  calibrationRequired: true,
  degradedReason: null,
  source: 'none',
  accuracyDeg: null,
  error: null,
};

function uniqueActions(actions: ARRecoveryAction[]): ARRecoveryAction[] {
  return Array.from(new Set(actions));
}

function isFailureStatus(status: ARSessionStatus): boolean {
  return status === 'degraded-camera-only' || status === 'degraded-sensor-only' || status === 'blocked';
}

export function deriveARSessionState(
  input: ARSessionInput,
  stabilization?: ARSessionStabilizationInput
): ARSessionDerivedState {
  if (!input.enabled) {
    return {
      status: 'idle',
      rawStatus: 'idle',
      isStabilizing: false,
      stabilizationRemainingMs: 0,
      cameraLayerEnabled: false,
      sensorPointingEnabled: false,
      compassEnabled: false,
      needsUserAction: false,
      recoveryActions: [],
    };
  }

  const { camera, sensor, showCompassPreference } = input;

  const cameraOperational = camera.isSupported && camera.hasStream && !camera.errorType;
  const profileApplyFailed = Boolean(camera.profileApplyError);
  const sensorPermissionBlocked =
    sensor.status === 'permission-denied' ||
    sensor.status === 'permission-required' ||
    (!sensor.isPermissionGranted && sensor.status !== 'unsupported');
  const sensorCalibrationBlocked =
    sensor.calibrationRequired || sensor.status === 'calibration-required';
  const sensorDegraded = sensor.status === 'degraded';
  const sensorOperational =
    sensor.isSupported &&
    sensor.isPermissionGranted &&
    sensor.status === 'active' &&
    !sensorCalibrationBlocked;

  const preflightPending =
    camera.isLoading ||
    sensor.status === 'permission-required' ||
    sensor.status === 'idle';

  let rawStatus: ARSessionStatus;
  if (cameraOperational && sensorOperational && !profileApplyFailed) {
    rawStatus = 'ready';
  } else if (preflightPending) {
    rawStatus = 'preflight';
  } else if (profileApplyFailed && cameraOperational) {
    rawStatus = 'degraded-camera-only';
  } else if (cameraOperational && !sensorOperational) {
    rawStatus = 'degraded-camera-only';
  } else if (!cameraOperational && sensorOperational) {
    rawStatus = 'degraded-sensor-only';
  } else {
    rawStatus = 'blocked';
  }

  let status: ARSessionStatus = rawStatus;
  let isStabilizing = false;
  let stabilizationRemainingMs = 0;
  if (stabilization) {
    const windowMs = Math.max(0, stabilization.windowMs ?? DEFAULT_AR_SESSION_STABILIZATION_WINDOW_MS);
    const elapsedMs = Math.max(0, stabilization.nowMs - stabilization.previousStatusSinceMs);
    const previousStatus = stabilization.previousStatus;
    const previousStatusCanStabilize =
      previousStatus !== 'idle' &&
      !isFailureStatus(previousStatus);
    const transitioningToFailure =
      isFailureStatus(rawStatus) &&
      previousStatusCanStabilize;

    if (windowMs > 0 && transitioningToFailure && elapsedMs < windowMs) {
      status = previousStatus;
      isStabilizing = true;
      stabilizationRemainingMs = windowMs - elapsedMs;
    }
  }

  const recoveryActions: ARRecoveryAction[] = [];
  if (status !== 'ready' && !cameraOperational && !camera.isLoading && camera.errorType !== 'not-supported') {
    recoveryActions.push('retry-camera');
    if (camera.availableDevices.length > 1) {
      recoveryActions.push('switch-camera');
    }
  }
  if (status !== 'ready' && sensorPermissionBlocked) {
    recoveryActions.push('request-sensor-permission');
  }
  if (
    status !== 'ready' &&
    (sensorCalibrationBlocked || sensorDegraded) &&
    sensor.isPermissionGranted &&
    sensor.isSupported
  ) {
    recoveryActions.push('calibrate-sensor');
  }
  if (status !== 'ready' && profileApplyFailed) {
    recoveryActions.push('open-camera-settings');
    if (camera.lastKnownGoodProfile) {
      recoveryActions.push('revert-last-known-good-profile');
    }
  }
  if (status !== 'ready') {
    recoveryActions.push('disable-ar');
  }

  const cameraLayerEnabled =
    status === 'ready' || status === 'degraded-camera-only'
      ? true
      : status === 'preflight'
        ? cameraOperational
        : false;
  const sensorPointingEnabled =
    status === 'ready' || status === 'degraded-sensor-only'
      ? true
      : status === 'preflight'
        ? sensorOperational
        : false;
  const compassEnabled = showCompassPreference && sensorPointingEnabled;

  return {
    status,
    rawStatus,
    isStabilizing,
    stabilizationRemainingMs,
    cameraLayerEnabled,
    sensorPointingEnabled,
    compassEnabled,
    needsUserAction: status !== 'ready',
    recoveryActions: uniqueActions(recoveryActions),
  };
}
