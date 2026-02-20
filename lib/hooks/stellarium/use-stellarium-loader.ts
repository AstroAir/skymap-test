'use client';

import { useCallback, useEffect, useRef, useState, RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useSettingsStore, useMountStore } from '@/lib/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/astronomy/starmap-utils';
import { createStellariumTranslator } from '@/lib/translations';
import { createLogger } from '@/lib/logger';
import { DEFAULT_FOV } from '@/lib/core/constants/fov';
import {
  SCRIPT_LOAD_TIMEOUT,
  WASM_INIT_TIMEOUT,
  MAX_RETRY_COUNT,
  SCRIPT_PATH,
  WASM_PATH,
  ENGINE_FOV_INIT_DELAY,
  ENGINE_SETTINGS_INIT_DELAY,
  RETRY_DELAY_MS,
} from '@/lib/core/constants/stellarium-canvas';
import { withTimeout, prefetchWasm, fovToRad } from '@/lib/core/stellarium-canvas-utils';
import { pointAndLockTargetAt } from './target-object-pool';
import type { StellariumEngine, SelectedObjectData } from '@/lib/core/types';
import type { LoadingState } from '@/types/stellarium-canvas';

const logger = createLogger('stellarium-loader');
const TWO_PI = 2 * Math.PI;

function normalizeRadians(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function angularErrorArcsec(targetRad: number, actualRad: number): number {
  const delta = Math.abs(targetRad - actualRad);
  const wrapped = Math.min(delta, TWO_PI - delta);
  return wrapped * (180 / Math.PI) * 3600;
}

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

type LoaderStage = 'script' | 'engine';

interface LoaderStageError extends Error {
  stage: LoaderStage;
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
  const retryTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  
  const setStel = useStellariumStore((state) => state.setStel);
  const setBaseUrl = useStellariumStore((state) => state.setBaseUrl);
  const setHelpers = useStellariumStore((state) => state.setHelpers);
  const updateStellariumCore = useStellariumStore((state) => state.updateStellariumCore);

  // Callback refs to keep initStellarium stable (avoids re-init on callback changes)
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onFovChangeRef = useRef(onFovChange);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);
  useEffect(() => { onFovChangeRef.current = onFovChange; }, [onFovChange]);
  useEffect(() => () => {
    mountedRef.current = false;
    abortControllerRef.current?.abort();
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    initializingRef.current = false;
  }, []);
  
  // Initialize Stellarium engine with all data sources
  const initStellarium = useCallback((stel: StellariumEngine) => {
    logger.info('Stellarium is ready!');
    (stelRef as React.MutableRefObject<StellariumEngine | null>).current = stel;
    setStel(stel);

    // Set observer location from profile (read latest from store, subsequent syncs handled by useObserverSync)
    const currentProfile = useMountStore.getState().profileInfo;
    const lat = currentProfile.AstrometrySettings.Latitude || 0;
    const lon = currentProfile.AstrometrySettings.Longitude || 0;
    const elev = currentProfile.AstrometrySettings.Elevation || 0;
    
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
        onFovChangeRef.current?.(DEFAULT_FOV);
      }
    }, ENGINE_FOV_INIT_DELAY);

    // Helper function to get current view direction
    const getCurrentViewDirection = () => {
      const obs = stel.core.observer;
      const viewVec = [0, 0, -1];
      const icrfVec = stel.convertFrame(stel.observer, 'VIEW', 'ICRF', viewVec);
      const raDecSpherical = stel.c2s(icrfVec);
      const alt = obs.azalt[0];
      const az = obs.azalt[1];

      return {
        ra: normalizeRadians(raDecSpherical[0]),
        dec: stel.anpm(raDecSpherical[1]),
        alt,
        az,
        frame: 'ICRF' as const,
        timeScale: 'UTC' as const,
        qualityFlag: 'precise' as const,
        dataFreshness: 'fallback' as const,
      };
    };

    // Helper function to set view direction
    const setViewDirection = (raDeg: number, decDeg: number) => {
      try {
        const raRad = raDeg * stel.D2R;
        const decRad = decDeg * stel.D2R;
        const icrfVec = stel.s2c(raRad, decRad);
        const cirsVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);
        pointAndLockTargetAt(stel, cirsVec);

        const actual = getCurrentViewDirection();
        const raErrArcsec = angularErrorArcsec(normalizeRadians(raRad), normalizeRadians(actual.ra));
        const decErrArcsec = Math.abs(decRad - actual.dec) * (180 / Math.PI) * 3600;
        logger.debug('setViewDirection roundtrip', {
          target: { raDeg, decDeg },
          actual: { raDeg: rad2deg(actual.ra), decDeg: rad2deg(actual.dec) },
          errorArcsec: {
            ra: Number(raErrArcsec.toFixed(3)),
            dec: Number(decErrArcsec.toFixed(3)),
          },
        });
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
    }, ENGINE_SETTINGS_INIT_DELAY);

    // Watch for selection changes (guard against callback firing after unmount)
    stel.change((_obj: unknown, attr: string) => {
      if (attr === 'selection') {
        if (!stelRef.current) return;

        const selection = core.selection;
        if (!selection) {
          onSelectionChangeRef.current?.(null);
          return;
        }

        const selectedDesignations = selection.designations();
        const radecVector = selection.getInfo('RADEC') as number[];
        const radecIcrfVec = stel.convertFrame(stel.observer, 'CIRS', 'ICRF', radecVector);
        const radecIcrf = stel.c2s(radecIcrfVec);
        const ra = normalizeRadians(radecIcrf[0]);
        const dec = stel.anpm(radecIcrf[1]);

        onSelectionChangeRef.current?.({
          names: selectedDesignations,
          ra: degreesToHMS(rad2deg(ra)),
          dec: degreesToDMS(rad2deg(dec)),
          raDeg: rad2deg(ra),
          decDeg: rad2deg(dec),
          frame: 'ICRF',
          timeScale: 'UTC',
          qualityFlag: 'precise',
          dataFreshness: 'fallback',
          coordinateSource: 'engine',
          coordinateTimestamp: new Date().toISOString(),
        });
      }
    });
  // Note: stellariumSettings is intentionally NOT in deps - initial settings applied once,
  // subsequent changes handled by useSettingsSync hook.
  // onSelectionChange/onFovChange accessed via refs to keep this callback stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stelRef,
    setStel,
    setBaseUrl,
    setHelpers,
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
        existingScript.addEventListener('error', () => reject(new Error(t('scriptLoadFailed'))));
        return;
      }

      const script = document.createElement('script');
      script.src = SCRIPT_PATH;
      script.async = true;

      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(t('scriptLoadTimedOut')));
      }, SCRIPT_LOAD_TIMEOUT);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error(t('scriptLoadFailed')));
      };

      document.head.appendChild(script);
    });
  }, [t]);

  // Initialize the Stellarium engine with WASM
  const initializeEngine = useCallback(async (): Promise<void> => {
    if (!canvasRef.current) {
      throw new Error(t('canvasNotAvailable'));
    }

    if (!window.StelWebEngine) {
      throw new Error(t('engineScriptNotLoaded'));
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
  }, [canvasRef, initStellarium, t]);

  const createStageError = useCallback((stage: LoaderStage, error: unknown): LoaderStageError => {
    const message = error instanceof Error ? error.message : t('loadFailed');
    const stagedError = new Error(message) as LoaderStageError;
    stagedError.stage = stage;
    return stagedError;
  }, [t]);

  // Main loading function with retry support
  const startLoading = useCallback(async () => {
    if (!mountedRef.current) return;

    // Prevent concurrent initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Create abort controller for this load attempt
    abortControllerRef.current?.abort();
    const loadAbortController = new AbortController();
    abortControllerRef.current = loadAbortController;

    if (mountedRef.current) {
      setErrorMessage(null);
      setIsLoading(true);
      setLoadingStatus(t('preparingResources'));
    }

    let shouldRetry = false;

    try {
      // Step 1: Setup canvas
      if (!canvasRef.current || !containerRef.current) {
        setLoadingStatus(t('canvasContainerNotReady'));
        shouldRetry = true;
        return;
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        setLoadingStatus(t('canvasContainerNotReady'));
        shouldRetry = true;
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      // Step 2: Prefetch WASM into cache (non-blocking)
      setLoadingStatus(t('preparingResources'));
      prefetchWasm().catch(() => {
        // Ignore prefetch errors - will try direct load
      });

      // Step 3: Load script
      setLoadingStatus(t('loadingScript'));
      try {
        await withTimeout(loadScript(), SCRIPT_LOAD_TIMEOUT, t('engineScriptTimedOut'));
      } catch (error) {
        throw createStageError('script', error);
      }

      // Check if aborted
      if (loadAbortController.signal.aborted || !mountedRef.current) {
        return;
      }

      // Step 4: Initialize WASM engine
      setLoadingStatus(t('initializingStarmap'));
      try {
        await withTimeout(initializeEngine(), WASM_INIT_TIMEOUT, t('starmapInitTimedOut'));
      } catch (error) {
        throw createStageError('engine', error);
      }

      // Check if aborted
      if (loadAbortController.signal.aborted || !mountedRef.current) {
        return;
      }

      // Success
      if (mountedRef.current) {
        setIsLoading(false);
        setErrorMessage(null);
      }
      retryCountRef.current = 0;

    } catch (err) {
      const stage = err instanceof Error && 'stage' in err
        ? (err as LoaderStageError).stage
        : null;
      if (stage === 'script' || stage === 'engine') {
        logger.error('Error loading star map', err);
      } else {
        logger.warn('Stellarium loader waiting for runtime readiness', err);
      }
      
      // Check if aborted (component unmounted)
      if (loadAbortController.signal.aborted || !mountedRef.current) {
        return;
      }

      const errorMsg = err instanceof Error ? err.message : t('loadFailed');
      
      // Auto-retry if under limit
      if (retryCountRef.current < MAX_RETRY_COUNT) {
        retryCountRef.current++;
        setLoadingStatus(t('retrying', { current: retryCountRef.current, max: MAX_RETRY_COUNT }));
        shouldRetry = true;
      } else {
        // Max retries reached
        if (mountedRef.current) {
          setErrorMessage(errorMsg);
          setIsLoading(false);
        }
      }
    } finally {
      initializingRef.current = false;
    }

    if (shouldRetry && mountedRef.current && !loadAbortController.signal.aborted) {
      retryTimeoutRef.current = window.setTimeout(() => {
        retryTimeoutRef.current = null;
        if (mountedRef.current && !loadAbortController.signal.aborted) {
          void startLoading();
        }
      }, RETRY_DELAY_MS);
    }
  }, [containerRef, canvasRef, createStageError, loadScript, initializeEngine, t]);

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
