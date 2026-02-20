'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { raDecToAltAzAtTime } from '@/lib/astronomy/coordinates/transforms';
import {
  deviceEulerToSkyDirection,
  normalizeAngle360,
  normalizeAngleSigned180,
} from '@/lib/astronomy/coordinates/device-attitude';

export interface DeviceOrientation {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

export interface SkyDirection {
  azimuth: number;
  altitude: number;
}

export type OrientationSource =
  | 'deviceorientationabsolute'
  | 'deviceorientation'
  | 'webkitCompassHeading'
  | 'none';

export type SensorStatus =
  | 'idle'
  | 'unsupported'
  | 'permission-required'
  | 'permission-denied'
  | 'calibration-required'
  | 'active'
  | 'error';

export interface SensorCalibrationState {
  azimuthOffsetDeg: number;
  altitudeOffsetDeg: number;
  updatedAt: number | null;
  required: boolean;
}

export interface CalibrationReference {
  raDeg: number;
  decDeg: number;
  latitude: number;
  longitude: number;
  at: Date;
}

interface UseDeviceOrientationOptions {
  enabled?: boolean;
  smoothingFactor?: number;
  updateHz?: number;
  deadbandDeg?: number;
  absolutePreferred?: boolean;
  useCompassHeading?: boolean;
  calibration?: SensorCalibrationState;
  onCalibrationChange?: (state: SensorCalibrationState) => void;
  onOrientationChange?: (direction: SkyDirection) => void;
}

interface UseDeviceOrientationReturn {
  orientation: DeviceOrientation | null;
  skyDirection: SkyDirection | null;
  isSupported: boolean;
  isPermissionGranted: boolean;
  status: SensorStatus;
  source: OrientationSource;
  accuracyDeg: number | null;
  calibration: SensorCalibrationState;
  requestPermission: () => Promise<boolean>;
  calibrateToCurrentView: (reference: CalibrationReference) => void;
  resetCalibration: () => void;
  error: string | null;
}

interface OrientationSample {
  alpha: number;
  beta: number;
  gamma: number;
  absolute: boolean;
  source: OrientationSource;
  accuracyDeg: number | null;
  timestamp: number;
}

interface DeviceOrientationEventIOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

const DEFAULT_CALIBRATION: SensorCalibrationState = {
  azimuthOffsetDeg: 0,
  altitudeOffsetDeg: 0,
  updatedAt: null,
  required: true,
};

const ABSOLUTE_SAMPLE_HOLD_MS = 1500;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeCalibration(
  calibration?: SensorCalibrationState
): SensorCalibrationState {
  if (!calibration) return DEFAULT_CALIBRATION;
  return {
    azimuthOffsetDeg: Number.isFinite(calibration.azimuthOffsetDeg)
      ? calibration.azimuthOffsetDeg
      : 0,
    altitudeOffsetDeg: Number.isFinite(calibration.altitudeOffsetDeg)
      ? calibration.altitudeOffsetDeg
      : 0,
    updatedAt: calibration.updatedAt ?? null,
    required: calibration.required ?? true,
  };
}

function supportsDeviceOrientation(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

function usesPermissionRequestApi(): boolean {
  if (!supportsDeviceOrientation()) return false;
  const deviceOrientationEventType = DeviceOrientationEvent as unknown as {
    requestPermission?: (absolute?: boolean) => Promise<'granted' | 'denied' | string>;
  };
  return typeof deviceOrientationEventType.requestPermission === 'function';
}

function getScreenAngleDeg(): number {
  if (typeof window === 'undefined') return 0;

  if (window.screen?.orientation && typeof window.screen.orientation.angle === 'number') {
    return window.screen.orientation.angle;
  }

  const legacyOrientation = (window as Window & { orientation?: number }).orientation;
  if (typeof legacyOrientation === 'number') {
    return legacyOrientation;
  }

  return 0;
}

function applySmoothing(
  previous: SkyDirection | null,
  next: SkyDirection,
  factor: number
): SkyDirection {
  if (!previous) return next;

  let azimuthDiff = normalizeAngleSigned180(next.azimuth - previous.azimuth);
  azimuthDiff *= factor;

  return {
    azimuth: normalizeAngle360(previous.azimuth + azimuthDiff),
    altitude: previous.altitude + (next.altitude - previous.altitude) * factor,
  };
}

function applyCalibration(
  direction: SkyDirection,
  calibration: SensorCalibrationState
): SkyDirection {
  return {
    azimuth: normalizeAngle360(direction.azimuth + calibration.azimuthOffsetDeg),
    altitude: clamp(direction.altitude + calibration.altitudeOffsetDeg, -90, 90),
  };
}

function isWithinDeadband(
  previous: SkyDirection | null,
  next: SkyDirection,
  deadbandDeg: number
): boolean {
  if (!previous) return false;
  const azimuthDiff = Math.abs(normalizeAngleSigned180(next.azimuth - previous.azimuth));
  const altitudeDiff = Math.abs(next.altitude - previous.altitude);
  return azimuthDiff < deadbandDeg && altitudeDiff < deadbandDeg;
}

/**
 * Hook for device orientation/gyroscope control.
 * Includes source prioritization, screen orientation compensation, throttling,
 * deadband handling, and persisted calibration support.
 */
export function useDeviceOrientation(
  options: UseDeviceOrientationOptions = {}
): UseDeviceOrientationReturn {
  const {
    enabled = false,
    smoothingFactor = 0.2,
    updateHz = 30,
    deadbandDeg = 0.35,
    absolutePreferred = true,
    useCompassHeading = true,
    calibration,
    onCalibrationChange,
    onOrientationChange,
  } = options;
  const normalizedCalibration = useMemo(
    () => normalizeCalibration(calibration),
    [calibration]
  );
  const isCalibrationControlled = calibration !== undefined && typeof onCalibrationChange === 'function';

  const [orientation, setOrientation] = useState<DeviceOrientation | null>(null);
  const [skyDirection, setSkyDirection] = useState<SkyDirection | null>(null);
  const [isSupported] = useState(supportsDeviceOrientation);
  const [isPermissionGranted, setIsPermissionGranted] = useState(
    () => isSupported && !usesPermissionRequestApi()
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [source, setSource] = useState<OrientationSource>('none');
  const [accuracyDeg, setAccuracyDeg] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSample, setHasActiveSample] = useState(false);
  const [uncontrolledCalibrationState, setUncontrolledCalibrationState] = useState<SensorCalibrationState>(
    normalizedCalibration
  );
  const calibrationState = isCalibrationControlled
    ? normalizedCalibration
    : uncontrolledCalibrationState;

  const callbackRef = useRef(onOrientationChange);
  const calibrationCallbackRef = useRef(onCalibrationChange);
  const latestSampleRef = useRef<OrientationSample | null>(null);
  const latestRawDirectionRef = useRef<SkyDirection | null>(null);
  const smoothedDirectionRef = useRef<SkyDirection | null>(null);
  const emittedDirectionRef = useRef<SkyDirection | null>(null);
  const calibrationRef = useRef<SensorCalibrationState>(normalizedCalibration);
  const screenAngleRef = useRef(getScreenAngleDeg());
  const lastAbsoluteSampleAtRef = useRef(0);
  const lastProcessedAtRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = onOrientationChange;
  }, [onOrientationChange]);

