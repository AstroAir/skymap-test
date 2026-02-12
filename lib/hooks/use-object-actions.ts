/**
 * Shared hook for celestial object actions (slew, add to list)
 * Extracts duplicated logic from InfoPanel and ObjectDetailDrawer
 */

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useMountStore, useTargetListStore } from '@/lib/stores';
import type { SelectedObjectData } from '@/lib/core/types';
import type { FramingCoordinatesData } from '@/types/starmap/objects';

export interface UseObjectActionsOptions {
  selectedObject: SelectedObjectData | null;
  onSetFramingCoordinates?: (data: FramingCoordinatesData) => void;
  /** Called after slew action completes (e.g., close drawer) */
  onAfterSlew?: () => void;
}

export interface UseObjectActionsReturn {
  handleSlew: () => void;
  handleAddToList: () => void;
  mountConnected: boolean;
}

/**
 * Provides shared slew and add-to-list callbacks for celestial object panels.
 */
export function useObjectActions({
  selectedObject,
  onSetFramingCoordinates,
  onAfterSlew,
}: UseObjectActionsOptions): UseObjectActionsReturn {
  const t = useTranslations();
  const mountConnected = useMountStore((state) => state.mountInfo.Connected);
  const addTarget = useTargetListStore((state) => state.addTarget);

  const handleSlew = useCallback(() => {
    if (!selectedObject) return;
    onSetFramingCoordinates?.({
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      name: selectedObject.names[0] || '',
    });
    onAfterSlew?.();
  }, [selectedObject, onSetFramingCoordinates, onAfterSlew]);

  const handleAddToList = useCallback(() => {
    if (!selectedObject) return;
    addTarget({
      name: selectedObject.names[0] || t('common.unknown'),
      ra: selectedObject.raDeg,
      dec: selectedObject.decDeg,
      raString: selectedObject.ra,
      decString: selectedObject.dec,
      priority: 'medium',
    });
  }, [selectedObject, addTarget, t]);

  return {
    handleSlew,
    handleAddToList,
    mountConnected,
  };
}
