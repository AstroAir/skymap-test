'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useKeyboardShortcuts, STARMAP_SHORTCUT_KEYS, useTimeControls, type KeyboardShortcut } from '@/lib/hooks';
import { useStellariumStore, useSettingsStore, useEquipmentStore } from '@/lib/stores';
import type { KeyboardShortcutsManagerProps } from '@/types/starmap/controls';

export function KeyboardShortcutsManager({
  onToggleSearch,
  onToggleSessionPanel,
  onZoomIn,
  onZoomOut,
  onResetView,
  onClosePanel,
  enabled = true,
}: KeyboardShortcutsManagerProps) {
  const t = useTranslations('shortcuts');
  const stel = useStellariumStore((state) => state.stel);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const fovEnabled = useEquipmentStore((state) => state.fovDisplay.enabled);
  const setFovEnabled = useEquipmentStore((state) => state.setFOVEnabled);

  // Time control handlers (extracted to reusable hook)
  const { handlePauseTime, handleSpeedUp, handleSlowDown, handleResetTime } = useTimeControls(stel);

  // Build shortcuts list
  const shortcuts = useMemo<KeyboardShortcut[]>(() => {
    const list: KeyboardShortcut[] = [];

    // Navigation shortcuts
    if (onZoomIn) {
      list.push({
        key: STARMAP_SHORTCUT_KEYS.ZOOM_IN,
        description: t('zoomIn'),
        action: onZoomIn,
      });
      list.push({
        key: '=', // Also allow = without shift
        description: t('zoomIn'),
        action: onZoomIn,
      });
    }

    if (onZoomOut) {
      list.push({
        key: STARMAP_SHORTCUT_KEYS.ZOOM_OUT,
        description: t('zoomOut'),
        action: onZoomOut,
      });
    }

    if (onResetView) {
      list.push({
        key: STARMAP_SHORTCUT_KEYS.RESET_VIEW,
        description: t('resetView'),
        action: onResetView,
      });
    }

    // Panel shortcuts
    if (onToggleSearch) {
      list.push({
        key: STARMAP_SHORTCUT_KEYS.TOGGLE_SEARCH,
        ctrl: true,
        description: t('toggleSearch'),
        action: onToggleSearch,
      });
      list.push({
        key: '/',
        description: t('toggleSearch'),
        action: onToggleSearch,
      });
    }

    if (onToggleSessionPanel) {
      list.push({
        key: STARMAP_SHORTCUT_KEYS.TOGGLE_SESSION_PANEL,
        description: t('toggleSessionPanel'),
        action: onToggleSessionPanel,
      });
    }

    // FOV overlay
    list.push({
      key: STARMAP_SHORTCUT_KEYS.TOGGLE_FOV,
      description: t('toggleFovOverlay'),
      action: () => setFovEnabled(!fovEnabled),
    });

    // Display toggles
    list.push({
      key: STARMAP_SHORTCUT_KEYS.TOGGLE_CONSTELLATIONS,
      description: t('toggleConstellations'),
      action: () => toggleStellariumSetting('constellationsLinesVisible'),
    });

    list.push({
      key: STARMAP_SHORTCUT_KEYS.TOGGLE_GRID,
      description: t('toggleGrid'),
      action: () => toggleStellariumSetting('equatorialLinesVisible'),
    });

    list.push({
      key: STARMAP_SHORTCUT_KEYS.TOGGLE_DSO,
      description: t('toggleDso'),
      action: () => toggleStellariumSetting('dsosVisible'),
    });

    list.push({
      key: STARMAP_SHORTCUT_KEYS.TOGGLE_ATMOSPHERE,
      description: t('toggleAtmosphere'),
      action: () => toggleStellariumSetting('atmosphereVisible'),
    });

    // Time controls
    list.push({
      key: STARMAP_SHORTCUT_KEYS.PAUSE_TIME,
      description: t('pauseResumeTime'),
      action: handlePauseTime,
    });

    list.push({
      key: STARMAP_SHORTCUT_KEYS.SPEED_UP,
      description: t('speedUpTime'),
      action: handleSpeedUp,
    });

    list.push({
      key: STARMAP_SHORTCUT_KEYS.SLOW_DOWN,
      description: t('slowDownTime'),
      action: handleSlowDown,
    });

    list.push({
      key: STARMAP_SHORTCUT_KEYS.RESET_TIME,
      description: t('resetTime'),
      action: handleResetTime,
    });

    // Close panel
    if (onClosePanel) {
      list.push({
        key: STARMAP_SHORTCUT_KEYS.CLOSE_PANEL,
        description: t('closePanel'),
        action: onClosePanel,
        ignoreInputs: false, // Also work when input focused
      });
    }

    return list;
  }, [
    onZoomIn,
    onZoomOut,
    onResetView,
    onToggleSearch,
    onToggleSessionPanel,
    onClosePanel,
    fovEnabled,
    setFovEnabled,
    toggleStellariumSetting,
    handlePauseTime,
    handleSpeedUp,
    handleSlowDown,
    handleResetTime,
    t,
  ]);

  useKeyboardShortcuts({
    shortcuts,
    enabled: enabled && !!stel,
  });

  // This component doesn't render anything
  return null;
}