  useEffect(() => {
    calibrationCallbackRef.current = onCalibrationChange;
  }, [onCalibrationChange]);

  useEffect(() => {
    calibrationRef.current = calibrationState;
  }, [calibrationState]);

  const updateCalibrationState = useCallback((next: SensorCalibrationState) => {
    calibrationRef.current = next;
    if (!isCalibrationControlled) {
      setUncontrolledCalibrationState(next);
    }
    calibrationCallbackRef.current?.(next);
  }, [isCalibrationControlled]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Device orientation not supported');
      return false;
    }

    const deviceOrientationEventType = DeviceOrientationEvent as unknown as {
      requestPermission?: (absolute?: boolean) => Promise<'granted' | 'denied' | string>;
    };

    try {
      if (typeof deviceOrientationEventType.requestPermission === 'function') {
        let permission: string | null = null;

        try {
          permission = await deviceOrientationEventType.requestPermission(true);
        } catch {
          // Fallback to old API signature without absolute argument
          permission = null;
        }

        if (permission !== 'granted') {
          permission = await deviceOrientationEventType.requestPermission();
        }

        const granted = permission === 'granted';
        setIsPermissionGranted(granted);
        setPermissionDenied(!granted);
        if (!granted) {
          setError('Permission denied');
        } else {
          setError(null);
        }
        return granted;
      }

      setIsPermissionGranted(true);
      setPermissionDenied(false);
      setError(null);
      return true;
    } catch (permissionError) {
      const message = permissionError instanceof Error
        ? permissionError.message
        : 'Failed to request permission';
      setError(message);
      setPermissionDenied(true);
      return false;
    }
  }, [isSupported]);

  const calibrateToCurrentView = useCallback((reference: CalibrationReference) => {
    const measured = latestRawDirectionRef.current ?? (() => {
      const sample = latestSampleRef.current;
      if (!sample) return null;
      const direction = deviceEulerToSkyDirection(
        {
          alphaDeg: sample.alpha,
          betaDeg: sample.beta,
          gammaDeg: sample.gamma,
        },
        screenAngleRef.current
      );
      latestRawDirectionRef.current = direction;
      return direction;
    })();
    if (!measured) {
      setError('No sensor sample available for calibration');
      return;
    }

    try {
      const expected = raDecToAltAzAtTime(
        reference.raDeg,
        reference.decDeg,
        reference.latitude,
        reference.longitude,
        reference.at
      );

      const azimuthOffsetDeg = normalizeAngleSigned180(expected.azimuth - measured.azimuth);
      const altitudeOffsetDeg = clamp(expected.altitude - measured.altitude, -90, 90);

      updateCalibrationState({
        azimuthOffsetDeg,
        altitudeOffsetDeg,
        updatedAt: Date.now(),
        required: false,
      });
      setError(null);
    } catch (calibrationError) {
      const message = calibrationError instanceof Error
        ? calibrationError.message
        : 'Calibration failed';
      setError(message);
    }
  }, [updateCalibrationState]);

  const resetCalibration = useCallback(() => {
    updateCalibrationState({
      ...DEFAULT_CALIBRATION,
      required: true,
    });
    setError(null);
  }, [updateCalibrationState]);

  useEffect(() => {
    if (!enabled || !isSupported || !isPermissionGranted) {
      return;
    }

    const updateScreenOrientation = () => {
      screenAngleRef.current = getScreenAngleDeg();
    };

    const pushSample = (sample: OrientationSample) => {
      if (!Number.isFinite(sample.alpha) || !Number.isFinite(sample.beta) || !Number.isFinite(sample.gamma)) {
        return;
      }
      latestSampleRef.current = sample;
      setOrientation({
        alpha: sample.alpha,
        beta: sample.beta,
        gamma: sample.gamma,
        absolute: sample.absolute,
      });
      setSource(sample.source);
      setAccuracyDeg(sample.accuracyDeg);
    };

    const handleAbsolute = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha;
      const beta = event.beta;
      const gamma = event.gamma;
      if (alpha === null || beta === null || gamma === null) return;

      lastAbsoluteSampleAtRef.current = performance.now();
      pushSample({
        alpha,
        beta,
        gamma,
        absolute: true,
        source: 'deviceorientationabsolute',
        accuracyDeg: null,
        timestamp: Date.now(),
      });
    };

    const handleRelative = (event: DeviceOrientationEventIOS) => {
      let alpha = event.alpha;
      const beta = event.beta;
      const gamma = event.gamma;

      if (alpha === null || beta === null || gamma === null) return;

      let sampleSource: OrientationSource = event.absolute
        ? 'deviceorientationabsolute'
        : 'deviceorientation';
      let sampleAccuracy: number | null = null;

      if (useCompassHeading && Number.isFinite(event.webkitCompassHeading)) {
        alpha = normalizeAngle360(360 - Number(event.webkitCompassHeading));
        sampleSource = 'webkitCompassHeading';
        sampleAccuracy = Number.isFinite(event.webkitCompassAccuracy)
          ? Math.abs(Number(event.webkitCompassAccuracy))
          : null;
      }

      if (absolutePreferred) {
        const now = performance.now();
        const hasRecentAbsoluteSample = lastAbsoluteSampleAtRef.current > 0
          && now - lastAbsoluteSampleAtRef.current < ABSOLUTE_SAMPLE_HOLD_MS;
        const isAbsoluteLike = sampleSource === 'deviceorientationabsolute';
        if (!isAbsoluteLike && hasRecentAbsoluteSample) {
          return;
        }
      }

      if (sampleSource === 'deviceorientationabsolute') {
        lastAbsoluteSampleAtRef.current = performance.now();
      }

      pushSample({
        alpha,
        beta,
        gamma,
        absolute: event.absolute === true,
        source: sampleSource,
        accuracyDeg: sampleAccuracy,
        timestamp: Date.now(),
      });
    };

    const minIntervalMs = Math.max(1000 / Math.max(updateHz, 1), 4);

    const processLoop = (timestamp: number) => {
      rafIdRef.current = requestAnimationFrame(processLoop);

      if (document.visibilityState !== 'visible') {
        return;
      }

      if (timestamp - lastProcessedAtRef.current < minIntervalMs) {
        return;
      }
      lastProcessedAtRef.current = timestamp;

      const sample = latestSampleRef.current;
      if (!sample) return;

      const rawDirection = deviceEulerToSkyDirection(
        {
          alphaDeg: sample.alpha,
          betaDeg: sample.beta,
          gammaDeg: sample.gamma,
        },
        screenAngleRef.current
      );
      latestRawDirectionRef.current = rawDirection;

      const calibratedDirection = applyCalibration(rawDirection, calibrationRef.current);
      const smoothed = applySmoothing(smoothedDirectionRef.current, calibratedDirection, smoothingFactor);
      smoothedDirectionRef.current = smoothed;

      if (isWithinDeadband(emittedDirectionRef.current, smoothed, deadbandDeg)) {
        return;
      }

      emittedDirectionRef.current = smoothed;
      setSkyDirection(smoothed);
      setHasActiveSample(true);
      callbackRef.current?.(smoothed);
    };

    updateScreenOrientation();
    if (window.screen?.orientation && typeof window.screen.orientation.addEventListener === 'function') {
      window.screen.orientation.addEventListener('change', updateScreenOrientation);
    }
    window.addEventListener('orientationchange', updateScreenOrientation);
    window.addEventListener('deviceorientationabsolute', handleAbsolute, true);
    window.addEventListener('deviceorientation', handleRelative as EventListener, true);
    rafIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (window.screen?.orientation && typeof window.screen.orientation.removeEventListener === 'function') {
        window.screen.orientation.removeEventListener('change', updateScreenOrientation);
      }
      window.removeEventListener('orientationchange', updateScreenOrientation);
      window.removeEventListener('deviceorientationabsolute', handleAbsolute, true);
      window.removeEventListener('deviceorientation', handleRelative as EventListener, true);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    enabled,
    isSupported,
    isPermissionGranted,
    updateHz,
    deadbandDeg,
    smoothingFactor,
    absolutePreferred,
    useCompassHeading,
  ]);

  useEffect(() => {
    if (enabled) return;
    latestSampleRef.current = null;
    latestRawDirectionRef.current = null;
    smoothedDirectionRef.current = null;
    emittedDirectionRef.current = null;
    lastProcessedAtRef.current = 0;
    if (typeof window === 'undefined') return;

    const resetTimer = window.setTimeout(() => {
      setSkyDirection(null);
      setOrientation(null);
      setSource('none');
      setAccuracyDeg(null);
      setHasActiveSample(false);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [enabled]);

  const effectiveOrientation = enabled ? orientation : null;
  const effectiveSkyDirection = enabled ? skyDirection : null;
  const effectiveSource = enabled ? source : 'none';
  const effectiveAccuracyDeg = enabled ? accuracyDeg : null;

  const status = useMemo<SensorStatus>(() => {
    if (!isSupported) return 'unsupported';
    if (!enabled) return 'idle';
    if (!isPermissionGranted) {
      return permissionDenied ? 'permission-denied' : 'permission-required';
    }
    if (error) return 'error';
    if (calibrationState.required) return 'calibration-required';
    return hasActiveSample ? 'active' : 'idle';
  }, [isSupported, error, enabled, isPermissionGranted, permissionDenied, calibrationState.required, hasActiveSample]);

  return {
    orientation: effectiveOrientation,
    skyDirection: effectiveSkyDirection,
    isSupported,
    isPermissionGranted,
    status,
    source: effectiveSource,
    accuracyDeg: effectiveAccuracyDeg,
    calibration: calibrationState,
    requestPermission,
    calibrateToCurrentView,
    resetCalibration,
    error,
  };
}
