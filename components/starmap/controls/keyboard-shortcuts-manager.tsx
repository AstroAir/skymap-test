'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useKeyboardShortcuts, useTimeControls, type KeyboardShortcut } from '@/lib/hooks';
import {
  useStellariumStore,
  useSettingsStore,
  useEquipmentStore,
  useKeybindingStore,
  type KeyBinding,
  type ShortcutActionId,
} from '@/lib/stores';
import type { KeyboardShortcutsManagerProps } from '@/types/starmap/controls';

/**
 * Convert a store KeyBinding into a hook-compatible KeyboardShortcut entry.
 */
function bindingToShortcut(
  binding: KeyBinding,
  description: string,
  action: () => void,
  opts?: Partial<KeyboardShortcut>,
): KeyboardShortcut {
  return {
    key: binding.key,
    ctrl: binding.ctrl,
    shift: binding.shift,
    alt: binding.alt,
    meta: binding.meta,
    description,
    action,
    ...opts,
  };
}

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
  const skyEngine = useSettingsStore((state) => state.skyEngine);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);
  const fovEnabled = useEquipmentStore((state) => state.fovDisplay.enabled);
  const setFovEnabled = useEquipmentStore((state) => state.setFOVEnabled);
  const getBinding = useKeybindingStore((state) => state.getBinding);
  const customBindings = useKeybindingStore((state) => state.customBindings);

  const isStellarium = skyEngine === 'stellarium';

  // Time control handlers (extracted to reusable hook)
  const { handlePauseTime, handleSpeedUp, handleSlowDown, handleResetTime } = useTimeControls(stel);

  /** Helper: get effective binding for an action */
  const kb = (id: ShortcutActionId) => getBinding(id);

  // Build shortcuts list — reactive to customBindings changes
  const shortcuts = useMemo<KeyboardShortcut[]>(() => {
    const list: KeyboardShortcut[] = [];

    // Navigation shortcuts
    if (onZoomIn) {
      list.push(bindingToShortcut(kb('ZOOM_IN'), t('zoomIn'), onZoomIn));
      // Also allow = without shift as a convenience alias for +
      const zoomBinding = kb('ZOOM_IN');
      if (zoomBinding.key === '+') {
        list.push({ key: '=', description: t('zoomIn'), action: onZoomIn });
      }
    }

    if (onZoomOut) {
      list.push(bindingToShortcut(kb('ZOOM_OUT'), t('zoomOut'), onZoomOut));
    }

    if (onResetView) {
      list.push(bindingToShortcut(kb('RESET_VIEW'), t('resetView'), onResetView));
    }

    // Panel shortcuts
    if (onToggleSearch) {
      list.push(bindingToShortcut(kb('TOGGLE_SEARCH'), t('toggleSearch'), onToggleSearch));
      list.push({ key: '/', description: t('toggleSearch'), action: onToggleSearch });
    }

    if (onToggleSessionPanel) {
      list.push(bindingToShortcut(kb('TOGGLE_SESSION_PANEL'), t('toggleSessionPanel'), onToggleSessionPanel));
    }

    // FOV overlay
    list.push(bindingToShortcut(kb('TOGGLE_FOV'), t('toggleFovOverlay'), () => setFovEnabled(!fovEnabled)));

    // Display toggles — Stellarium-only (no equivalent in Aladin Lite)
    if (isStellarium) {
      list.push(bindingToShortcut(kb('TOGGLE_CONSTELLATIONS'), t('toggleConstellations'), () => toggleStellariumSetting('constellationsLinesVisible')));
      list.push(bindingToShortcut(kb('TOGGLE_GRID'), t('toggleGrid'), () => toggleStellariumSetting('equatorialLinesVisible')));
      list.push(bindingToShortcut(kb('TOGGLE_DSO'), t('toggleDso'), () => toggleStellariumSetting('dsosVisible')));
      list.push(bindingToShortcut(kb('TOGGLE_ATMOSPHERE'), t('toggleAtmosphere'), () => toggleStellariumSetting('atmosphereVisible')));
    }

    // Time controls — Stellarium-only (Aladin Lite is not time-aware)
    if (isStellarium) {
      list.push(bindingToShortcut(kb('PAUSE_TIME'), t('pauseResumeTime'), handlePauseTime));
      list.push(bindingToShortcut(kb('SPEED_UP'), t('speedUpTime'), handleSpeedUp));
      list.push(bindingToShortcut(kb('SLOW_DOWN'), t('slowDownTime'), handleSlowDown));
      list.push(bindingToShortcut(kb('RESET_TIME'), t('resetTime'), handleResetTime));
    }

    // Close panel
    if (onClosePanel) {
      list.push(bindingToShortcut(kb('CLOSE_PANEL'), t('closePanel'), onClosePanel, { ignoreInputs: false }));
    }

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- customBindings triggers rebuild when user changes bindings
  }, [
    onZoomIn,
    onZoomOut,
    onResetView,
    onToggleSearch,
    onToggleSessionPanel,
    onClosePanel,
    fovEnabled,
    setFovEnabled,
    isStellarium,
    toggleStellariumSetting,
    handlePauseTime,
    handleSpeedUp,
    handleSlowDown,
    handleResetTime,
    customBindings,
    getBinding,
    t,
  ]);

  useKeyboardShortcuts({
    shortcuts,
    enabled: enabled && (!!stel || skyEngine === 'aladin'),
  });

  // This component doesn't render anything
  return null;
}
