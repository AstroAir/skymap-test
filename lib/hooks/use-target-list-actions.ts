'use client';

import { useCallback } from 'react';
import { useTargetListStore } from '@/lib/stores/target-list-store';
import { degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import type { SearchResultItem } from '@/lib/core/types';

/**
 * Shared hook for target list actions (add single / batch add).
 * Used by StellariumSearch and AdvancedSearchDialog to avoid duplicated logic.
 */
export function useTargetListActions(options?: {
  getSelectedItems?: () => SearchResultItem[];
  clearSelection?: () => void;
  onBatchAdd?: (items: SearchResultItem[]) => void;
}) {
  const addTargetsBatch = useTargetListStore((state) => state.addTargetsBatch);

  const handleAddToTargetList = useCallback((item: SearchResultItem) => {
    if (item.RA !== undefined && item.Dec !== undefined) {
      addTargetsBatch([{
        name: item.Name,
        ra: item.RA,
        dec: item.Dec,
        raString: degreesToHMS(item.RA),
        decString: degreesToDMS(item.Dec),
      }]);
    }
  }, [addTargetsBatch]);

  const handleBatchAdd = useCallback(() => {
    const selected = options?.getSelectedItems?.() ?? [];
    if (selected.length === 0) return;

    const batchItems = selected
      .filter(item => item.RA !== undefined && item.Dec !== undefined)
      .map(item => ({
        name: item.Name,
        ra: item.RA!,
        dec: item.Dec!,
        raString: degreesToHMS(item.RA!),
        decString: degreesToDMS(item.Dec!),
      }));

    if (batchItems.length > 0) {
      addTargetsBatch(batchItems);
      options?.clearSelection?.();
      options?.onBatchAdd?.(selected);
    }
  }, [addTargetsBatch, options]);

  return { handleAddToTargetList, handleBatchAdd };
}
