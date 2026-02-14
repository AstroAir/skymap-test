'use client';

import { useEffect, useCallback, useRef, type RefObject } from 'react';
import type A from 'aladin-lite';
import type { SelectedObjectData, ClickCoords } from '@/lib/core/types';
import { LONG_PRESS_DURATION, TOUCH_MOVE_THRESHOLD } from '@/lib/core/constants/stellarium-canvas';
import { formatRaString, formatDecString, buildClickCoords } from '@/lib/astronomy/coordinates/format-coords';
import { useStellariumStore } from '@/lib/stores';
import { createLogger } from '@/lib/logger';

type AladinInstance = ReturnType<typeof A.aladin>;

const logger = createLogger('aladin-events');

interface UseAladinEventsOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  aladinRef: RefObject<AladinInstance | null>;
  engineReady: boolean;
  onSelectionChange?: (selection: SelectedObjectData | null) => void;
  onContextMenu?: (e: React.MouseEvent, coords: ClickCoords | null) => void;
  onHoverChange?: (object: unknown | null) => void;
}

export function useAladinEvents({
  containerRef,
  aladinRef,
  engineReady,
  onSelectionChange,
  onContextMenu,
  onHoverChange,
}: UseAladinEventsOptions): void {
  // Guard: Aladin has no off() method, so we track the instance we registered on
  // to prevent duplicate handler registration across re-renders.
  const registeredAladinRef = useRef<AladinInstance | null>(null);

  // Touch long-press handling for context menu
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Store latest callbacks in refs so the one-time-registered handler always
  // calls the current version without needing to re-register.
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onHoverChangeRef = useRef(onHoverChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
    onHoverChangeRef.current = onHoverChange;
  });

  // Flag to suppress the generic `click` deselect when `objectClicked` just
  // fired in the same event cycle.  Aladin fires both events for object clicks,
  // so without this guard the `click` handler would immediately deselect the
  // object that `objectClicked` just selected.
  const objectClickedRef = useRef(false);

  // Register Aladin event handlers exactly once per engine instance.
  // Aladin Lite v3 has no off() / removeEventListener, so we must not
  // re-register when React deps like onSelectionChange change.
  useEffect(() => {
    const aladin = aladinRef.current;
    if (!aladin || !engineReady) return;

    // Skip if we already registered on this exact instance
    if (registeredAladinRef.current === aladin) return;
    registeredAladinRef.current = aladin;

    // Object click → selection change
    aladin.on('objectClicked', (object: unknown) => {
      const cb = onSelectionChangeRef.current;
      if (!cb) return;

      // Set flag so the subsequent `click` event doesn't deselect
      objectClickedRef.current = true;
      // Clear the flag asynchronously — by the next microtask the `click`
      // handler (which fires synchronously in the same cycle) will have run.
      queueMicrotask(() => { objectClickedRef.current = false; });

      if (!object || typeof object !== 'object') {
        cb(null);
        return;
      }

      try {
        const obj = object as Record<string, unknown>;
        const data = (obj.data ?? {}) as Record<string, unknown>;
        const ra = typeof obj.ra === 'number' ? obj.ra : 0;
        const dec = typeof obj.dec === 'number' ? obj.dec : 0;
        const name = typeof data.name === 'string' ? data.name : 'Unknown';

        const selection: SelectedObjectData = {
          names: [name],
          ra: formatRaString(ra),
          dec: formatDecString(dec),
          raDeg: ra,
          decDeg: dec,
          type: typeof data.type === 'string' ? data.type : undefined,
          magnitude: typeof data.mag === 'number' ? data.mag : undefined,
        };

        cb(selection);
      } catch (error) {
        logger.warn('Failed to parse clicked object', error);
        cb(null);
      }
    });

    // Click on empty space → deselect (only when no object was clicked)
    aladin.on('click', (event: unknown) => {
      // Skip if objectClicked just fired — that handler already set the selection
      if (objectClickedRef.current) return;

      const cb = onSelectionChangeRef.current;
      if (!cb) return;
      if (!event || typeof event !== 'object') return;
      const e = event as Record<string, unknown>;
      if (!e.data) {
        cb(null);
      }
    });

    // Position changed → update store view direction in real-time (replaces polling)
    const D2R = Math.PI / 180;
    aladin.on('positionChanged', (position: unknown) => {
      if (!position || typeof position !== 'object') return;
      const pos = position as Record<string, unknown>;
      const ra = typeof pos.ra === 'number' ? pos.ra : 0;
      const dec = typeof pos.dec === 'number' ? pos.dec : 0;
      useStellariumStore.setState({
        viewDirection: { ra: ra * D2R, dec: dec * D2R, alt: 0, az: 0 },
      });
    });

    // Object hover → lightweight tooltip feedback
    aladin.on('objectHovered', (object: unknown) => {
      if (!object || typeof object !== 'object') return;
      const obj = object as Record<string, unknown>;
      const data = (obj.data ?? {}) as Record<string, unknown>;
      const name = typeof data.name === 'string' ? data.name : '';
      if (name) {
        logger.debug(`Hovered: ${name}`);
      }
      onHoverChangeRef.current?.(object);
    });

    aladin.on('objectHoveredStop', () => {
      onHoverChangeRef.current?.(null);
    });

    return () => {
      // On unmount, clear the tracked instance so a new mount can re-register
      registeredAladinRef.current = null;
    };
  }, [aladinRef, engineReady]);

  // Right-click context menu (mouse)
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const aladin = aladinRef.current;
      if (!aladin || !onContextMenu) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const worldCoords = aladin.pix2world(x, y);
      if (!worldCoords) {
        onContextMenu(e as unknown as React.MouseEvent, null);
        return;
      }

      const [ra, dec] = worldCoords;
      onContextMenu(e as unknown as React.MouseEvent, buildClickCoords(ra, dec));
    },
    [aladinRef, containerRef, onContextMenu]
  );

  // Touch long-press for context menu (mobile)
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      touchTimerRef.current = setTimeout(() => {
        const aladin = aladinRef.current;
        if (!aladin || !onContextMenu) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const worldCoords = aladin.pix2world(x, y);
        if (!worldCoords) return;

        const [ra, dec] = worldCoords;
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          preventDefault: () => {},
        } as unknown as React.MouseEvent;

        onContextMenu(syntheticEvent, buildClickCoords(ra, dec));
      }, LONG_PRESS_DURATION);
    },
    [aladinRef, containerRef, onContextMenu]
  );

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > TOUCH_MOVE_THRESHOLD) {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, []);

  // Register DOM event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !engineReady) return;

    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, [containerRef, engineReady, handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
