'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type A from 'aladin-lite';
import { useMarkerStore, type SkyMarker } from '@/lib/stores/marker-store';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;
type AladinGraphicOverlay = ReturnType<typeof A.graphicOverlay>;

const logger = createLogger('aladin-overlays');

// ============================================================================
// Hook
// ============================================================================

interface UseAladinOverlaysOptions {
  aladinRef: RefObject<AladinInstance | null>;
  engineReady: boolean;
}

export function useAladinOverlays({
  aladinRef,
  engineReady,
}: UseAladinOverlaysOptions): void {
  const skyEngine = useSettingsStore((state) => state.skyEngine);

  // Overlay refs — one for markers, one for targets
  const markerOverlayRef = useRef<AladinGraphicOverlay | null>(null);
  const targetOverlayRef = useRef<AladinGraphicOverlay | null>(null);

  // Aladin static API ref for shape factories
  const aladinStaticRef = useRef<typeof A | null>(null);

  // Load static API once
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    import('aladin-lite').then((m) => {
      aladinStaticRef.current = m.default;
    }).catch((err) => {
      logger.warn('Failed to load aladin-lite static API for overlays', err);
    });
  }, [engineReady, skyEngine]);

  // Subscribe to marker store changes and render native overlays
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    const renderMarkers = () => {
      const aladin = aladinRef.current;
      const AStatic = aladinStaticRef.current;
      if (!aladin || !AStatic) return;

      // Create overlay on first use
      if (!markerOverlayRef.current) {
        markerOverlayRef.current = AStatic.graphicOverlay({
          name: 'sky-markers',
          color: '#ef4444',
          lineWidth: 2,
        });
        aladin.addOverlay(markerOverlayRef.current);
      }

      const overlay = markerOverlayRef.current;
      overlay.removeAll();

      const markers = useMarkerStore.getState().markers;
      for (const marker of markers) {
        if (!marker.visible) continue;
        const shape = AStatic.circle(
          marker.ra,
          marker.dec,
          marker.size ? marker.size / 60 : 0.05, // size in degrees
          { color: marker.color, lineWidth: 2 }
        );
        overlay.add(shape);
      }

      logger.debug(`Rendered ${markers.filter((m: SkyMarker) => m.visible).length} marker overlays`);
    };

    // Initial render
    const timer = setTimeout(renderMarkers, 500);

    // Subscribe to marker changes
    const unsub = useMarkerStore.subscribe(renderMarkers);

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [aladinRef, engineReady, skyEngine]);

  // Subscribe to target list and render target position overlays
  useEffect(() => {
    if (!engineReady || skyEngine !== 'aladin') return;

    const renderTargets = () => {
      const aladin = aladinRef.current;
      const AStatic = aladinStaticRef.current;
      if (!aladin || !AStatic) return;

      // Create overlay on first use
      if (!targetOverlayRef.current) {
        targetOverlayRef.current = AStatic.graphicOverlay({
          name: 'target-list',
          color: '#22c55e',
          lineWidth: 1,
        });
        aladin.addOverlay(targetOverlayRef.current);
      }

      const overlay = targetOverlayRef.current;
      overlay.removeAll();

      const { targets, activeTargetId } = useTargetListStore.getState();
      for (const target of targets) {
        const isActive = target.id === activeTargetId;
        const shape = AStatic.circle(
          target.ra,
          target.dec,
          0.08, // small circle for target positions
          {
            color: isActive ? '#f59e0b' : '#22c55e',
            lineWidth: isActive ? 3 : 1,
          }
        );
        overlay.add(shape);
      }

      logger.debug(`Rendered ${targets.length} target overlays`);
    };

    // Initial render
    const timer = setTimeout(renderTargets, 600);

    // Subscribe to target list changes
    const unsub = useTargetListStore.subscribe(renderTargets);

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [aladinRef, engineReady, skyEngine]);

  // Cleanup overlays on engine switch
  useEffect(() => {
    return () => {
      if (markerOverlayRef.current) {
        try { markerOverlayRef.current.removeAll(); } catch { /* ignore */ }
        markerOverlayRef.current = null;
      }
      if (targetOverlayRef.current) {
        try { targetOverlayRef.current.removeAll(); } catch { /* ignore */ }
        targetOverlayRef.current = null;
      }
    };
  }, []);
}
