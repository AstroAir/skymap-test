'use client';

import { useEffect, useRef, useCallback, useState, type RefObject } from 'react';
import type A from 'aladin-lite';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;
type AladinMOC = ReturnType<typeof A.MOCFromURL>;

const logger = createLogger('aladin-moc');

// ============================================================================
// Types
// ============================================================================

export interface MOCLayer {
  id: string;
  name: string;
  url: string;
  color: string;
  opacity: number;
  visible: boolean;
}

// Well-known MOC URLs for common surveys
export const WELL_KNOWN_MOCS: { name: string; url: string; color: string }[] = [
  {
    name: 'SDSS DR16',
    url: 'https://alasky.cds.unistra.fr/footprints/tables/vizier/V_154_sdss16/MOC',
    color: '#2196f3',
  },
  {
    name: 'Gaia DR3',
    url: 'https://alasky.cds.unistra.fr/footprints/tables/vizier/I_355_gaiadr3/MOC',
    color: '#ff9800',
  },
  {
    name: '2MASS',
    url: 'https://alasky.cds.unistra.fr/footprints/tables/vizier/II_246_out/MOC',
    color: '#f44336',
  },
  {
    name: 'WISE AllSky',
    url: 'https://alasky.cds.unistra.fr/footprints/tables/vizier/II_328_allwise/MOC',
    color: '#4caf50',
  },
];

// ============================================================================
// Hook
// ============================================================================

interface UseAladinMOCOptions {
  aladinRef: RefObject<AladinInstance | null>;
  engineReady: boolean;
}

interface UseAladinMOCReturn {
  mocLayers: MOCLayer[];
  addMOC: (url: string, name: string, color?: string) => void;
  removeMOC: (mocId: string) => void;
  toggleMOC: (mocId: string) => void;
  setMOCOpacity: (mocId: string, opacity: number) => void;
}

export function useAladinMOC({
  aladinRef,
  engineReady,
}: UseAladinMOCOptions): UseAladinMOCReturn {
  const skyEngine = useSettingsStore((state) => state.skyEngine);
  const [mocLayers, setMocLayers] = useState<MOCLayer[]>([]);

  // Track MOC instances
  const mocInstancesRef = useRef<Map<string, AladinMOC>>(new Map());

  // Aladin static API
  const aladinStaticRef = useRef<typeof A | null>(null);

  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;
    import('aladin-lite').then((m) => {
      aladinStaticRef.current = m.default;
    }).catch((err) => {
      logger.warn('Failed to load aladin-lite static API for MOC', err);
    });
  }, [engineReady, skyEngine]);

  const addMOC = useCallback((url: string, name: string, color = '#3b82f6') => {
    const aladin = aladinRef.current;
    const AStatic = aladinStaticRef.current;
    if (!aladin || !AStatic) return;

    const mocId = `moc-${Date.now()}`;

    try {
      const moc = AStatic.MOCFromURL(url, {
        name,
        color,
        opacity: 0.3,
        lineWidth: 1,
        adaptativeDisplay: true,
      });

      aladin.addMOC(moc);
      mocInstancesRef.current.set(mocId, moc);

      setMocLayers((prev) => [
        ...prev,
        { id: mocId, name, url, color, opacity: 0.3, visible: true },
      ]);

      logger.info(`MOC added: ${name}`);
    } catch (error) {
      logger.warn(`Failed to add MOC: ${name}`, error);
    }
  }, [aladinRef]);

  const removeMOC = useCallback((mocId: string) => {
    const moc = mocInstancesRef.current.get(mocId);
    if (moc) {
      try { moc.hide(); } catch { /* ignore */ }
      mocInstancesRef.current.delete(mocId);
    }
    setMocLayers((prev) => prev.filter((l) => l.id !== mocId));
    logger.info(`MOC removed: ${mocId}`);
  }, []);

  const toggleMOC = useCallback((mocId: string) => {
    const moc = mocInstancesRef.current.get(mocId);
    if (!moc) return;

    try {
      moc.toggle();
      setMocLayers((prev) =>
        prev.map((l) => (l.id === mocId ? { ...l, visible: !l.visible } : l))
      );
    } catch (error) {
      logger.warn(`Failed to toggle MOC: ${mocId}`, error);
    }
  }, []);

  const setMOCOpacity = useCallback((mocId: string, opacity: number) => {
    const moc = mocInstancesRef.current.get(mocId);
    if (!moc) return;

    try {
      moc.setOpacity(opacity);
      setMocLayers((prev) =>
        prev.map((l) => (l.id === mocId ? { ...l, opacity } : l))
      );
    } catch (error) {
      logger.warn(`Failed to set MOC opacity: ${mocId}`, error);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    const currentInstances = mocInstancesRef.current;
    return () => {
      for (const [, moc] of currentInstances) {
        try { moc.hide(); } catch { /* ignore */ }
      }
      currentInstances.clear();
      setMocLayers([]);
    };
  }, []);

  return {
    mocLayers,
    addMOC,
    removeMOC,
    toggleMOC,
    setMOCOpacity,
  };
}
