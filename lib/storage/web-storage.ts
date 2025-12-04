/**
 * Web Storage Adapter
 * Uses localStorage for persistent storage in web browsers
 */

import type {
  StorageAdapter,
  ImportResult,
  StorageStats,
  ExportData,
} from './types';

/**
 * Web storage adapter using localStorage
 */
export class WebStorageAdapter implements StorageAdapter {
  isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async saveStore(storeName: string, data: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }
    // Zustand persist middleware uses the store name directly
    localStorage.setItem(storeName, data);
  }

  async loadStore(storeName: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }
    return localStorage.getItem(storeName);
  }

  async deleteStore(storeName: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    const existed = localStorage.getItem(storeName) !== null;
    localStorage.removeItem(storeName);
    return existed;
  }

  async listStores(): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }
    const stores: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('starmap-') || key.startsWith('skymap-'))) {
        stores.push(key);
      }
    }
    return stores;
  }

  async exportAllData(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const stores: Record<string, unknown> = {};
    const storeNames = await this.listStores();

    for (const name of storeNames) {
      const data = localStorage.getItem(name);
      if (data) {
        try {
          stores[name] = JSON.parse(data);
        } catch {
          // Store raw string if not valid JSON
          stores[name] = data;
        }
      }
    }

    const exportData: ExportData = {
      metadata: {
        version: '1.0',
        exported_at: new Date().toISOString(),
        app_version: '0.1.0',
        store_count: Object.keys(stores).length,
      },
      stores,
    };

    // Trigger file download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skymap-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importAllData(jsonData?: string): Promise<ImportResult> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    if (!jsonData) {
      throw new Error('No data provided for import');
    }

    const exportData: ExportData = JSON.parse(jsonData);
    let imported_count = 0;
    let skipped_count = 0;
    const errors: string[] = [];

    for (const [name, value] of Object.entries(exportData.stores)) {
      try {
        const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(name, jsonString);
        imported_count++;
      } catch (e) {
        errors.push(`${name}: ${(e as Error).message}`);
        skipped_count++;
      }
    }

    return {
      imported_count,
      skipped_count,
      errors,
      metadata: exportData.metadata,
    };
  }

  async getStorageStats(): Promise<StorageStats> {
    if (!this.isAvailable()) {
      return {
        total_size: 0,
        store_count: 0,
        stores: [],
        directory: 'localStorage',
      };
    }

    const storeNames = await this.listStores();
    let total_size = 0;
    const stores = storeNames.map((name) => {
      const data = localStorage.getItem(name) || '';
      const size = new Blob([data]).size;
      total_size += size;
      return {
        name,
        size,
        modified: undefined,
      };
    });

    return {
      total_size,
      store_count: stores.length,
      stores,
      directory: 'localStorage',
    };
  }

  async getDataDirectory(): Promise<string> {
    return 'localStorage';
  }

  async clearAllData(): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    const storeNames = await this.listStores();
    for (const name of storeNames) {
      localStorage.removeItem(name);
    }
    return storeNames.length;
  }
}

/**
 * Helper to read a file and return its content as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Singleton instance
 */
export const webStorageAdapter = new WebStorageAdapter();
