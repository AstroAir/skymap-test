'use client';

import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import { isTauri } from '@/lib/storage/platform';
import { mountApi } from '@/lib/tauri/mount-api';
import { globalShortcutApi } from '@/lib/tauri/global-shortcut-api';
import {
  DEFAULT_KEYBINDINGS,
  DEFAULT_GLOBAL_SHORTCUT_BINDINGS,
  findConflictWithLocalKeybindings,
  useKeybindingStore,
  useGlobalShortcutStore,
  type GlobalShortcutActionId,
} from '@/lib/stores';
import { useMountStore, useOnboardingBridgeStore } from '@/lib/stores';

const logger = createLogger('global-shortcut-provider');

async function focusMainWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();

  try {
    if (await window.isMinimized()) {
      await window.unminimize();
    }
  } catch (error) {
    logger.warn('Failed to query/unminimize main window before focus', error);
  }

  try {
    await window.show();
  } catch (error) {
    logger.warn('Failed to show main window', error);
  }

  await window.setFocus();
}

async function dispatchGlobalShortcutAction(actionId: GlobalShortcutActionId): Promise<void> {
  switch (actionId) {
    case 'FOCUS_MAIN_WINDOW':
      await focusMainWindow();
      return;
    case 'TOGGLE_SEARCH':
      useOnboardingBridgeStore.getState().toggleSearch();
      return;
    case 'TOGGLE_SESSION_PANEL':
      useOnboardingBridgeStore.getState().toggleSessionPanel();
      return;
    case 'MOUNT_ABORT_SLEW': {
      const mountConnected = useMountStore.getState().mountInfo.Connected;
      if (!mountConnected) {
        toast.warning('Mount is not connected, abort slew skipped.');
        return;
      }

      try {
        await mountApi.abortSlew();
        toast.success('Slew abort command sent.');
      } catch (error) {
        logger.error('Failed to abort mount slew via global shortcut', error);
        toast.error('Failed to abort mount slew.');
      }
      return;
    }
    default:
      return;
  }
}

export function GlobalShortcutProvider() {
  const enabled = useGlobalShortcutStore((state) => state.enabled);
  const customBindings = useGlobalShortcutStore((state) => state.customBindings);
  const setRegistrationError = useGlobalShortcutStore((state) => state.setRegistrationError);
  const clearRegistrationErrors = useGlobalShortcutStore((state) => state.clearRegistrationErrors);
  const localCustomBindings = useKeybindingStore((state) => state.customBindings);

  const effectiveBindings = useMemo(
    () => ({ ...DEFAULT_GLOBAL_SHORTCUT_BINDINGS, ...customBindings }),
    [customBindings],
  );
  const effectiveLocalBindings = useMemo(
    () => ({ ...DEFAULT_KEYBINDINGS, ...localCustomBindings }),
    [localCustomBindings],
  );

  useEffect(() => {
    if (!globalShortcutApi.isAvailable()) return;

    let active = true;
    const sync = async () => {
      try {
        await globalShortcutApi.unregisterAll();
      } catch (error) {
        logger.warn('Failed to unregister existing global shortcuts before sync', error);
      }

      if (!active) return;
      clearRegistrationErrors();

      if (!enabled) {
        return;
      }

      for (const [actionId, accelerator] of Object.entries(effectiveBindings) as [GlobalShortcutActionId, string][]) {
        const localConflict = findConflictWithLocalKeybindings(accelerator, effectiveLocalBindings);
        if (localConflict) {
          setRegistrationError(
            actionId,
            `Conflict with local shortcut action: ${localConflict}`,
          );
          continue;
        }

        try {
          const registered = await globalShortcutApi.listen(accelerator, (event) => {
            if (event.state !== 'Pressed') return;
            void dispatchGlobalShortcutAction(actionId);
          });

          if (!registered && active) {
            setRegistrationError(actionId, 'Global shortcut API unavailable');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          if (active) {
            setRegistrationError(actionId, message);
          }
        }
      }
    };

    void sync();

    return () => {
      active = false;
    };
  }, [
    clearRegistrationErrors,
    effectiveBindings,
    effectiveLocalBindings,
    enabled,
    setRegistrationError,
  ]);

  useEffect(() => {
    if (!globalShortcutApi.isAvailable()) return;
    return () => {
      void globalShortcutApi.unregisterAll().catch((error) => {
        logger.warn('Failed to unregister global shortcuts during provider unmount', error);
      });
    };
  }, []);

  return null;
}

export default GlobalShortcutProvider;
