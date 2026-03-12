import type { ARRecoveryAction } from '@/lib/core/ar-session';

export interface ARRecoveryActionHandlers {
  onRetryCamera: () => void;
  onSwitchCamera: () => void;
  onRequestSensorPermission: () => void;
  onCalibrateSensor: () => void;
  onOpenCameraSettings: () => void;
  onRevertLastKnownGoodProfile: () => void;
  onDisableAr: () => void;
}

export interface ExecuteARRecoveryActionOptions {
  onError?: (action: ARRecoveryAction, error: unknown) => void;
}

export function executeARRecoveryAction(
  action: ARRecoveryAction,
  handlers: ARRecoveryActionHandlers,
  options?: ExecuteARRecoveryActionOptions,
): boolean {
  try {
    if (action === 'retry-camera') {
      handlers.onRetryCamera();
      return true;
    }
    if (action === 'switch-camera') {
      handlers.onSwitchCamera();
      return true;
    }
    if (action === 'request-sensor-permission') {
      handlers.onRequestSensorPermission();
      return true;
    }
    if (action === 'calibrate-sensor') {
      handlers.onCalibrateSensor();
      return true;
    }
    if (action === 'open-camera-settings') {
      handlers.onOpenCameraSettings();
      return true;
    }
    if (action === 'revert-last-known-good-profile') {
      handlers.onRevertLastKnownGoodProfile();
      return true;
    }
    handlers.onDisableAr();
    return true;
  } catch (error) {
    options?.onError?.(action, error);
    return false;
  }
}
