/**
 * Selection data utilities
 * Shared between RightControlPanel and MobileLayout
 */

import type { SelectedObjectData } from '@/lib/core/types';
import type { CurrentSelection, ObservationSelection } from '@/types/starmap/view';

/**
 * Derives currentSelection and observationSelection from a SelectedObjectData.
 * Shared between RightControlPanel and MobileLayout.
 */
export function buildSelectionData(selectedObject: SelectedObjectData | null): {
  currentSelection: CurrentSelection | null;
  observationSelection: ObservationSelection | null;
} {
  if (!selectedObject) {
    return { currentSelection: null, observationSelection: null };
  }

  const currentSelection: CurrentSelection = {
    name: selectedObject.names[0] || 'Unknown',
    ra: selectedObject.raDeg,
    dec: selectedObject.decDeg,
    raString: selectedObject.ra,
    decString: selectedObject.dec,
  };

  const observationSelection: ObservationSelection = {
    ...currentSelection,
    type: selectedObject.type,
    constellation: selectedObject.constellation,
  };

  return { currentSelection, observationSelection };
}
