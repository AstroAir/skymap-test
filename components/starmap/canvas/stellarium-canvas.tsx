'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useSettingsStore, useMountStore } from '@/lib/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/astronomy/starmap-utils';
import { createStellariumTranslator } from '@/lib/translations';
import { Spinner } from '@/components/common/spinner';
import { unifiedCache } from '@/lib/offline';
import { createLogger } from '@/lib/logger';

const logger = createLogger('stellarium-canvas');
import type { StellariumEngine, SelectedObjectData } from '@/lib/core/types';

// ============================================================================
// Constants
// ============================================================================

const SCRIPT_LOAD_TIMEOUT = 15000; // 15s for script
const WASM_INIT_TIMEOUT = 30000;   // 30s for WASM init
const MAX_RETRY_COUNT = 2;
const SCRIPT_PATH = '/stellarium-js/stellarium-web-engine.js';
const WASM_PATH = '/stellarium-js/stellarium-web-engine.wasm';

// ============================================================================
// Helpers
// ============================================================================

/** Timeout wrapper for promises */
const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

/** Prefetch WASM into cache for faster subsequent loads */
const prefetchWasm = async (): Promise<boolean> => {
  try {
    // Use unified cache to prefetch WASM file
    const response = await unifiedCache.fetch(WASM_PATH, {}, 'cache-first');
    return response.ok;
  } catch {
    return false;
  }
};

// FOV limits - defined outside component to avoid recreation
const MIN_FOV = 0.5;
const MAX_FOV = 180;
const DEFAULT_FOV = 60;

// Helper functions for FOV conversion (engine uses radians internally)
const fovToRad = (deg: number) => deg * (Math.PI / 180);
const fovToDeg = (rad: number) => rad * (180 / Math.PI);

export interface StellariumCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  setFov: (fov: number) => void;
  getFov: () => number;
  getClickCoordinates: (clientX: number, clientY: number) => { ra: number; dec: number; raStr: string; decStr: string } | null;
  /** Debug: Force reload the engine */
  reloadEngine: () => void;
  /** Debug: Get engine status */
  getEngineStatus: () => { isLoading: boolean; hasError: boolean; isReady: boolean };
}

interface StellariumCanvasProps {
  onSelectionChange?: (selection: SelectedObjectData | null) => void;
  onFovChange?: (fov: number) => void;
  onContextMenu?: (e: React.MouseEvent, coords: { ra: number; dec: number; raStr: string; decStr: string } | null) => void;
}

