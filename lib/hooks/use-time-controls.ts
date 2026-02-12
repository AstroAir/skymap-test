/**
 * Hook for Stellarium time control actions
 * Extracted from keyboard-shortcuts-manager for reuse
 */

import { useCallback } from 'react';
import { utcToMJD } from '@/lib/astronomy/starmap-utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StelInstance = any;

export interface TimeControlActions {
  /** Toggle pause/resume time flow */
  handlePauseTime: () => void;
  /** Double the current time speed (max 1024x) */
  handleSpeedUp: () => void;
  /** Halve the current time speed (min 1/1024x) */
  handleSlowDown: () => void;
  /** Reset to current real time with 1x speed */
  handleResetTime: () => void;
}

/**
 * Provides time control actions for the Stellarium engine
 *
 * @param stel - Stellarium engine instance (may be null during init)
 * @returns Time control action handlers
 */
export function useTimeControls(stel: StelInstance | null): TimeControlActions {
  const handlePauseTime = useCallback(() => {
    if (!stel) return;
    const currentSpeed = stel.core.time_speed;
    Object.assign(stel.core, { time_speed: currentSpeed === 0 ? 1 : 0 });
  }, [stel]);

  const handleSpeedUp = useCallback(() => {
    if (!stel) return;
    const currentSpeed = stel.core.time_speed;
    Object.assign(stel.core, { time_speed: Math.min(currentSpeed * 2, 1024) });
  }, [stel]);

  const handleSlowDown = useCallback(() => {
    if (!stel) return;
    const currentSpeed = stel.core.time_speed;
    Object.assign(stel.core, { time_speed: Math.max(currentSpeed / 2, 1 / 1024) });
  }, [stel]);

  const handleResetTime = useCallback(() => {
    if (!stel) return;
    const now = new Date();
    const mjd = utcToMJD(now);
    Object.assign(stel.core.observer, { utc: mjd });
    Object.assign(stel.core, { time_speed: 1 });
  }, [stel]);

  return {
    handlePauseTime,
    handleSpeedUp,
    handleSlowDown,
    handleResetTime,
  };
}
