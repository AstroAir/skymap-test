/**
 * React hooks for Tauri API
 * Provides easy access to Rust backend functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { isTauri } from '@/lib/storage/platform';
import { tauriApi } from './api';
import type {
  EquipmentData,
  LocationsData,
  ObservationLocation,
  ObservationLogData,
  ObservationStats,
  AppSettings,
  SystemInfo,
} from './types';

// ============================================================================
// Equipment Hook
// ============================================================================

export function useEquipment() {
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await tauriApi.equipment.load();
      setEquipment(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  return {
    equipment,
    loading,
    error,
    refresh,
    isAvailable: isTauri(),
  };
}

// ============================================================================
// Locations Hook
// ============================================================================

export function useLocations() {
  const [locations, setLocations] = useState<LocationsData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<ObservationLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [data, current] = await Promise.all([
        tauriApi.locations.load(),
        tauriApi.locations.getCurrent(),
      ]);
      setLocations(data);
      setCurrentLocation(current);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setCurrent = useCallback(async (locationId: string) => {
    if (!isTauri()) return;
    
    try {
      const data = await tauriApi.locations.setCurrent(locationId);
      setLocations(data);
      const loc = data.locations.find(l => l.id === locationId);
      setCurrentLocation(loc || null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  return {
    locations,
    currentLocation,
    loading,
    error,
    refresh: load,
    setCurrent,
    isAvailable: isTauri(),
  };
}

// ============================================================================
// Observation Log Hook
// ============================================================================

export function useObservationLog() {
  const [log, setLog] = useState<ObservationLogData | null>(null);
  const [stats, setStats] = useState<ObservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [logData, statsData] = await Promise.all([
        tauriApi.observationLog.load(),
        tauriApi.observationLog.getStats(),
      ]);
      setLog(logData);
      setStats(statsData);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    log,
    stats,
    loading,
    error,
    refresh: load,
    isAvailable: isTauri(),
  };
}

// ============================================================================
// App Settings Hook
// ============================================================================

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [settingsData, infoData] = await Promise.all([
        tauriApi.appSettings.load(),
        tauriApi.appSettings.getSystemInfo(),
      ]);
      setSettings(settingsData);
      setSystemInfo(infoData);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!isTauri() || !settings) return;
    
    try {
      const newSettings = { ...settings, ...updates };
      await tauriApi.appSettings.save(newSettings);
      setSettings(newSettings);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [settings]);

  return {
    settings,
    systemInfo,
    loading,
    error,
    refresh: load,
    updateSettings,
    isAvailable: isTauri(),
  };
}

// ============================================================================
// Window State Hook
// ============================================================================

export function useWindowState() {
  const [saving, setSaving] = useState(false);

  const saveWindowState = useCallback(async () => {
    if (!isTauri()) return;
    
    try {
      setSaving(true);
      await tauriApi.appSettings.saveWindowState();
    } catch (e) {
      console.error('Failed to save window state:', e);
    } finally {
      setSaving(false);
    }
  }, []);

  const restoreWindowState = useCallback(async () => {
    if (!isTauri()) return;
    
    try {
      await tauriApi.appSettings.restoreWindowState();
    } catch (e) {
      console.error('Failed to restore window state:', e);
    }
  }, []);

  // Auto-save on window close
  useEffect(() => {
    if (!isTauri()) return;

    const handleBeforeUnload = () => {
      // Can't await in beforeunload, but we try anyway
      tauriApi.appSettings.saveWindowState().catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Restore on mount
  useEffect(() => {
    restoreWindowState();
  }, [restoreWindowState]);

  return {
    saveWindowState,
    restoreWindowState,
    saving,
    isAvailable: isTauri(),
  };
}
