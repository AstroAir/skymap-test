'use client';

import { useCallback, RefObject } from 'react';
import { rad2deg } from '@/lib/astronomy/starmap-utils';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { createLogger } from '@/lib/logger';
import type { StellariumEngine } from '@/lib/core/types';
import type { ClickCoordinates } from '../types';

const logger = createLogger('use-click-coordinates');

/**
 * Hook for calculating celestial coordinates from click position
 * Uses gnomonic (rectilinear) projection - inverse of convertToScreen in SkyMarkers
 */
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
  }, [stelRef, canvasRef]);

  return { getClickCoordinates };
}
