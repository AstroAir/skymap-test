import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveARLaunchAssistantState } from '@/lib/core/ar-launch-assistant';
import {
  DEFAULT_AR_SESSION_STABILIZATION_WINDOW_MS,
  deriveARSessionState,
  type ARSessionStatus,
  type ARSessionDerivedState,
  type ARSessionInput,
} from '@/lib/core/ar-session';
import { useSettingsStore } from '@/lib/stores';
import { useARRuntimeStore } from '@/lib/stores/ar-runtime-store';

interface UseARSessionStatusOptions {
  enabled?: boolean;
}

function isFailureStatus(status: ARSessionStatus): boolean {
  return status === 'degraded-camera-only' || status === 'degraded-sensor-only' || status === 'blocked';
}

export function useARSessionStatus(
  options: UseARSessionStatusOptions = {}
): ARSessionDerivedState {
  const arMode = useSettingsStore((state) => state.stellarium.arMode);
  const arShowCompass = useSettingsStore((state) => state.stellarium.arShowCompass);
  const cameraRuntime = useARRuntimeStore((state) => state.camera);
  const sensorRuntime = useARRuntimeStore((state) => state.sensor);
  const launchAssistant = useARRuntimeStore((state) => state.launchAssistant);
  const syncLaunchAssistant = useARRuntimeStore((state) => state.syncLaunchAssistant);
  const closeLaunchAssistant = useARRuntimeStore((state) => state.closeLaunchAssistant);
  const resetLaunchAssistant = useARRuntimeStore((state) => state.resetLaunchAssistant);

  const enabled = options.enabled ?? arMode;
  const input = useMemo<ARSessionInput>(
    () => ({
      enabled,
      showCompassPreference: arShowCompass,
      camera: cameraRuntime,
      sensor: sensorRuntime,
    }),
    [enabled, arShowCompass, cameraRuntime, sensorRuntime]
  );

  const [failureHold, setFailureHold] = useState<{
    holdStatus: ARSessionStatus;
    remainingMs: number;
  } | null>(null);
  const statusRef = useRef<ARSessionStatus>(enabled ? 'preflight' : 'idle');

  const baseDerived = useMemo(
    () => deriveARSessionState(input),
    [input]
  );

  useEffect(() => {
    if (!enabled || !isFailureStatus(baseDerived.status)) {
      if (failureHold) {
        const clearTimerId = window.setTimeout(() => {
          setFailureHold(null);
        }, 0);
        return () => {
          window.clearTimeout(clearTimerId);
        };
      }
      return;
    }
    if (failureHold) return;

    const previousStableStatus = statusRef.current;
    if (previousStableStatus === 'idle' || isFailureStatus(previousStableStatus)) {
      return;
    }
    setFailureHold({
      holdStatus: previousStableStatus,
      remainingMs: DEFAULT_AR_SESSION_STABILIZATION_WINDOW_MS,
    });
  }, [baseDerived.status, enabled, failureHold]);

  useEffect(() => {
    if (!failureHold || failureHold.remainingMs <= 0) return;
    const timerId = window.setTimeout(() => {
      setFailureHold(null);
    }, failureHold.remainingMs);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [failureHold]);

  const derived = useMemo<ARSessionDerivedState>(() => {
    if (!failureHold || failureHold.remainingMs <= 0 || !isFailureStatus(baseDerived.status)) {
      return baseDerived;
    }

    return deriveARSessionState(input, {
      previousStatus: failureHold.holdStatus,
      previousStatusSinceMs: 0,
      nowMs: 0,
      windowMs: failureHold.remainingMs,
    });
  }, [baseDerived, failureHold, input]);

  useEffect(() => {
    statusRef.current = derived.status;
  }, [derived.status]);

  useEffect(() => {
    if (!enabled) {
      statusRef.current = 'idle';
      resetLaunchAssistant();
    }
  }, [enabled, resetLaunchAssistant]);

  useEffect(() => {
    if (!enabled) return;

    const nextLaunchState = deriveARLaunchAssistantState({
      enabled,
      requested: launchAssistant.visible,
      degradedConfirmed: launchAssistant.degradedConfirmed,
      session: derived,
      camera: cameraRuntime,
      sensor: sensorRuntime,
    });

    syncLaunchAssistant({
      phase: nextLaunchState.phase,
      outcome: nextLaunchState.outcome,
      checks: nextLaunchState.checks,
      summaryActions: nextLaunchState.summaryActions,
      activeDeviceLabel: nextLaunchState.activeDeviceLabel,
      currentAcquisitionStage: nextLaunchState.currentAcquisitionStage,
    });

    if (launchAssistant.visible && nextLaunchState.shouldAutoClose) {
      const timerId = window.setTimeout(() => {
        closeLaunchAssistant();
      }, 0);
      return () => {
        window.clearTimeout(timerId);
      };
    }
  }, [
    cameraRuntime,
    closeLaunchAssistant,
    derived,
    enabled,
    launchAssistant.degradedConfirmed,
    launchAssistant.visible,
    sensorRuntime,
    syncLaunchAssistant,
  ]);

  return derived;
}
