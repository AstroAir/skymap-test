/**
 * React Hooks - Custom hooks for the application
 * 
 * Usage:
 * ```typescript
 * import { useGeolocation, useObjectSearch } from '@/lib/hooks';
 * ```
 */

// Device and location hooks
export { 
  useGeolocation,
  getLocationWithFallback,
  type GeolocationState,
  type UseGeolocationOptions,
  type UseGeolocationReturn,
} from './use-geolocation';

export { useOrientation } from './use-orientation';

// Search and object hooks
export { 
  useObjectSearch,
  type ObjectType,
  type SortOption,
  type SearchMode,
} from './use-object-search';

export { 
  useCelestialName,
  useCelestialNames,
  useCelestialNameWithOriginal,
  useSkyCultureLanguage,
  getCelestialNameTranslation,
} from './use-celestial-name';

// Planning hooks
export { 
  useTonightRecommendations,
  type RecommendedTarget,
  type TonightConditions,
  type TwilightInfo,
} from './use-tonight-recommendations';

export { 
  useTargetPlanner,
  type TargetVisibility,
  type SessionPlan,
  type SessionConflict,
  type TargetScheduleSlot,
} from './use-target-planner';
