'use client';

/**
 * TauriSyncProvider - Initializes Tauri sync for Zustand stores
 * This component should be placed near the root of the app to ensure
 * stores are synced with Tauri backend on mount
 */

import { useEffect } from 'react';
import { isTauri } from '@/lib/storage/platform';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { useMarkerStore } from '@/lib/stores/marker-store';

export function TauriSyncProvider({ children }: { children: React.ReactNode }) {
  const syncTargetList = useTargetListStore((state) => state.syncWithTauri);
  const syncMarkers = useMarkerStore((state) => state.syncWithTauri);

  useEffect(() => {
    if (isTauri()) {
      // Sync stores with Tauri backend on mount
      syncTargetList();
      syncMarkers();
    }
  }, [syncTargetList, syncMarkers]);

  return <>{children}</>;
}

export default TauriSyncProvider;
