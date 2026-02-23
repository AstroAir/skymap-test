// ============================================================================
// Stellarium Canvas Types
// ============================================================================

import type { ClickCoords } from '@/lib/core/types';
import type { SkyMapCanvasRef, SkyMapCanvasProps } from '@/lib/core/types/sky-engine';

// Re-export ClickCoords as ClickCoordinates for backward compatibility
export type ClickCoordinates = ClickCoords;

// StellariumCanvasRef is identical to SkyMapCanvasRef.
// Using a type alias ensures type compatibility when used as a ref target
// in the SkyMapCanvas engine-switching wrapper.
export type StellariumCanvasRef = SkyMapCanvasRef;

// StellariumCanvasProps is identical to SkyMapCanvasProps.
export type StellariumCanvasProps = SkyMapCanvasProps;

// Re-export from canonical location to avoid duplicate interface definitions
export type { EngineStatus } from '@/lib/core/types/sky-engine';

export interface LoadingState {
  isLoading: boolean;
  loadingStatus: string;
  errorMessage: string | null;
  startTime: number | null;
}

export interface ViewDirection {
  ra: number;
  dec: number;
  alt: number;
  az: number;
}
