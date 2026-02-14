'use client';

import { useState, useCallback, useRef, type RefObject } from 'react';
import type A from 'aladin-lite';
import type { LoadingState } from '@/types/stellarium-canvas';
import { useStellariumStore } from '@/lib/stores';
import { ALADIN_INIT_TIMEOUT, ALADIN_DEFAULT_FOV, ALADIN_DEFAULT_SURVEY, ALADIN_DEFAULT_PROJECTION, ALADIN_DEFAULT_COO_FRAME, ALADIN_NAVIGATE_DURATION } from '@/lib/core/constants/aladin-canvas';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;

const logger = createLogger('aladin-loader');

interface UseAladinLoaderOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  aladinRef: RefObject<AladinInstance | null>;
  onFovChange?: (fov: number) => void;
}

interface UseAladinLoaderReturn {
  loadingState: LoadingState;
  engineReady: boolean;
  startLoading: () => void;
  handleRetry: () => void;
  reloadEngine: () => void;
}

export function useAladinLoader({
  containerRef,
  aladinRef,
  onFovChange,
}: UseAladinLoaderOptions): UseAladinLoaderReturn {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingStatus: '',
    errorMessage: null,
  });
  const [engineReady, setEngineReady] = useState(false);
  const loadingRef = useRef(false);

  const initAladin = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const container = containerRef.current;
    if (!container) {
      setLoadingState({
        isLoading: false,
        loadingStatus: '',
        errorMessage: 'Container element not found',
      });
      loadingRef.current = false;
      return;
    }

    setLoadingState({
      isLoading: true,
      loadingStatus: 'Loading Aladin Lite WASM...',
      errorMessage: null,
    });
    setEngineReady(false);

    try {
      // Dynamic import to avoid SSR issues
      const A = (await Promise.race([
        import('aladin-lite').then(m => m.default),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Aladin Lite load timeout')), ALADIN_INIT_TIMEOUT)
        ),
      ])) as typeof import('aladin-lite').default;

      setLoadingState(prev => ({
        ...prev,
        loadingStatus: 'Initializing Aladin Lite engine...',
      }));

      // Wait for WASM init
      await A.init;

      // Ensure container has an ID for Aladin selector
      if (!container.id) {
        container.id = 'aladin-lite-container';
      }

      const aladin = A.aladin(`#${container.id}`, {
        fov: ALADIN_DEFAULT_FOV,
        target: '0 +0',
        projection: ALADIN_DEFAULT_PROJECTION,
        cooFrame: ALADIN_DEFAULT_COO_FRAME,
        survey: ALADIN_DEFAULT_SURVEY,
        showReticle: false,
        showCooGrid: false,
        showCooGridControl: false,
        showProjectionControl: false,
        showZoomControl: false,
        showFullscreenControl: false,
        showLayersControl: false,
        showGotoControl: false,
        showShareControl: false,
        showSimbadPointerControl: false,
        showContextMenu: false,
        showFrame: false,
        showSettingsControl: false,
        showStatusBar: false,
      });

      aladinRef.current = aladin;

      // Register zoom change event
      if (onFovChange) {
        aladin.on('zoomChanged', (fov: unknown) => {
          if (typeof fov === 'number') {
            onFovChange(fov);
          }
        });
      }

      // Set store helpers for view direction (used by status bar, navigation)
      const { setHelpers } = useStellariumStore.getState();
      setHelpers({
        getCurrentViewDirection: () => {
          const a = aladinRef.current;
          if (!a) return { ra: 0, dec: 0, alt: 0, az: 0 };
          const [ra, dec] = a.getRaDec();
          // Aladin returns degrees; convert to radians to match Stellarium convention.
          // NOTE: alt/az are always 0 — Aladin Lite is a survey browser and does not
          // compute horizon coordinates. Consumers needing alt/az must check activeEngine.
          const D2R = Math.PI / 180;
          return { ra: ra * D2R, dec: dec * D2R, alt: 0, az: 0 };
        },
        setViewDirection: (raDeg: number, decDeg: number) => {
          const a = aladinRef.current;
          if (!a) return;
          // Prefer smooth animation, fall back to instant jump if not available
          if (typeof a.animateToRaDec === 'function') {
            a.animateToRaDec(raDeg, decDeg, ALADIN_NAVIGATE_DURATION);
          } else {
            a.gotoRaDec(raDeg, decDeg);
          }
        },
      });

      setLoadingState({
        isLoading: false,
        loadingStatus: 'Aladin Lite ready',
        errorMessage: null,
      });
      setEngineReady(true);
      loadingRef.current = false;

      logger.info('Aladin Lite initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error loading Aladin Lite';
      logger.error('Failed to initialize Aladin Lite', error);
      setLoadingState({
        isLoading: false,
        loadingStatus: '',
        errorMessage: message,
      });
      loadingRef.current = false;
    }
  }, [containerRef, aladinRef, onFovChange]);

  const startLoading = useCallback(() => {
    initAladin();
  }, [initAladin]);

  // Clear any Aladin-created DOM children (canvas, overlays) to release WebGL
  // contexts before re-initialisation.  Without this, reload/retry would stack
  // canvas elements and leak GPU resources.
  const cleanupContainer = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }, [containerRef]);

  const handleRetry = useCallback(() => {
    loadingRef.current = false;
    aladinRef.current = null;
    cleanupContainer();
    initAladin();
  }, [initAladin, aladinRef, cleanupContainer]);

  const reloadEngine = useCallback(() => {
    loadingRef.current = false;
    aladinRef.current = null;
    setEngineReady(false);
    cleanupContainer();
    initAladin();
  }, [initAladin, aladinRef, cleanupContainer]);

  return {
    loadingState,
    engineReady,
    startLoading,
    handleRetry,
    reloadEngine,
  };
}
