/**
 * Marker icon component mapping for display
 * Maps MarkerIcon type values to Lucide icon components
 */

import {
  Star,
  Circle,
  Crosshair,
  MapPinned,
  Diamond,
  Triangle,
  Square,
  Flag,
} from 'lucide-react';
import type { MarkerIcon } from '@/lib/stores';

/** Icon component mapping for marker display */
export const MarkerIconDisplay: Record<MarkerIcon, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  star: Star,
  circle: Circle,
  crosshair: Crosshair,
  pin: MapPinned,
  diamond: Diamond,
  triangle: Triangle,
  square: Square,
  flag: Flag,
};