export const StellariumCanvas = forwardRef<StellariumCanvasRef, StellariumCanvasProps>(
  function StellariumCanvas({ onSelectionChange, onFovChange, onContextMenu }, ref) {
  const t = useTranslations('canvas');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializingRef = useRef(false);
  const stelRef = useRef<StellariumEngine | null>(null);
  const settingsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const setStel = useStellariumStore((state) => state.setStel);
  const setBaseUrl = useStellariumStore((state) => state.setBaseUrl);
  const setHelpers = useStellariumStore((state) => state.setHelpers);
  const updateStellariumCore = useStellariumStore((state) => state.updateStellariumCore);
  
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  
  // Track if engine is ready for settings updates
  const [engineReady, setEngineReady] = useState(false);
  
  const profileInfo = useMountStore((state) => state.profileInfo);

  // Helper to get coordinates from click position
  // Uses gnomonic (rectilinear) projection - inverse of convertToScreen in SkyMarkers
  const getClickCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!stelRef.current || !canvasRef.current) return null;
    
    const stel = stelRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    try {
      const core = stel.core;
      const fov = core.fov; // FOV in radians
      const aspect = rect.width / rect.height;
      
      // Calculate pixel position relative to canvas
      const pixelX = clientX - rect.left;
      const pixelY = clientY - rect.top;
      
      // Convert to normalized device coordinates (-1 to 1)
      // Screen Y is inverted (0 at top, increases downward)
      const ndcX = (pixelX / rect.width) * 2 - 1;
      const ndcY = 1 - (pixelY / rect.height) * 2;
      
      // Gnomonic projection inverse:
      // Forward: ndcX = (viewX / -viewZ) * scale / aspect
      //          ndcY = (viewY / -viewZ) * scale
      // where scale = 1 / tan(fov/2)
      // Inverse: projX = ndcX * aspect / scale = ndcX * aspect * tan(fov/2)
      //          projY = ndcY / scale = ndcY * tan(fov/2)
      const tanHalfFov = Math.tan(fov / 2);
      const projX = ndcX * aspect * tanHalfFov;
      const projY = ndcY * tanHalfFov;
      
      // Build VIEW frame vector: [projX, projY, -1] then normalize
      // VIEW frame: -Z is forward, X is right, Y is up
      const length = Math.sqrt(projX * projX + projY * projY + 1);
      const viewVec = [projX / length, projY / length, -1 / length];
      
      // Convert VIEW -> ICRF (equatorial coordinates)
      const icrfVec = stel.convertFrame(stel.observer, 'VIEW', 'ICRF', viewVec);
      const spherical = stel.c2s(icrfVec);
      
      const raRad = stel.anp(spherical[0]);
      const decRad = spherical[1];
      
      const raDeg = rad2deg(raRad);
      const decDeg = rad2deg(decRad);
      
      return {
        ra: raDeg,
        dec: decDeg,
        raStr: degreesToHMS(((raDeg % 360) + 360) % 360),
        decStr: degreesToDMS(decDeg),
      };
    } catch (error) {
      logger.error('Error calculating click coordinates', error);
      return null;
    }
  }, []);

  // Helper to set FOV with proper engine update
  const setEngineFov = useCallback((fovDeg: number) => {
    if (!stelRef.current) return;
    const clampedFov = Math.max(MIN_FOV, Math.min(MAX_FOV, fovDeg));
    const fovRad = fovToRad(clampedFov);
    // Use direct property assignment for better compatibility with Stellarium engine
    stelRef.current.core.fov = fovRad;
    onFovChange?.(clampedFov);
  }, [onFovChange]);

  // Initialize Stellarium
  const initStellarium = useCallback((stel: StellariumEngine) => {
    logger.info('Stellarium is ready!');
    stelRef.current = stel;
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
  // subsequent changes handled by the separate useEffect above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setStel,
    setBaseUrl,
    setHelpers,
    profileInfo,
    onSelectionChange,
    onFovChange,
  ]);

  // ============================================================================
  // Script Loading
  // ============================================================================

  /** Load the Stellarium engine script with timeout */
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

  // ============================================================================
  // WASM Initialization
  // ============================================================================

  /** Initialize the Stellarium engine with WASM */
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
  }, [initStellarium]);

  // ============================================================================
  // Main Loading Flow
  // ============================================================================

  /** Main loading function with retry support */
  const startLoading = useCallback(async () => {
    // Prevent concurrent initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Create abort controller for this load attempt
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setErrorMessage(null);
    setIsLoading(true);

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
        initializingRef.current = false;
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!abortControllerRef.current?.signal.aborted) {
          startLoading();
        }
        return;
      }

      // Max retries reached
      setErrorMessage(errorMsg);
      setIsLoading(false);
    } finally {
      initializingRef.current = false;
    }
  }, [loadScript, initializeEngine, t]);

  /** Retry loading (user-triggered) */
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    initializingRef.current = false;
    startLoading();
  }, [startLoading]);

  /** Debug: Force reload the engine (clears current engine and restarts) */
  const reloadEngine = useCallback(() => {
    logger.debug('Reloading Stellarium engine...');
    
    // Abort any ongoing loading
    abortControllerRef.current?.abort();
    
    // Clear current engine
    if (stelRef.current) {
      stelRef.current = null;
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
  }, [startLoading, setStel]);

  /** Debug: Get current engine status */
  const getEngineStatus = useCallback(() => {
    return {
      isLoading,
      hasError: errorMessage !== null,
      isReady: engineReady && stelRef.current !== null,
    };
  }, [isLoading, errorMessage, engineReady]);

  // ============================================================================
  // Expose Methods via Ref
  // ============================================================================

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (stelRef.current) {
        const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
        const newFovDeg = Math.max(MIN_FOV, currentFovDeg * 0.8);
        setEngineFov(newFovDeg);
      }
    },
    zoomOut: () => {
      if (stelRef.current) {
        const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
        const newFovDeg = Math.min(MAX_FOV, currentFovDeg * 1.25);
        setEngineFov(newFovDeg);
      }
    },
    setFov: (fov: number) => {
      setEngineFov(fov);
    },
    getFov: () => {
      return stelRef.current ? fovToDeg(stelRef.current.core.fov) : DEFAULT_FOV;
    },
    getClickCoordinates,
    reloadEngine,
    getEngineStatus,
  }), [setEngineFov, getClickCoordinates, reloadEngine, getEngineStatus]);

  // ============================================================================
  // Effect: Start Loading on Mount
  // ============================================================================

  useEffect(() => {
    startLoading();

    return () => {
      // Cleanup on unmount
      abortControllerRef.current?.abort();
      stelRef.current = null;
      setStel(null);
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, [startLoading, setStel]);

  // Apply settings changes to Stellarium core with debouncing
  useEffect(() => {
    // Only apply settings after engine is ready (initial settings already applied)
    if (!engineReady || !stelRef.current) return;
    
    // Clear any pending update
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }
    
    // Debounce settings updates to prevent stuttering
    settingsTimeoutRef.current = setTimeout(() => {
      if (stelRef.current) {
        updateStellariumCore(stellariumSettings);
      }
    }, 50); // 50ms debounce
    
    return () => {
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, [stellariumSettings, updateStellariumCore, engineReady]);

  useEffect(() => {
    if (!stelRef.current) return;
    const stel = stelRef.current;

    try {
      const lat = profileInfo.AstrometrySettings.Latitude || 0;
      const lon = profileInfo.AstrometrySettings.Longitude || 0;
      const elev = profileInfo.AstrometrySettings.Elevation || 0;

      stel.core.observer.latitude = lat * stel.D2R;
      stel.core.observer.longitude = lon * stel.D2R;
      stel.core.observer.elevation = elev;
    } catch (e) {
      void e;
    }
  }, [
    profileInfo.AstrometrySettings.Latitude,
    profileInfo.AstrometrySettings.Longitude,
    profileInfo.AstrometrySettings.Elevation,
  ]);

  // Handle mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!stelRef.current) return;
      
      const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const newFovDeg = Math.max(MIN_FOV, Math.min(MAX_FOV, currentFovDeg * zoomFactor));
      // Use direct property assignment for better compatibility
      stelRef.current.core.fov = fovToRad(newFovDeg);
      onFovChange?.(newFovDeg);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [onFovChange]);

  // Long press handling for mobile devices
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_DURATION = 500; // ms
  const TOUCH_MOVE_THRESHOLD = 10; // pixels

  // Right-click drag detection - only show context menu on click, not drag
  const rightMouseDownPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const RIGHT_CLICK_THRESHOLD = 5; // pixels - if moved more than this, it's a drag
  const RIGHT_CLICK_TIME_THRESHOLD = 300; // ms - max time for a click

  // Handle right-click context menu - distinguish between click and drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Track right mouse button down
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right button
        rightMouseDownPosRef.current = {
          x: e.clientX,
          y: e.clientY,
          time: Date.now(),
        };
      }
    };

    // Track mouse movement to detect drag
    const handleMouseMove = (e: MouseEvent) => {
      if (rightMouseDownPosRef.current && (e.buttons & 2)) { // Right button held
        const dx = e.clientX - rightMouseDownPosRef.current.x;
        const dy = e.clientY - rightMouseDownPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If moved too far, mark as drag (not a click)
        if (distance > RIGHT_CLICK_THRESHOLD) {
          rightMouseDownPosRef.current = null;
        }
      }
    };

    // Handle mouse up - clear tracking (needed for cleanup)
    const handleMouseUp = () => {
      // Context menu event will handle the actual action
      // This is just for cleanup if needed
    };

    const handleContextMenu = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      
      // Check if this was a click (not a drag)
      const wasClick = rightMouseDownPosRef.current !== null && 
        (Date.now() - rightMouseDownPosRef.current.time) < RIGHT_CLICK_TIME_THRESHOLD;
      
      // Clear the tracking
      rightMouseDownPosRef.current = null;
      
      // If it was a drag, let Stellarium handle it (don't show context menu)
      if (!wasClick) {
        mouseEvent.preventDefault(); // Still prevent browser context menu
        return;
      }
      
      // Prevent default browser context menu
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      
      // Call the onContextMenu callback if provided
      if (onContextMenu) {
        const coords = getClickCoordinates(mouseEvent.clientX, mouseEvent.clientY);
        const syntheticEvent = {
          clientX: mouseEvent.clientX,
          clientY: mouseEvent.clientY,
          preventDefault: () => {},
          stopPropagation: () => {},
          nativeEvent: mouseEvent,
        } as unknown as React.MouseEvent;
        onContextMenu(syntheticEvent, coords);
      }
    };

    // Long press handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      
      // Start long press timer
      longPressTimeoutRef.current = setTimeout(() => {
        if (!touchStartPosRef.current) return;
        
        // Call callback directly for long press (no need for synthetic event)
        if (onContextMenu) {
          const coords = getClickCoordinates(touchStartPosRef.current.x, touchStartPosRef.current.y);
          const syntheticEvent = {
            clientX: touchStartPosRef.current.x,
            clientY: touchStartPosRef.current.y,
            preventDefault: () => {},
            stopPropagation: () => {},
          } as unknown as React.MouseEvent;
          onContextMenu(syntheticEvent, coords);
        }
        
        touchStartPosRef.current = null;
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPosRef.current || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      
      // Cancel long press if moved too far
      if (Math.sqrt(dx * dx + dy * dy) > TOUCH_MOVE_THRESHOLD) {
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
        touchStartPosRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      touchStartPosRef.current = null;
    };

    // Mouse event listeners for right-click detection
    container.addEventListener('mousedown', handleMouseDown, { capture: true });
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    // Use capture phase to intercept BEFORE Stellarium engine's handlers
    container.addEventListener('contextmenu', handleContextMenu, { capture: true });
    // Touch event listeners for mobile long press
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, { capture: true });
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, [onContextMenu, getClickCoordinates]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      
      {/* Loading Overlay */}
      {(isLoading || errorMessage) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-4 text-center">
          {isLoading && !errorMessage && (
            <Spinner className="h-8 w-8 text-primary mb-4" />
          )}
          <p className="text-muted-foreground text-sm mb-2">{loadingStatus}</p>
          {errorMessage && (
            <>
              <p className="text-destructive text-xs mb-3">{errorMessage}</p>
              <button
                className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                onClick={handleRetry}
              >
                {t('retry')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});


