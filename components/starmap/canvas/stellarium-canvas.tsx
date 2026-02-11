'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useStellariumStore } from '@/lib/stores';
import type { StellariumEngine } from '@/lib/core/types';

// Import from local modules
import { DEFAULT_FOV } from './constants';
import { fovToDeg } from './utils';
import type { StellariumCanvasRef, StellariumCanvasProps } from './types';
import {
  useClickCoordinates,
  useStellariumZoom,
  useStellariumEvents,
  useObserverSync,
  useSettingsSync,
  useStellariumLoader,
} from './hooks';
import { LoadingOverlay } from './components';

// Re-export types for external consumers
export type { StellariumCanvasRef, StellariumCanvasProps } from './types';

/**
 * StellariumCanvas - Main star map visualization component
 * 
 * This component integrates the Stellarium Web Engine for interactive sky visualization.
 * It handles:
 * - Engine loading and initialization (WASM)
 * - Mouse/touch interactions (zoom, pan, context menu)
 * - Observer location sync from profile
 * - Settings synchronization
 * - Selection change events
 */
export const StellariumCanvas = forwardRef<StellariumCanvasRef, StellariumCanvasProps>(
  function StellariumCanvas({ onSelectionChange, onFovChange, onContextMenu }, ref) {
    // ============================================================================
    // Refs
    // ============================================================================
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stelRef = useRef<StellariumEngine | null>(null);

    // ============================================================================
    // Store Actions
    // ============================================================================
    const setStel = useStellariumStore((state) => state.setStel);

    // ============================================================================
    // Hooks
    // ============================================================================
    
    // Click coordinates calculation
    const { getClickCoordinates } = useClickCoordinates(stelRef, canvasRef);

    // Engine loading and initialization
    const {
      loadingState,
      engineReady,
      startLoading,
      handleRetry,
      reloadEngine,
    } = useStellariumLoader({
      containerRef,
      canvasRef,
      stelRef,
      onSelectionChange,
      onFovChange,
    });

    // Zoom functionality
    const {
      zoomIn,
      zoomOut,
      setFov,
    } = useStellariumZoom({
      stelRef,
      canvasRef,
      onFovChange,
    });

    // Right-click context menu and touch events
    useStellariumEvents({
      containerRef,
      getClickCoordinates,
      onContextMenu,
    });

    // Observer location sync from profile
    useObserverSync(stelRef);

    // Settings synchronization with debouncing
    useSettingsSync(stelRef, engineReady);

    // ============================================================================
    // Engine Status
    // ============================================================================
    const getEngineStatus = useCallback(() => {
      return {
        isLoading: loadingState.isLoading,
        hasError: loadingState.errorMessage !== null,
        isReady: engineReady && stelRef.current !== null,
      };
    }, [loadingState.isLoading, loadingState.errorMessage, engineReady]);

    // ============================================================================
    // Expose Methods via Ref
    // ============================================================================
    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      setFov,
      getFov: () => {
        return stelRef.current ? fovToDeg(stelRef.current.core.fov) : DEFAULT_FOV;
      },
      getClickCoordinates,
      reloadEngine,
      getEngineStatus,
    }), [zoomIn, zoomOut, setFov, getClickCoordinates, reloadEngine, getEngineStatus]);

    // ============================================================================
    // Effect: Start Loading on Mount
    // ============================================================================
    useEffect(() => {
      startLoading();

      return () => {
        // Cleanup on unmount
        stelRef.current = null;
        setStel(null);
      };
    }, [startLoading, setStel]);

    // ============================================================================
    // Effect: ResizeObserver for dynamic canvas resize
    // ============================================================================
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      let rafId: number | null = null;

      const observer = new ResizeObserver(() => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const newWidth = Math.round(rect.width * dpr);
          const newHeight = Math.round(rect.height * dpr);
          if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
          }
          rafId = null;
        });
      });

      observer.observe(container);

      return () => {
        observer.disconnect();
        if (rafId !== null) cancelAnimationFrame(rafId);
      };
    }, []);

    // ============================================================================
    // Render
    // ============================================================================
    return (
      <div ref={containerRef} className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
        
        {/* Loading Overlay */}
        <LoadingOverlay
          loadingState={loadingState}
          onRetry={handleRetry}
        />
      </div>
    );
  }
);


