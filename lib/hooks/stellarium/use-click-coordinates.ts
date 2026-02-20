'use client';

import { useCallback, RefObject } from 'react';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { createLogger } from '@/lib/logger';
import { ndcToViewVector } from '@/lib/core/stellarium-projection';
import { dateToJulianDate } from '@/lib/astronomy/time/julian';
import type { StellariumEngine } from '@/lib/core/types';
import type { ClickCoordinates } from '@/types/stellarium-canvas';

const logger = createLogger('use-click-coordinates');

function normalizeRa(raDeg: number): number {
  return ((raDeg % 360) + 360) % 360;
}

function clampDec(decDeg: number): number {
  return Math.min(90, Math.max(-90, decDeg));
}

/** Hook for calculating celestial coordinates from click position across all Stellarium projections. */
export function useClickCoordinates(
  stelRef: RefObject<StellariumEngine | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  const getClickCoordinates = useCallback((clientX: number, clientY: number): ClickCoordinates | null => {
    if (!stelRef.current || !canvasRef.current) return null;
    
    const stel = stelRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    try {
      const core = stel.core;
      const fov = core.fov;
      const aspect = rect.width / rect.height;
      
      // Calculate pixel position relative to canvas
      const pixelX = clientX - rect.left;
      const pixelY = clientY - rect.top;
      
      // Convert to normalized device coordinates (-1 to 1)
      // Screen Y is inverted (0 at top, increases downward)
      const ndcX = (pixelX / rect.width) * 2 - 1;
      const ndcY = 1 - (pixelY / rect.height) * 2;

      const viewVec = ndcToViewVector(ndcX, ndcY, {
        projection: core.projection,
        fov,
        aspect,
      });
      if (!viewVec) return null;
      
      // Convert VIEW -> ICRF (equatorial coordinates)
      const icrfVec = stel.convertFrame(stel.observer, 'VIEW', 'ICRF', viewVec);
      const spherical = stel.c2s(icrfVec);
      
      const raRad = stel.anp(spherical[0]);
      const decRad = spherical[1];
      
      const raDeg = normalizeRa(rad2deg(raRad));
      const decDeg = clampDec(rad2deg(decRad));
      const epochJd = dateToJulianDate(new Date());
      
      return {
        ra: raDeg,
        dec: decDeg,
        raStr: degreesToHMS(raDeg),
        decStr: degreesToDMS(decDeg),
        frame: 'ICRF',
        timeScale: 'UTC',
        qualityFlag: 'precise',
        dataFreshness: 'fallback',
        source: 'engine',
        epochJd,
      };
    } catch (error) {
      logger.error('Error calculating click coordinates', error);
      return null;
    }
  }, [stelRef, canvasRef]);

  return { getClickCoordinates };
}
