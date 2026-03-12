/**
 * Window position API wrapper for Tauri desktop.
 * Provides typed access to plugin-positioner with safe fallbacks.
 */

import type { TrayIconEvent } from '@tauri-apps/api/tray';
import { isTauri } from '@/lib/storage/platform';
import { createLogger } from '@/lib/logger';
import { centerWindow, isTrayPositioningReady } from './app-control-api';

const logger = createLogger('positioner-api');

export const SCREEN_POSITION_PRESETS = [
  'TopLeft',
  'TopRight',
  'BottomLeft',
  'BottomRight',
  'TopCenter',
  'BottomCenter',
  'LeftCenter',
  'RightCenter',
  'Center',
] as const;

export const TRAY_POSITION_PRESETS = [
  'TrayLeft',
  'TrayBottomLeft',
  'TrayRight',
  'TrayBottomRight',
  'TrayCenter',
  'TrayBottomCenter',
] as const;

export const WINDOW_POSITION_PRESETS = [
  ...SCREEN_POSITION_PRESETS,
  ...TRAY_POSITION_PRESETS,
] as const;

export type WindowPositionPreset = (typeof WINDOW_POSITION_PRESETS)[number];

const TRAY_PRESET_SET = new Set<WindowPositionPreset>(TRAY_POSITION_PRESETS);

export interface MoveWindowOptions {
  constrained?: boolean;
  trayEvent?: TrayIconEvent;
}

export interface MoveWindowResult {
  moved: boolean;
  usedFallback: boolean;
  reason?: 'not-tauri' | 'tray-not-ready' | 'tray-state-sync-failed' | 'tray-fallback' | 'move-failed';
}

type PositionerPluginModule = typeof import('@tauri-apps/plugin-positioner');
type PluginPosition = import('@tauri-apps/plugin-positioner').Position;

async function getPositionerPlugin(): Promise<PositionerPluginModule> {
  return import('@tauri-apps/plugin-positioner');
}

function toPluginPosition(
  plugin: PositionerPluginModule,
  preset: WindowPositionPreset
): PluginPosition {
  return plugin.Position[preset] as unknown as PluginPosition;
}

export function isTrayPositionPreset(preset: WindowPositionPreset): boolean {
  return TRAY_PRESET_SET.has(preset);
}

export const TRAY_REVEAL_PRESET: WindowPositionPreset = 'TrayCenter';

export const positionerApi = {
  isAvailable(): boolean {
    return isTauri();
  },

  isTrayPositionPreset(preset: WindowPositionPreset): boolean {
    return isTrayPositionPreset(preset);
  },

  getPresets(): readonly WindowPositionPreset[] {
    return WINDOW_POSITION_PRESETS;
  },

  getScreenPresets(): readonly WindowPositionPreset[] {
    return SCREEN_POSITION_PRESETS;
  },

  getTrayPresets(): readonly WindowPositionPreset[] {
    return TRAY_POSITION_PRESETS;
  },

  async isPresetAvailable(preset: WindowPositionPreset): Promise<boolean> {
    if (!isTauri()) {
      return false;
    }

    if (!isTrayPositionPreset(preset)) {
      return true;
    }

    return isTrayPositioningReady();
  },

  async syncTrayIconState(event: TrayIconEvent): Promise<boolean> {
    if (!isTauri()) {
      logger.warn('syncTrayIconState is only available in Tauri environment');
      return false;
    }

    try {
      const plugin = await getPositionerPlugin();
      await plugin.handleIconState(event);
      return true;
    } catch (error) {
      logger.warn('Failed to sync tray icon state for positioner', error);
      return false;
    }
  },

  async moveToPreset(
    preset: WindowPositionPreset,
    options: MoveWindowOptions = {}
  ): Promise<MoveWindowResult> {
    if (!isTauri()) {
      logger.warn('moveToPreset is only available in Tauri environment');
      return { moved: false, usedFallback: false, reason: 'not-tauri' };
    }

    const trayPreset = isTrayPositionPreset(preset);
    const constrained = options.constrained ?? trayPreset;

    if (trayPreset && !(await isTrayPositioningReady())) {
      logger.warn(`Tray-relative preset ${preset} is unavailable before tray positioning is ready`);
      return { moved: false, usedFallback: false, reason: 'tray-not-ready' };
    }

    const plugin = await getPositionerPlugin();
    const pluginPosition = toPluginPosition(plugin, preset);

    if (options.trayEvent) {
      try {
        await plugin.handleIconState(options.trayEvent);
      } catch (error) {
        logger.warn('Failed to apply tray event state, continuing with move', error);
      }
    }

    try {
      if (constrained) {
        await plugin.moveWindowConstrained(pluginPosition);
      } else {
        await plugin.moveWindow(pluginPosition);
      }

      return { moved: true, usedFallback: false };
    } catch (error) {
      if (trayPreset) {
        logger.warn(
          `Tray-relative move failed for ${preset}, falling back to centerWindow`,
          error
        );
        try {
          await centerWindow();
          return { moved: true, usedFallback: true, reason: 'tray-fallback' };
        } catch (fallbackError) {
          logger.error('Fallback centerWindow failed after tray move failure', fallbackError);
          return { moved: false, usedFallback: true, reason: 'move-failed' };
        }
      }

      logger.error(`Failed to move window to preset ${preset}`, error);
      return { moved: false, usedFallback: false, reason: 'move-failed' };
    }
  },
};

export default positionerApi;
