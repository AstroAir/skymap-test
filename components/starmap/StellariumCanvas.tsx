'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { useStellariumStore, useSettingsStore, useMountStore } from '@/lib/starmap/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/starmap/utils';
import { Spinner } from '@/components/ui/spinner';
import type { StellariumEngine, SelectedObjectData } from '@/lib/starmap/types';

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
}

interface StellariumCanvasProps {
  onSelectionChange?: (selection: SelectedObjectData | null) => void;
  onFovChange?: (fov: number) => void;
  onContextMenu?: (e: React.MouseEvent, coords: { ra: number; dec: number; raStr: string; decStr: string } | null) => void;
}

export const StellariumCanvas = forwardRef<StellariumCanvasRef, StellariumCanvasProps>(
  function StellariumCanvas({ onSelectionChange, onFovChange, onContextMenu }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scriptLoadedRef = useRef(false);
  const stelRef = useRef<StellariumEngine | null>(null);
  const settingsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  
  const setStel = useStellariumStore((state) => state.setStel);
  const setBaseUrl = useStellariumStore((state) => state.setBaseUrl);
  const setHelpers = useStellariumStore((state) => state.setHelpers);
  const updateStellariumCore = useStellariumStore((state) => state.updateStellariumCore);
  
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  
  const profileInfo = useMountStore((state) => state.profileInfo);

  // Helper to get coordinates from click position
  const getClickCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!stelRef.current || !canvasRef.current) return null;
    
    const stel = stelRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate normalized device coordinates (-1 to 1)
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    
    try {
      // Get view direction at click position
      const fov = stel.core.fov;
      const aspect = rect.width / rect.height;
      
      // Calculate angular offset from center
      const halfFovH = fov / 2;
      const halfFovV = halfFovH / aspect;
      
      const azOffset = x * halfFovH;
      const altOffset = y * halfFovV;
      
      // Get current view center
      const viewVec = [0, 0, -1];
      const cirsVec = stel.convertFrame(stel.observer, 'VIEW', 'CIRS', viewVec);
      const centerSpherical = stel.c2s(cirsVec);
      
      // Apply offset (simplified - works well for small FOV)
      const raRad = stel.anp(centerSpherical[0] + azOffset * stel.D2R);
      const decRad = Math.max(-Math.PI/2, Math.min(Math.PI/2, centerSpherical[1] + altOffset * stel.D2R));
      
      const raDeg = rad2deg(raRad);
      const decDeg = rad2deg(decRad);
      
      return {
        ra: raDeg,
        dec: decDeg,
        raStr: degreesToHMS(((raDeg % 360) + 360) % 360),
        decStr: degreesToDMS(decDeg),
      };
    } catch (error) {
      console.error('Error calculating click coordinates:', error);
      return null;
    }
  }, []);

  // Expose zoom methods via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (stelRef.current) {
        const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
        const newFovDeg = Math.max(MIN_FOV, currentFovDeg * 0.8);
        Object.assign(stelRef.current.core, { fov: fovToRad(newFovDeg) });
        onFovChange?.(newFovDeg);
      }
    },
    zoomOut: () => {
      if (stelRef.current) {
        const currentFovDeg = fovToDeg(stelRef.current.core.fov) || DEFAULT_FOV;
        const newFovDeg = Math.min(MAX_FOV, currentFovDeg * 1.25);
        Object.assign(stelRef.current.core, { fov: fovToRad(newFovDeg) });
        onFovChange?.(newFovDeg);
      }
    },
    setFov: (fov: number) => {
      if (stelRef.current) {
        const clampedFov = Math.max(MIN_FOV, Math.min(MAX_FOV, fov));
        Object.assign(stelRef.current.core, { fov: fovToRad(clampedFov) });
        onFovChange?.(clampedFov);
      }
    },
    getFov: () => {
      return stelRef.current ? fovToDeg(stelRef.current.core.fov) : DEFAULT_FOV;
    },
    getClickCoordinates,
  }), [onFovChange, getClickCoordinates]);

  // Initialize Stellarium
  const initStellarium = useCallback((stel: StellariumEngine) => {
    console.log('Stellarium is ready!');
    stelRef.current = stel;
    setStel(stel);

    // Set observer location from profile
    const lat = profileInfo.AstrometrySettings.Latitude || 0;
    const lon = profileInfo.AstrometrySettings.Longitude || 0;
    const elev = profileInfo.AstrometrySettings.Elevation || 0;
    
    Object.assign(stel.core.observer, {
      latitude: lat * stel.D2R,
      longitude: lon * stel.D2R,
      elevation: elev,
    });

    // Set time speed to 1 and initial FOV
    // Use setTimeout to ensure the engine is fully initialized before setting FOV
    Object.assign(stel.core, { time_speed: 1 });
    setTimeout(() => {
      if (stelRef.current) {
        Object.assign(stelRef.current.core, { fov: fovToRad(DEFAULT_FOV) });
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
        Object.assign(stel.core, { selection: targetCircle });
        stel.pointAndLock(targetCircle);
      } catch (error) {
        console.error('Error setting view direction:', error);
      }
    };

    setHelpers({ getCurrentViewDirection, setViewDirection });

    // Add data sources - use local path for textures
    const baseUrl = '/stellarium-data/';
    setBaseUrl(baseUrl);

    const core = stel.core;

    // Add all data sources
    core.stars.addDataSource({ url: baseUrl + 'stars' });
    core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
    core.dsos.addDataSource({ url: baseUrl + 'dso' });
    core.dss.addDataSource({ url: baseUrl + 'surveys/dss' });
    core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
    core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
    
    // Planets
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
    core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });

    // Apply initial settings - get latest from store to avoid stale closure
    const currentSettings = useSettingsStore.getState().stellarium;
    updateStellariumCore(currentSettings);

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

  // Load Stellarium script
  useEffect(() => {
    if (scriptLoadedRef.current || !canvasRef.current) return;
    scriptLoadedRef.current = true;

    setLoadingStatus('Loading engine...');

    const script = document.createElement('script');
    script.src = '/stellarium-js/stellarium-web-engine.js';
    
    script.onload = async () => {
      if (!window.StelWebEngine) {
        console.error('StelWebEngine global object not found!');
        setLoadingStatus('Error: Engine not found');
        return;
      }

      try {
        setLoadingStatus('Loading WebAssembly...');
        const wasmPath = '/stellarium-js/stellarium-web-engine.wasm';
        const response = await fetch(wasmPath);
        if (!response.ok) {
          throw new Error(`Error loading WASM file: ${response.statusText}`);
        }
        
        const wasmArrayBuffer = await response.arrayBuffer();
        console.log('WASM file loaded successfully. Size (bytes):', wasmArrayBuffer.byteLength);

        setLoadingStatus('Initializing star map...');
        window.StelWebEngine({
          wasmFile: wasmPath,
          canvas: canvasRef.current!,
          onReady: (stel: StellariumEngine) => {
            initStellarium(stel);
            setIsLoading(false);
          },
        });
      } catch (err) {
        console.error('Error with Fetch or StelWebEngine:', err);
        setLoadingStatus('Error loading engine');
      }
    };

    script.onerror = () => {
      setLoadingStatus('Error loading script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      stelRef.current = null;
      setStel(null);
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, [initStellarium, setStel]);

  // Apply settings changes to Stellarium core with debouncing
  useEffect(() => {
    if (!stelRef.current) return;
    
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
  }, [stellariumSettings, updateStellariumCore]);

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
      Object.assign(stelRef.current.core, { fov: fovToRad(newFovDeg) });
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

  // Handle right-click context menu - intercept in capture phase to prevent Stellarium from blocking it
  // Then re-dispatch a synthetic event that will bubble to ContextMenuTrigger
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Custom property to mark our synthetic events
    const SYNTHETIC_MARKER = '__stellarium_ctx_synthetic__';

    const handleContextMenu = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      
      // Skip our own synthetic events to avoid infinite loop
      if ((mouseEvent as unknown as Record<string, boolean>)[SYNTHETIC_MARKER]) {
        return;
      }
      
      // Prevent default browser context menu
      mouseEvent.preventDefault();
      // Stop propagation to prevent Stellarium engine from handling/blocking it
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
      
      // Create and dispatch a new synthetic event that will bubble to ContextMenuTrigger
      const syntheticMouseEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: mouseEvent.clientX,
        clientY: mouseEvent.clientY,
        screenX: mouseEvent.screenX,
        screenY: mouseEvent.screenY,
        button: mouseEvent.button,
        buttons: mouseEvent.buttons,
      });
      // Mark as synthetic to avoid re-processing
      (syntheticMouseEvent as unknown as Record<string, boolean>)[SYNTHETIC_MARKER] = true;
      
      // Dispatch from container - it will bubble up to ContextMenuTrigger
      container.dispatchEvent(syntheticMouseEvent);
    };

    // Long press handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      
      // Start long press timer
      longPressTimeoutRef.current = setTimeout(() => {
        if (!touchStartPosRef.current) return;
        
        // Call callback first
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
        
        // Trigger context menu via synthetic event (marked to skip our handler)
        const syntheticMouseEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: touchStartPosRef.current.x,
          clientY: touchStartPosRef.current.y,
          screenX: touch.screenX,
          screenY: touch.screenY,
          button: 2,
          buttons: 2,
        });
        (syntheticMouseEvent as unknown as Record<string, boolean>)[SYNTHETIC_MARKER] = true;
        container.dispatchEvent(syntheticMouseEvent);
        
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

    // Use capture phase to intercept BEFORE Stellarium engine's handlers
    container.addEventListener('contextmenu', handleContextMenu, { capture: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
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
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <Spinner className="h-8 w-8 text-primary mb-4" />
          <p className="text-muted-foreground text-sm">{loadingStatus}</p>
        </div>
      )}
    </div>
  );
});
