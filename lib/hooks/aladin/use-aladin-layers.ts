'use client';

import { useEffect, useRef, useCallback, useState, type RefObject } from 'react';
import type A from 'aladin-lite';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;
type HpxImageSurvey = ReturnType<typeof A.imageHiPS>;

const logger = createLogger('aladin-layers');

// ============================================================================
// Types
// ============================================================================

export interface OverlayLayer {
  id: string;
  name: string;
  surveyId: string;
  opacity: number;
  additive: boolean;
}

// ============================================================================
// Hook
// ============================================================================

interface UseAladinLayersOptions {
  aladinRef: RefObject<AladinInstance | null>;
  engineReady: boolean;
}

interface UseAladinLayersReturn {
  overlayLayers: OverlayLayer[];
  addOverlayLayer: (surveyId: string, name: string) => void;
  removeOverlayLayer: (layerId: string) => void;
  setOverlayOpacity: (layerId: string, opacity: number) => void;
  setOverlayBlending: (layerId: string, additive: boolean) => void;
}

export function useAladinLayers({
  aladinRef,
  engineReady,
}: UseAladinLayersOptions): UseAladinLayersReturn {
  const skyEngine = useSettingsStore((state) => state.skyEngine);
  const [overlayLayers, setOverlayLayers] = useState<OverlayLayer[]>([]);

  // Track survey instances for each overlay layer
  const surveyInstancesRef = useRef<Map<string, HpxImageSurvey>>(new Map());

  // Aladin static API
  const aladinStaticRef = useRef<typeof A | null>(null);

  // Load static API
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;
    import('aladin-lite').then((m) => {
      aladinStaticRef.current = m.default;
    }).catch((err) => {
      logger.warn('Failed to load aladin-lite static API for layers', err);
    });
  }, [engineReady, skyEngine]);

  const addOverlayLayer = useCallback((surveyId: string, name: string) => {
    const aladin = aladinRef.current;
    const AStatic = aladinStaticRef.current;
    if (!aladin || !AStatic) return;

    const layerId = `overlay-${Date.now()}`;

    try {
      const survey = AStatic.imageHiPS(surveyId, { name });
      aladin.setOverlayImageLayer(survey, layerId);
      survey.setAlpha(0.5);

      surveyInstancesRef.current.set(layerId, survey);

      setOverlayLayers((prev) => [
        ...prev,
        { id: layerId, name, surveyId, opacity: 0.5, additive: false },
      ]);

      logger.info(`Overlay layer added: ${name} (${surveyId})`);
    } catch (error) {
      logger.warn(`Failed to add overlay layer: ${name}`, error);
    }
  }, [aladinRef]);

  const removeOverlayLayer = useCallback((layerId: string) => {
    const aladin = aladinRef.current;
    if (!aladin) return;

    try {
      aladin.removeOverlayImageLayer(layerId);
      surveyInstancesRef.current.delete(layerId);
      setOverlayLayers((prev) => prev.filter((l) => l.id !== layerId));
      logger.info(`Overlay layer removed: ${layerId}`);
    } catch (error) {
      logger.warn(`Failed to remove overlay layer: ${layerId}`, error);
    }
  }, [aladinRef]);

  const setOverlayOpacity = useCallback((layerId: string, opacity: number) => {
    const survey = surveyInstancesRef.current.get(layerId);
    if (!survey) return;

    try {
      survey.setAlpha(opacity);
      setOverlayLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, opacity } : l))
      );
    } catch (error) {
      logger.warn(`Failed to set overlay opacity: ${layerId}`, error);
    }
  }, []);

  const setOverlayBlending = useCallback((layerId: string, additive: boolean) => {
    const survey = surveyInstancesRef.current.get(layerId);
    if (!survey) return;

    try {
      survey.setBlendingConfig(additive);
      setOverlayLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, additive } : l))
      );
    } catch (error) {
      logger.warn(`Failed to set overlay blending: ${layerId}`, error);
    }
  }, []);

  // Cleanup on engine switch or unmount
  useEffect(() => {
    const currentAladinRef = aladinRef;
    const currentInstances = surveyInstancesRef.current;
    return () => {
      const aladin = currentAladinRef.current;
      if (aladin) {
        for (const [layerId] of currentInstances) {
          try { aladin.removeOverlayImageLayer(layerId); } catch { /* ignore */ }
        }
      }
      currentInstances.clear();
      setOverlayLayers([]);
    };
  }, [aladinRef]);

  return {
    overlayLayers,
    addOverlayLayer,
    removeOverlayLayer,
    setOverlayOpacity,
    setOverlayBlending,
  };
}
