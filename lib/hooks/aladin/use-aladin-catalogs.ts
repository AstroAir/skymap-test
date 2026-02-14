'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';
import type A from 'aladin-lite';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;
type AladinCatalog = ReturnType<typeof A.catalog>;

const logger = createLogger('aladin-catalogs');

// ============================================================================
// Types
// ============================================================================

export type CatalogSourceType = 'simbad' | 'vizier' | 'ned';

export interface CatalogLayerConfig {
  id: string;
  type: CatalogSourceType;
  name: string;
  enabled: boolean;
  color: string;
  /** VizieR catalog ID (only for vizier type) */
  vizierCatId?: string;
  /** Search radius in degrees */
  radius: number;
  /** Max number of sources to display */
  limit: number;
}

export const DEFAULT_CATALOG_LAYERS: CatalogLayerConfig[] = [
  {
    id: 'simbad',
    type: 'simbad',
    name: 'SIMBAD',
    enabled: false,
    color: '#ff9800',
    radius: 0.5,
    limit: 1000,
  },
  {
    id: 'ned',
    type: 'ned',
    name: 'NED',
    enabled: false,
    color: '#4caf50',
    radius: 0.5,
    limit: 500,
  },
  {
    id: 'vizier-tycho2',
    type: 'vizier',
    name: 'Tycho-2',
    enabled: false,
    color: '#2196f3',
    vizierCatId: 'I/259/tyc2',
    radius: 0.25,
    limit: 5000,
  },
  {
    id: 'vizier-ucac4',
    type: 'vizier',
    name: 'UCAC4',
    enabled: false,
    color: '#9c27b0',
    vizierCatId: 'I/322A/out',
    radius: 0.1,
    limit: 5000,
  },
];

// ============================================================================
// Hook
// ============================================================================

interface UseAladinCatalogsOptions {
  aladinRef: RefObject<AladinInstance | null>;
  engineReady: boolean;
}

interface UseAladinCatalogsReturn {
  catalogLayers: CatalogLayerConfig[];
  toggleCatalog: (catalogId: string) => void;
  refreshCatalogs: () => void;
}

export function useAladinCatalogs({
  aladinRef,
  engineReady,
}: UseAladinCatalogsOptions): UseAladinCatalogsReturn {
  const skyEngine = useSettingsStore((state) => state.skyEngine);

  // Store catalog layer configs in a ref to avoid re-renders on every position change
  const catalogLayersRef = useRef<CatalogLayerConfig[]>(
    DEFAULT_CATALOG_LAYERS.map((l) => ({ ...l }))
  );

  // Track active Aladin catalog objects for cleanup
  const activeCatalogsRef = useRef<Map<string, AladinCatalog>>(new Map());

  // Track the Aladin static API reference for factory methods
  const aladinStaticRef = useRef<typeof A | null>(null);

  // Load Aladin static API on first use
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    import('aladin-lite').then((m) => {
      aladinStaticRef.current = m.default;
    }).catch((err) => {
      logger.warn('Failed to load aladin-lite static API for catalogs', err);
    });
  }, [engineReady, skyEngine]);

  const loadCatalog = useCallback((config: CatalogLayerConfig) => {
    const aladin = aladinRef.current;
    const AStatic = aladinStaticRef.current;
    if (!aladin || !AStatic) return;

    // Remove existing catalog if any
    const existing = activeCatalogsRef.current.get(config.id);
    if (existing) {
      try { existing.hide(); } catch { /* ignore */ }
      activeCatalogsRef.current.delete(config.id);
    }

    if (!config.enabled) return;

    try {
      const [ra, dec] = aladin.getRaDec();
      const target = `${ra} ${dec}`;
      let catalog: AladinCatalog;

      const opts = {
        name: config.name,
        color: config.color,
        sourceSize: 8,
        limit: config.limit,
        onClick: 'showPopup' as const,
      };

      switch (config.type) {
        case 'simbad':
          catalog = AStatic.catalogFromSimbad(
            { ra, dec },
            config.radius,
            opts
          );
          break;
        case 'ned':
          catalog = AStatic.catalogFromNED(
            target,
            config.radius,
            opts
          );
          break;
        case 'vizier':
          if (!config.vizierCatId) return;
          catalog = AStatic.catalogFromVizieR(
            config.vizierCatId,
            target,
            config.radius,
            opts
          );
          break;
        default:
          return;
      }

      aladin.addCatalog(catalog);
      activeCatalogsRef.current.set(config.id, catalog);
      logger.info(`Catalog loaded: ${config.name}`);
    } catch (error) {
      logger.warn(`Failed to load catalog: ${config.name}`, error);
    }
  }, [aladinRef]);

  const toggleCatalog = useCallback((catalogId: string) => {
    const layers = catalogLayersRef.current;
    const idx = layers.findIndex((l) => l.id === catalogId);
    if (idx === -1) return;

    layers[idx] = { ...layers[idx], enabled: !layers[idx].enabled };

    if (layers[idx].enabled) {
      loadCatalog(layers[idx]);
    } else {
      const existing = activeCatalogsRef.current.get(catalogId);
      if (existing) {
        try { existing.hide(); } catch { /* ignore */ }
        activeCatalogsRef.current.delete(catalogId);
      }
    }
    // Force re-render by creating new array reference
    catalogLayersRef.current = [...layers];
  }, [loadCatalog]);

  const refreshCatalogs = useCallback(() => {
    const layers = catalogLayersRef.current;
    for (const layer of layers) {
      if (layer.enabled) {
        loadCatalog(layer);
      }
    }
  }, [loadCatalog]);

  // Cleanup on unmount or engine switch
  useEffect(() => {
    if (skyEngine !== 'aladin' || !engineReady) {
      // Clear all active catalogs
      for (const [, catalog] of activeCatalogsRef.current) {
        try { catalog.hide(); } catch { /* ignore */ }
      }
      activeCatalogsRef.current.clear();
    }
  }, [skyEngine, engineReady]);

  return {
    catalogLayers: catalogLayersRef.current,
    toggleCatalog,
    refreshCatalogs,
  };
}
