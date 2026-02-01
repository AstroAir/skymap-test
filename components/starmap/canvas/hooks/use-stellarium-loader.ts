'use client';

import { useCallback, useRef, useState, RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useSettingsStore, useMountStore } from '@/lib/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/astronomy/starmap-utils';
import { createStellariumTranslator } from '@/lib/translations';
import { createLogger } from '@/lib/logger';
import {
  SCRIPT_LOAD_TIMEOUT,
  WASM_INIT_TIMEOUT,
  MAX_RETRY_COUNT,
  SCRIPT_PATH,
  WASM_PATH,
  DEFAULT_FOV,
} from '../constants';
import { withTimeout, prefetchWasm, fovToRad } from '../utils';
import type { StellariumEngine, SelectedObjectData } from '@/lib/core/types';
import type { LoadingState } from '../types';

const logger = createLogger('stellarium-loader');

interface UseStellariumLoaderOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stelRef: RefObject<StellariumEngine | null>;
  onSelectionChange?: (selection: SelectedObjectData | null) => void;
  onFovChange?: (fov: number) => void;
}

interface UseStellariumLoaderResult {
  loadingState: LoadingState;
  engineReady: boolean;
  startLoading: () => Promise<void>;
  handleRetry: () => void;
  reloadEngine: () => void;
}

/**
 * Hook for loading and initializing the Stellarium engine
 */
