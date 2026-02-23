'use client';

import { forwardRef, useLayoutEffect, useRef } from 'react';
import { useSettingsStore, useStellariumStore } from '@/lib/stores';
import type { SkyMapCanvasRef, SkyMapCanvasProps } from '@/lib/core/types/sky-engine';
import { StellariumCanvas } from './stellarium-canvas';
import { AladinCanvas } from './aladin-canvas';

/**
 * SkyMapCanvas - Engine-switching wrapper component
 *
 * Renders either StellariumCanvas or AladinCanvas based on the
 * `skyEngine` setting. Uses `key={skyEngine}` to force full
 * re-mount when switching engines, ensuring proper WebGL cleanup.
 */
export const SkyMapCanvas = forwardRef<SkyMapCanvasRef, SkyMapCanvasProps>(
  function SkyMapCanvas(props, ref) {
    const skyEngine = useSettingsStore((s) => s.skyEngine);
    const prevEngineRef = useRef(skyEngine);

    useLayoutEffect(() => {
      if (prevEngineRef.current !== skyEngine) {
        useStellariumStore.getState().saveViewState();
        prevEngineRef.current = skyEngine;
      }
    }, [skyEngine]);

    if (skyEngine === 'aladin') {
      return <AladinCanvas key="aladin" ref={ref} {...props} />;
    }

    // Default: Stellarium
    return <StellariumCanvas key="stellarium" ref={ref} {...props} />;
  }
);
