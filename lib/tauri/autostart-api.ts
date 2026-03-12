/**
 * Autostart API (desktop only)
 *
 * Safe wrapper around @tauri-apps/plugin-autostart with no-op fallback
 * outside Tauri desktop runtime.
 */

import { createLogger } from '@/lib/logger';
import { isTauri } from '@/lib/storage/platform';

const logger = createLogger('autostart-api');

type AutostartPlugin = typeof import('@tauri-apps/plugin-autostart');

export let autostartPluginLoader = async (): Promise<AutostartPlugin | null> => {
  if (!isTauri()) {
    return null;
  }

  return await import('@tauri-apps/plugin-autostart');
};

async function getAutostartPlugin(): Promise<AutostartPlugin | null> {
  return await autostartPluginLoader();
}

export const autostartApi = {
  isAvailable(): boolean {
    return isTauri();
  },

  async isEnabled(): Promise<boolean> {
    const plugin = await getAutostartPlugin();
    if (!plugin) {
      logger.debug('Skipping autostart status query outside Tauri');
      return false;
    }

    return await plugin.isEnabled();
  },

  async enable(): Promise<boolean> {
    const plugin = await getAutostartPlugin();
    if (!plugin) {
      logger.debug('Skipping autostart enable outside Tauri');
      return false;
    }

    await plugin.enable();
    return true;
  },

  async disable(): Promise<boolean> {
    const plugin = await getAutostartPlugin();
    if (!plugin) {
      logger.debug('Skipping autostart disable outside Tauri');
      return false;
    }

    await plugin.disable();
    return true;
  },
};

export function setAutostartPluginLoader(loader: typeof autostartPluginLoader) {
  autostartPluginLoader = loader;
}

export default autostartApi;
