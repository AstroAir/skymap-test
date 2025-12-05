'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';

export interface DeviceOrientation {
  alpha: number | null; // Compass direction (0-360)
  beta: number | null;  // Front-back tilt (-180 to 180)
  gamma: number | null; // Left-right tilt (-90 to 90)
  absolute: boolean;
}

export interface SkyDirection {
  azimuth: number;  // 0-360, 0=North, 90=East
  altitude: number; // -90 to 90, 0=horizon, 90=zenith
}

interface UseDeviceOrientationOptions {
  enabled?: boolean;
  smoothingFactor?: number; // 0-1, higher = more smoothing
  onOrientationChange?: (direction: SkyDirection) => void;
}

interface UseDeviceOrientationReturn {
  orientation: DeviceOrientation | null;
  skyDirection: SkyDirection | null;
  isSupported: boolean;
  isPermissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  error: string | null;
}

// Hook to safely check if we're on the client
const emptySubscribe = () => () => {};

// Check device orientation support
function getOrientationSupportSnapshot() {
  if (typeof window === 'undefined') return false;
  return 'DeviceOrientationEvent' in window;
}

function getOrientationSupportServerSnapshot() {
  return false;
}

// Check if permission is needed (iOS 13+)
function checkNeedsPermission() {
  if (typeof window === 'undefined') return true;
  if (!('DeviceOrientationEvent' in window)) return true;
  return typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function';
}

// Permission state store for useSyncExternalStore
let permissionGranted = false;
const permissionListeners = new Set<() => void>();

function subscribeToPermission(callback: () => void) {
  permissionListeners.add(callback);
  return () => permissionListeners.delete(callback);
}

function getPermissionSnapshot() {
  // On client, if no permission is needed, return true
  if (typeof window !== 'undefined' && !checkNeedsPermission()) {
    return true;
  }
  return permissionGranted;
}

function getPermissionServerSnapshot() {
  return false;
}

function setPermissionGranted(granted: boolean) {
  permissionGranted = granted;
  permissionListeners.forEach(listener => listener());
}

/**
 * Hook for device orientation sensor control
 * Converts device orientation to sky coordinates (azimuth/altitude)
 */
export function useDeviceOrientation(
  options: UseDeviceOrientationOptions = {}
): UseDeviceOrientationReturn {
  const { enabled = false, smoothingFactor = 0.3, onOrientationChange } = options;
  
  // Use useSyncExternalStore to safely get support status
  const isSupported = useSyncExternalStore(
    emptySubscribe,
    getOrientationSupportSnapshot,
    getOrientationSupportServerSnapshot
  );
  
  // Use useSyncExternalStore for permission state
  const isPermissionGranted = useSyncExternalStore(
    subscribeToPermission,
    getPermissionSnapshot,
    getPermissionServerSnapshot
  );
  
  const [orientation, setOrientation] = useState<DeviceOrientation | null>(null);
  const [skyDirection, setSkyDirection] = useState<SkyDirection | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const smoothedDirection = useRef<SkyDirection | null>(null);
  const callbackRef = useRef(onOrientationChange);
  
  // Update callback ref in effect to avoid render-time ref mutation
  useEffect(() => {
    callbackRef.current = onOrientationChange;
  }, [onOrientationChange]);

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Device orientation not supported');
      return false;
    }

    try {
      // Check if requestPermission exists (iOS 13+)
      const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      
      if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
        const permission = await DeviceOrientationEventTyped.requestPermission();
        const granted = permission === 'granted';
        setPermissionGranted(granted);
        if (!granted) {
          setError('Permission denied');
        }
        return granted;
      }
      
      // No permission needed (Android, older iOS)
      setPermissionGranted(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return false;
    }
  }, [isSupported]);

  // Convert device orientation to sky direction
  const calculateSkyDirection = useCallback((
    alpha: number | null,
    beta: number | null,
    gamma: number | null
  ): SkyDirection | null => {
    if (alpha === null || beta === null || gamma === null) {
      return null;
    }

    // Convert degrees to radians
    const alphaRad = alpha * (Math.PI / 180);
    const betaRad = beta * (Math.PI / 180);
    const gammaRad = gamma * (Math.PI / 180);

    // Calculate device pointing direction in 3D space
    // Assuming phone is held with screen facing user, camera pointing at sky
    
    // Rotation matrix components
    const cA = Math.cos(alphaRad);
    const sA = Math.sin(alphaRad);
    const cB = Math.cos(betaRad);
    const sB = Math.sin(betaRad);
    const cG = Math.cos(gammaRad);
    const sG = Math.sin(gammaRad);

    // Device pointing vector (assuming -Z is "forward" from screen)
    // Apply ZXY rotation order (alpha, beta, gamma)
    const x = -cA * sG - sA * sB * cG;
    const y = -sA * sG + cA * sB * cG;
    const z = -cB * cG;

    // Convert to azimuth (compass bearing) and altitude
    // Azimuth: 0=North, 90=East, 180=South, 270=West
    let azimuth = Math.atan2(x, y) * (180 / Math.PI);
    azimuth = ((azimuth % 360) + 360) % 360;

    // Altitude: 0=horizon, 90=zenith, -90=nadir
    const altitude = Math.asin(-z) * (180 / Math.PI);

    return { azimuth, altitude };
  }, []);

  // Apply smoothing to reduce jitter
  const applySmoothingToDirection = useCallback((
    newDir: SkyDirection,
    factor: number
  ): SkyDirection => {
    if (!smoothedDirection.current) {
      smoothedDirection.current = newDir;
      return newDir;
    }

    const prev = smoothedDirection.current;
    
    // Handle azimuth wraparound (0/360 boundary)
    let azDiff = newDir.azimuth - prev.azimuth;
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    
    const smoothedAz = ((prev.azimuth + azDiff * factor) % 360 + 360) % 360;
    const smoothedAlt = prev.altitude + (newDir.altitude - prev.altitude) * factor;

    smoothedDirection.current = { azimuth: smoothedAz, altitude: smoothedAlt };
    return smoothedDirection.current;
  }, []);

  // Handle orientation event
  useEffect(() => {
    if (!enabled || !isSupported || !isPermissionGranted) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const newOrientation: DeviceOrientation = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      };
      setOrientation(newOrientation);

      const rawDirection = calculateSkyDirection(
        event.alpha,
        event.beta,
        event.gamma
      );

      if (rawDirection) {
        const smoothed = applySmoothingToDirection(rawDirection, smoothingFactor);
        setSkyDirection(smoothed);
        callbackRef.current?.(smoothed);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [enabled, isSupported, isPermissionGranted, calculateSkyDirection, applySmoothingToDirection, smoothingFactor]);

  // Reset smoothed direction when disabled
  useEffect(() => {
    if (!enabled) {
      smoothedDirection.current = null;
    }
  }, [enabled]);

  return {
    orientation,
    skyDirection,
    isSupported,
    isPermissionGranted,
    requestPermission,
    error,
  };
}