export function useStellariumLoader({
  containerRef,
  canvasRef,
  stelRef,
  onSelectionChange,
  onFovChange,
}: UseStellariumLoaderOptions): UseStellariumLoaderResult {
  const t = useTranslations('canvas');
  
  const initializingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  
  const setStel = useStellariumStore((state) => state.setStel);
  const setBaseUrl = useStellariumStore((state) => state.setBaseUrl);
  const setHelpers = useStellariumStore((state) => state.setHelpers);
  const updateStellariumCore = useStellariumStore((state) => state.updateStellariumCore);
  
  const profileInfo = useMountStore((state) => state.profileInfo);

  // Initialize Stellarium engine with all data sources
  const initStellarium = useCallback((stel: StellariumEngine) => {
    logger.info('Stellarium is ready!');
    (stelRef as React.MutableRefObject<StellariumEngine | null>).current = stel;
    setStel(stel);

    // Set observer location from profile
    const lat = profileInfo.AstrometrySettings.Latitude || 0;
    const lon = profileInfo.AstrometrySettings.Longitude || 0;
    const elev = profileInfo.AstrometrySettings.Elevation || 0;
    
    // Use direct property assignment for Stellarium engine compatibility
    stel.core.observer.latitude = lat * stel.D2R;
    stel.core.observer.longitude = lon * stel.D2R;
    stel.core.observer.elevation = elev;

    // Set time speed to 1 and initial FOV
    // Use setTimeout to ensure the engine is fully initialized before setting FOV
    stel.core.time_speed = 1;
    setTimeout(() => {
      if (stelRef.current) {
        stelRef.current.core.fov = fovToRad(DEFAULT_FOV);
        onFovChange?.(DEFAULT_FOV);
      }
    }, 100);

    // Helper function to get current view direction
    const getCurrentViewDirection = () => {
      const obs = stel.core.observer;
      const viewVec = [0, 0, -1];
      const cirsVec = stel.convertFrame(stel.observer, 'VIEW', 'CIRS', viewVec);
      const raDecSpherical = stel.c2s(cirsVec);
      const alt = obs.azalt[0];
      const az = obs.azalt[1];

      return {
        ra: raDecSpherical[0],
        dec: raDecSpherical[1],
        alt,
        az,
      };
    };

    // Helper function to set view direction
    const setViewDirection = (raDeg: number, decDeg: number) => {
      try {
        const raRad = raDeg * stel.D2R;
        const decRad = decDeg * stel.D2R;
        const icrfVec = stel.s2c(raRad, decRad);
        const cirsVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

        const targetCircle = stel.createObj('circle', {
          id: 'framingTarget',
          pos: cirsVec,
          color: [0, 0, 0, 0.1],
          size: [0.05, 0.05],
        });

        targetCircle.pos = cirsVec;
        targetCircle.update();
        stel.core.selection = targetCircle;
        stel.pointAndLock(targetCircle);
      } catch (error) {
        logger.error('Error setting view direction', error);
      }
    };

    setHelpers({ getCurrentViewDirection, setViewDirection });

    // Data source URLs - use local data from /stellarium-data/
    const baseUrl = '/stellarium-data/';
    setBaseUrl(baseUrl);

    const core = stel.core;

    // Add all data sources from local stellarium-data directory
    core.stars.addDataSource({ url: baseUrl + 'stars' });
    core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
    core.dsos.addDataSource({ url: baseUrl + 'dso' });
    core.dss.addDataSource({ url: baseUrl + 'surveys/dss' });
    core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
    core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
    
    // Planets - use local surveys
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/mercury', key: 'mercury' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/venus', key: 'venus' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/mars', key: 'mars' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/jupiter', key: 'jupiter' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/saturn', key: 'saturn' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/uranus', key: 'uranus' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/neptune', key: 'neptune' });
    
    // Jupiter moons
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/io', key: 'io' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/europa', key: 'europa' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/ganymede', key: 'ganymede' });
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso/callisto', key: 'callisto' });
    
    core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
    // Comet elements file
    core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });

    // Apply initial settings - get latest from store to avoid stale closure
    const currentSettings = useSettingsStore.getState().stellarium;
    // Delay initial settings application to ensure engine is fully ready
    setTimeout(() => {
      updateStellariumCore(currentSettings);
      setEngineReady(true);
    }, 200);

    // Watch for selection changes
    stel.change((_obj: unknown, attr: string) => {
      if (attr === 'selection') {
        const selection = core.selection;
        if (!selection) {
          onSelectionChange?.(null);
          return;
        }

        const selectedDesignations = selection.designations();
        const raDec = selection.getInfo('RADEC') as number[];
        const radecCIRS = stel.c2s(raDec);
        const ra = stel.anp(radecCIRS[0]);
        const dec = stel.anpm(radecCIRS[1]);

        onSelectionChange?.({
          names: selectedDesignations,
          ra: degreesToHMS(rad2deg(ra)),
          dec: degreesToDMS(rad2deg(dec)),
          raDeg: rad2deg(ra),
          decDeg: rad2deg(dec),
        });
      }
    });
  // Note: stellariumSettings is intentionally NOT in deps - initial settings applied once,
  // subsequent changes handled by useSettingsSync hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stelRef,
    setStel,
    setBaseUrl,
    setHelpers,
    profileInfo,
    onSelectionChange,
    onFovChange,
  ]);

  // Load the Stellarium engine script with timeout
  const loadScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.StelWebEngine) {
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector(`script[src="${SCRIPT_PATH}"]`);
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Script load failed')));
        return;
      }

      const script = document.createElement('script');
      script.src = SCRIPT_PATH;
      script.async = true;

      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error('Script load timed out'));
      }, SCRIPT_LOAD_TIMEOUT);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error('Script load failed'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize the Stellarium engine with WASM
  const initializeEngine = useCallback(async (): Promise<void> => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available');
    }

    if (!window.StelWebEngine) {
      throw new Error('Engine script not loaded');
    }

    const currentLanguage = useSettingsStore.getState().stellarium.skyCultureLanguage;
    const translateFn = createStellariumTranslator(currentLanguage);

    // Capture reference after check (TypeScript narrowing)
    const StelWebEngine = window.StelWebEngine;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      try {
        // StelWebEngine expects: wasmFile, canvasElement, translateFn, onReady
        const engineResult = StelWebEngine({
          wasmFile: WASM_PATH,
          canvasElement: canvasRef.current!,
          translateFn,
          onReady: (stel: StellariumEngine) => {
            if (resolved) return;
            resolved = true;
            initStellarium(stel);
            resolve();
          },
        }) as unknown;

        // Handle if StelWebEngine returns a promise (for error handling)
        if (engineResult && typeof (engineResult as Promise<unknown>).then === 'function') {
          (engineResult as Promise<unknown>).catch((err: unknown) => {
            if (!resolved) {
              resolved = true;
              reject(err);
            }
          });
        }
      } catch (err) {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      }
    });
  }, [canvasRef, initStellarium]);

  // Main loading function with retry support
  const startLoading = useCallback(async () => {
    // Prevent concurrent initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Create abort controller for this load attempt
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setErrorMessage(null);
    setIsLoading(true);

    let shouldRetry = false;

    try {
      // Step 1: Setup canvas
      if (!canvasRef.current || !containerRef.current) {
        throw new Error('Canvas container not ready');
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      // Step 2: Prefetch WASM into cache (non-blocking)
      setLoadingStatus(t('preparingResources'));
      prefetchWasm().catch(() => {
        // Ignore prefetch errors - will try direct load
      });

      // Step 3: Load script
      setLoadingStatus(t('loadingScript'));
      await withTimeout(loadScript(), SCRIPT_LOAD_TIMEOUT, 'Engine script timed out');

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Step 4: Initialize WASM engine
      setLoadingStatus(t('initializingStarmap'));
      await withTimeout(initializeEngine(), WASM_INIT_TIMEOUT, 'Star map initialization timed out');

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Success
      setIsLoading(false);
      setErrorMessage(null);
      retryCountRef.current = 0;

    } catch (err) {
      logger.error('Error loading star map', err);
      
      // Check if aborted (component unmounted)
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMsg = err instanceof Error ? err.message : 'Failed to load star map';
      
      // Auto-retry if under limit
      if (retryCountRef.current < MAX_RETRY_COUNT) {
        retryCountRef.current++;
        setLoadingStatus(t('retrying', { current: retryCountRef.current, max: MAX_RETRY_COUNT }));
        shouldRetry = true;
      } else {
        // Max retries reached
        setErrorMessage(errorMsg);
        setIsLoading(false);
      }
    } finally {
      initializingRef.current = false;
    }

    // Handle retry outside try-catch-finally to avoid race condition
    if (shouldRetry && !abortControllerRef.current?.signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!abortControllerRef.current?.signal.aborted) {
        startLoading();
      }
    }
  }, [containerRef, canvasRef, loadScript, initializeEngine, t]);

  // Retry loading (user-triggered)
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    initializingRef.current = false;
    startLoading();
  }, [startLoading]);

  // Debug: Force reload the engine (clears current engine and restarts)
  const reloadEngine = useCallback(() => {
    logger.debug('Reloading Stellarium engine...');
    
    // Abort any ongoing loading
    abortControllerRef.current?.abort();
    
    // Clear current engine
    if (stelRef.current) {
      (stelRef as React.MutableRefObject<StellariumEngine | null>).current = null;
      setStel(null);
    }
    
    // Remove existing script to force reload
    const existingScript = document.querySelector(`script[src="${SCRIPT_PATH}"]`);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Clear StelWebEngine from window
    delete (window as { StelWebEngine?: unknown }).StelWebEngine;
    
    // Reset state
    setEngineReady(false);
    retryCountRef.current = 0;
    initializingRef.current = false;
    
    // Start fresh loading
    startLoading();
  }, [stelRef, startLoading, setStel]);

  return {
    loadingState: {
      isLoading,
      loadingStatus,
      errorMessage,
    },
    engineReady,
    startLoading,
    handleRetry,
    reloadEngine,
  };
}
