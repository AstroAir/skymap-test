'use client';

import { useEffect, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import { useAutostartStore, useSettingsStore } from '@/lib/stores';
import { autostartApi } from '@/lib/tauri/autostart-api';

const logger = createLogger('autostart-provider');

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown autostart error';
}

export function AutostartProvider() {
  const launchOnStartup = useSettingsStore((state) => state.preferences.launchOnStartup);
  const setPreference = useSettingsStore((state) => state.setPreference);
  const lastConfirmedRef = useRef(false);
  const initialSyncCompletedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const statusStore = useAutostartStore.getState();
    const supported = autostartApi.isAvailable();
    statusStore.setSupported(supported);
    statusStore.setLoading(supported);

    if (!supported) {
      statusStore.setActualEnabled(null);
      statusStore.setLoading(false);
      return () => {
        active = false;
      };
    }

    const sync = async () => {
      try {
        const actualEnabled = await autostartApi.isEnabled();
        if (!active) return;

        lastConfirmedRef.current = actualEnabled;
        useAutostartStore.getState().setActualEnabled(actualEnabled);

        if (!initialSyncCompletedRef.current) {
          initialSyncCompletedRef.current = true;

          if (actualEnabled && !launchOnStartup) {
            useAutostartStore.getState().setError(null);
            setPreference('launchOnStartup', true);
            return;
          }
        }

        if (actualEnabled === launchOnStartup) {
          useAutostartStore.getState().setLoading(false);
          return;
        }

        if (launchOnStartup) {
          await autostartApi.enable();
        } else {
          await autostartApi.disable();
        }

        if (!active) return;

        lastConfirmedRef.current = launchOnStartup;
        useAutostartStore.getState().setActualEnabled(launchOnStartup);
        useAutostartStore.getState().setError(null);
      } catch (error) {
        if (!active) return;

        const message = toErrorMessage(error);
        logger.error('Failed to synchronize autostart state', error);
        useAutostartStore.getState().setError(message);
        useAutostartStore.getState().setActualEnabled(lastConfirmedRef.current);

        if (launchOnStartup !== lastConfirmedRef.current) {
          setPreference('launchOnStartup', lastConfirmedRef.current);
        }
      } finally {
        if (active) {
          useAutostartStore.getState().setLoading(false);
        }
      }
    };

    void sync();

    return () => {
      active = false;
    };
  }, [launchOnStartup, setPreference]);

  return null;
}

export default AutostartProvider;
