'use client';

import { useCallback, RefObject } from 'react';
import type { StellariumEngine, StellariumLayer, StellariumObject } from '@/lib/core/types';

type GeoJsonPayload = {
  type: 'FeatureCollection';
  features: unknown[];
};

type GeoJsonObject = StellariumObject & {
  setData?: (data: GeoJsonPayload) => void;
  filterAll?: (cb: (index: number, feature: unknown) => boolean | Record<string, unknown>) => void;
  queryRenderedFeatureIds?: (point: { x: number; y: number } | [number, number]) => number[];
};

export function useStellariumLayerApi(stelRef: RefObject<StellariumEngine | null>) {
  const createLayer = useCallback((options: { id: string; z: number; visible: boolean }): StellariumLayer | null => {
    const stel = stelRef.current;
    if (!stel) return null;
    return stel.createLayer(options);
  }, [stelRef]);

  const createObject = useCallback((type: string, options: Record<string, unknown>): StellariumObject | null => {
    const stel = stelRef.current;
    if (!stel) return null;
    return stel.createObj(type, options);
  }, [stelRef]);

  const createGeoJsonObject = useCallback((data: GeoJsonPayload): GeoJsonObject | null => {
    const stel = stelRef.current;
    if (!stel) return null;

    const obj = stel.createObj('geojson', {}) as GeoJsonObject;
    if (obj?.setData) {
      obj.setData(data);
    }
    return obj;
  }, [stelRef]);

  const createGeoJsonSurvey = useCallback((options: Record<string, unknown>): GeoJsonObject | null => {
    const stel = stelRef.current;
    if (!stel) return null;
    return stel.createObj('geojson-survey', options) as GeoJsonObject;
  }, [stelRef]);

  return {
    createLayer,
    createObject,
    createGeoJsonObject,
    createGeoJsonSurvey,
  };
}
