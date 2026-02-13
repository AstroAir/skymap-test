'use client';

import { useCallback, useEffect, RefObject } from 'react';
import { MIN_FOV, MAX_FOV, DEFAULT_FOV } from '@/lib/core/constants/fov';
import { fovToRad, fovToDeg } from '@/lib/core/stellarium-canvas-utils';
import type { StellariumEngine } from '@/lib/core/types';

interface UseStellariumZoomOptions {
  stelRef: RefObject<StellariumEngine | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onFovChange?: (fov: number) => void;
}

/**
 * Hook for managing FOV/zoom functionality
 */
export function useStellariumZoom({
  stelRef,
  canvasRef,
  onFovChange,
}: UseStellariumZoomOptions) {
  // Helper to set FOV with proper engine update
  const setEngineFov = useCallback((fovDeg: number) => {
    if (!stelRef.current) return;
    const clampedFov = Math.max(MIN_FOV, Math.min(MAX_FOV, fovDeg));
    const fovRad = fovToRad(clampedFov);
    // Use direct property assignment for better compatibility with Stellarium engine
    stelRef.current.core.fov = fovRad;
    onFovChange?.(clampedFov);
  }, [stelRef, onFovChange]);

  // Zoom in function
  const zoomIn = useCallback(() => {
    if (stelRef.current) {
      const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
      const newFovDeg = Math.max(MIN_FOV, currentFovDeg * 0.8);
      setEngineFov(newFovDeg);
    }
  }, [stelRef, setEngineFov]);

  // Zoom out function
  const zoomOut = useCallback(() => {
    if (stelRef.current) {
      const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
      const newFovDeg = Math.min(MAX_FOV, currentFovDeg * 1.25);
      setEngineFov(newFovDeg);
    }
  }, [stelRef, setEngineFov]);

  // Set specific FOV
  const setFov = useCallback((fov: number) => {
    setEngineFov(fov);
  }, [setEngineFov]);

  // Get current FOV
  const getFov = useCallback(() => {
    return stelRef.current ? fovToDeg(stelRef.current.core.fov) : DEFAULT_FOV;
  }, [stelRef]);

  // Handle mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!stelRef.current) return;
      
      const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
      const zoomFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
      const newFovDeg = currentFovDeg * zoomFactor;
      setEngineFov(newFovDeg);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [stelRef, canvasRef, setEngineFov]);

  return {
    zoomIn,
    zoomOut,
    setFov,
    getFov,
    setEngineFov,
  };
}
