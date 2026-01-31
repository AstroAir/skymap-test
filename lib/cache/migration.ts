/**
 * Cache Version Migration
 * Handles cache schema upgrades and cleanup of obsolete cache data
 */

// ============================================================================
// Types
// ============================================================================

import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-migration');

export interface CacheVersion {
  version: number;
  migrationDate: number;
  description: string;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migratedItems: number;
  deletedItems: number;
  errors: string[];
}

type MigrationFn = () => Promise<{ migrated: number; deleted: number }>;

// ============================================================================
// Constants
// ============================================================================

const CACHE_VERSION_KEY = 'skymap-cache-version';
const CURRENT_VERSION = 1;

// Version history:
// 1 - Initial version with unified cache system

// ============================================================================
// Version Management
// ============================================================================

/**
 * Get current cache version from storage
 */
export function getCacheVersion(): CacheVersion | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Set cache version in storage
 */
export function setCacheVersion(version: number, description: string): void {
  if (typeof localStorage === 'undefined') return;
  
  const versionInfo: CacheVersion = {
    version,
    migrationDate: Date.now(),
    description,
  };
  
  localStorage.setItem(CACHE_VERSION_KEY, JSON.stringify(versionInfo));
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  const current = getCacheVersion();
  return !current || current.version < CURRENT_VERSION;
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migration from version 0 (no version) to version 1
 * Cleans up any legacy cache data
 */
async function migrateV0ToV1(): Promise<{ migrated: number; deleted: number }> {
  let deleted = 0;
  
  // Clean up old cache names if they exist
  if (typeof caches !== 'undefined') {
    const cacheNames = await caches.keys();
    const legacyPrefixes = [
      'skymap-cache-',
      'stellarium-cache-',
      'hips-cache-',
    ];
    
    for (const name of cacheNames) {
      const isLegacy = legacyPrefixes.some(prefix => 
        name.startsWith(prefix) && !name.includes('-v1')
      );
      
      if (isLegacy) {
        await caches.delete(name);
        deleted++;
        logger.debug(`Deleted legacy cache: ${name}`);
      }
    }
  }
  
  // Clean up old localStorage keys
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('skymap-old-') ||
        key.startsWith('cache-meta-')
      )) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      deleted++;
    }
  }
  
  return { migrated: 0, deleted };
}

// Migration registry
const migrations: Map<number, MigrationFn> = new Map([
  [1, migrateV0ToV1],
]);

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Run all necessary migrations
 */
export async function runMigrations(): Promise<MigrationResult> {
  const currentVersion = getCacheVersion();
  const fromVersion = currentVersion?.version ?? 0;
  
  if (fromVersion >= CURRENT_VERSION) {
    return {
      success: true,
      fromVersion,
      toVersion: CURRENT_VERSION,
      migratedItems: 0,
      deletedItems: 0,
      errors: [],
    };
  }
  
  logger.info(`Starting migration from v${fromVersion} to v${CURRENT_VERSION}`);
  
  const errors: string[] = [];
  let totalMigrated = 0;
  let totalDeleted = 0;
  
  // Run each migration in sequence
  for (let version = fromVersion + 1; version <= CURRENT_VERSION; version++) {
    const migrationFn = migrations.get(version);
    
    if (migrationFn) {
      try {
        logger.info(`Running migration to v${version}...`);
        const result = await migrationFn();
        totalMigrated += result.migrated;
        totalDeleted += result.deleted;
        logger.info(`Migration to v${version} complete: ${result.migrated} migrated, ${result.deleted} deleted`);
      } catch (error) {
        const errorMsg = `Migration to v${version} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  }
  
  // Update version even if there were some errors
  setCacheVersion(CURRENT_VERSION, `Migrated from v${fromVersion}`);
  
  return {
    success: errors.length === 0,
    fromVersion,
    toVersion: CURRENT_VERSION,
    migratedItems: totalMigrated,
    deletedItems: totalDeleted,
    errors,
  };
}

/**
 * Force clear all caches and reset version
 * Use with caution - this will delete all cached data
 */
export async function resetAllCaches(): Promise<void> {
  logger.info('Resetting all caches...');
  
  // Clear all Cache API caches
  if (typeof caches !== 'undefined') {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.startsWith('skymap-')) {
        await caches.delete(name);
        logger.debug(`Deleted cache: ${name}`);
      }
    }
  }
  
  // Clear cache-related localStorage
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('skymap-cache') ||
        key.startsWith('skymap-offline')
      )) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }
  
  // Reset version to trigger fresh migration on next load
  localStorage.removeItem(CACHE_VERSION_KEY);
  
  logger.info('All caches reset');
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize cache system with migrations
 * Call this on app startup
 */
export async function initializeCacheSystem(): Promise<MigrationResult> {
  if (!isMigrationNeeded()) {
    const currentVersion = getCacheVersion();
    return {
      success: true,
      fromVersion: currentVersion?.version ?? CURRENT_VERSION,
      toVersion: CURRENT_VERSION,
      migratedItems: 0,
      deletedItems: 0,
      errors: [],
    };
  }
  
  return runMigrations();
}

const cacheMigration = {
  getCacheVersion,
  isMigrationNeeded,
  runMigrations,
  resetAllCaches,
  initializeCacheSystem,
  CURRENT_VERSION,
};

export default cacheMigration;
