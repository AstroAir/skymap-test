import type {
  ARCameraAcquisitionStage,
  ARCameraFacingMode,
  ARCameraLastKnownGoodAcquisition,
  ARCameraPreferredDevice,
} from '@/lib/core/types/stellarium';

export type {
  ARCameraAcquisitionStage,
  ARCameraLastKnownGoodAcquisition,
  ARCameraPreferredDevice,
} from '@/lib/core/types/stellarium';

export interface ARCameraAcquisitionDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface ARCameraAcquisitionAttempt {
  stage: ARCameraAcquisitionStage;
  deviceId?: string;
  facingMode?: ARCameraFacingMode;
  safeMode: boolean;
}

export interface BuildARCameraAcquisitionPlanOptions {
  devices: ARCameraAcquisitionDevice[];
  preferredDevice?: ARCameraPreferredDevice | null;
  lastKnownGood?: ARCameraLastKnownGoodAcquisition | null;
  requestedFacingMode: ARCameraFacingMode;
}

export interface ARCameraAcquisitionPlan {
  attempts: ARCameraAcquisitionAttempt[];
  stalePreferredDevice: boolean;
  staleRememberedDevice: boolean;
}

function matchesDevice(devices: ARCameraAcquisitionDevice[], deviceId: string | null | undefined): boolean {
  if (!deviceId) return false;
  return devices.some((device) => device.deviceId === deviceId);
}

function pushAttempt(
  attempts: ARCameraAcquisitionAttempt[],
  next: ARCameraAcquisitionAttempt,
): void {
  const exists = attempts.some(
    (attempt) => attempt.stage === next.stage
      && attempt.deviceId === next.deviceId
      && attempt.facingMode === next.facingMode
      && attempt.safeMode === next.safeMode,
  );
  if (!exists) {
    attempts.push(next);
  }
}

export function buildARCameraAcquisitionPlan(
  options: BuildARCameraAcquisitionPlanOptions,
): ARCameraAcquisitionPlan {
  const attempts: ARCameraAcquisitionAttempt[] = [];
  const requestedFacingMode = options.requestedFacingMode;
  const fallbackFacingMode: ARCameraFacingMode = requestedFacingMode === 'environment' ? 'user' : 'environment';

  const hasRememberedDevice = options.lastKnownGood?.deviceId
    ? matchesDevice(options.devices, options.lastKnownGood.deviceId)
    : Boolean(options.lastKnownGood?.stage);
  const hasPreferredDevice = matchesDevice(options.devices, options.preferredDevice?.deviceId);

  if (hasRememberedDevice && options.lastKnownGood?.deviceId) {
    pushAttempt(attempts, {
      stage: 'remembered-device',
      ...(options.lastKnownGood.deviceId ? { deviceId: options.lastKnownGood.deviceId } : {}),
      facingMode: options.lastKnownGood.facingMode,
      safeMode: options.lastKnownGood.stage?.includes('safe') ?? false,
    });
  }

  if (hasPreferredDevice && options.preferredDevice?.deviceId) {
    pushAttempt(attempts, {
      stage: 'preferred-device',
      deviceId: options.preferredDevice.deviceId,
      facingMode: requestedFacingMode,
      safeMode: false,
    });
  }

  pushAttempt(attempts, {
    stage: 'requested-facing-mode',
    facingMode: requestedFacingMode,
    safeMode: false,
  });
  pushAttempt(attempts, {
    stage: 'requested-facing-mode-safe',
    facingMode: requestedFacingMode,
    safeMode: true,
  });
  pushAttempt(attempts, {
    stage: 'fallback-facing-mode-safe',
    facingMode: fallbackFacingMode,
    safeMode: true,
  });
  pushAttempt(attempts, {
    stage: 'safe-default',
    safeMode: true,
  });

  return {
    attempts,
    stalePreferredDevice: Boolean(options.preferredDevice?.deviceId) && !hasPreferredDevice,
    staleRememberedDevice: Boolean(options.lastKnownGood?.deviceId) && !hasRememberedDevice,
  };
}
