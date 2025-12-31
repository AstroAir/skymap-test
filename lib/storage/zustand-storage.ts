/**
 * Custom Zustand storage adapter
 * Provides a unified storage interface for Zustand's persist middleware
 * that works in both Web (localStorage) and Tauri (file system) environments
 */

import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { isTauri, isServer } from './platform';

// Memory cache for Tauri storage
const tauriCache = new Map<string, StorageValue<unknown>>();
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
const SAVE_DELAY = 100;

// Track initialization status
let tauriInitialized = false;
let tauriInitializing = false;

/**
 * Initialize Tauri storage cache
 */
async function initializeTauriCache(): Promise<void> {
  if (tauriInitialized || tauriInitializing || !isTauri()) return;
  
  tauriInitializing = true;
  
  const knownStores = [
    'starmap-target-list',
    'starmap-markers',
    'starmap-settings',
    'starmap-equipment',
    'starmap-onboarding',
    'skymap-offline',
    'skymap-locale',
  ];
  
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    for (const name of knownStores) {
      try {
        const data = await invoke<string | null>('load_store_data', { storeName: name });
        if (data !== null) {
          try {
            tauriCache.set(name, JSON.parse(data));
          } catch {
            // Invalid JSON, skip
          }
        }
      } catch {
        // Ignore individual store errors
      }
    }
  } catch (error) {
    console.error('Failed to initialize Tauri storage cache:', error);
  } finally {
    tauriInitialized = true;
    tauriInitializing = false;
  }
}

/**
 * Save data to Tauri backend (debounced)
 */
function saveToTauri(name: string, value: StorageValue<unknown>): void {
  // Update cache immediately
  tauriCache.set(name, value);
  
  // Clear pending save
  const pending = pendingSaves.get(name);
  if (pending) {
    clearTimeout(pending);
  }
  
  // Schedule debounced save
  const timeout = setTimeout(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_store_data', { 
        storeName: name, 
        data: JSON.stringify(value) 
      });
      pendingSaves.delete(name);
    } catch (error) {
      console.error(`Failed to save ${name} to Tauri:`, error);
    }
  }, SAVE_DELAY);
  
  pendingSaves.set(name, timeout);
}

/**
 * Delete from Tauri backend
 */
async function deleteFromTauri(name: string): Promise<void> {
  tauriCache.delete(name);
  
  // Clear pending save
  const pending = pendingSaves.get(name);
  if (pending) {
    clearTimeout(pending);
    pendingSaves.delete(name);
  }
  
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_store_data', { storeName: name });
  } catch (error) {
    console.error(`Failed to delete ${name} from Tauri:`, error);
  }
}

/**
 * Create a storage adapter for Zustand persist middleware
 * Automatically uses the appropriate backend based on platform
 */
export function createZustandStorage<T>(): PersistStorage<T> {
  // Server-side: return no-op storage
  if (isServer()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Tauri: use file-based storage via invoke
  if (isTauri()) {
    // Start initialization
    initializeTauriCache();
    
    return {
      getItem: (name: string): StorageValue<T> | null => {
        // Return from cache if available
        if (tauriCache.has(name)) {
          return tauriCache.get(name) as StorageValue<T>;
        }
        
        // Try to migrate from localStorage
        try {
          const localData = localStorage.getItem(name);
          if (localData) {
            const parsed = JSON.parse(localData) as StorageValue<T>;
            tauriCache.set(name, parsed);
            saveToTauri(name, parsed);
            localStorage.removeItem(name);
            return parsed;
          }
        } catch {
          // Ignore localStorage errors
        }
        
        return null;
      },
      
      setItem: (name: string, value: StorageValue<T>): void => {
        saveToTauri(name, value);
      },
      
      removeItem: (name: string): void => {
        deleteFromTauri(name);
      },
    };
  }

  // Web: use localStorage with JSON serialization
  return {
    getItem: (name: string): StorageValue<T> | null => {
      try {
        const data = localStorage.getItem(name);
        if (data) {
          return JSON.parse(data) as StorageValue<T>;
        }
      } catch {
        // Invalid JSON
      }
      return null;
    },
    
    setItem: (name: string, value: StorageValue<T>): void => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error('Failed to remove from localStorage:', error);
      }
    },
  };
}

/**
 * Singleton storage instance cache
 */
const storageInstances = new Map<string, PersistStorage<unknown>>();

/**
 * Get the Zustand storage adapter (cached per type)
 */
export function getZustandStorage<T = unknown>(): PersistStorage<T> {
  const key = isTauri() ? 'tauri' : 'web';
  
  if (!storageInstances.has(key)) {
    storageInstances.set(key, createZustandStorage<unknown>());
  }
  
  return storageInstances.get(key) as PersistStorage<T>;
}
