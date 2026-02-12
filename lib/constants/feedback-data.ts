/**
 * Constants and data generators for starmap feedback components
 * Extracted from components/starmap/feedback/ for architectural separation
 */

import type { StarPosition, GeneratedStar, ShootingStar } from '@/types';

// ============================================================================
// Loading Skeleton
// ============================================================================

/** Pre-computed star positions for loading skeleton (deterministic) */
export const STAR_POSITIONS: StarPosition[] = [
  { left: 12, top: 8, delay: 0.1 },
  { left: 45, top: 15, delay: 0.3 },
  { left: 78, top: 22, delay: 0.5 },
  { left: 23, top: 35, delay: 0.7 },
  { left: 67, top: 42, delay: 0.9 },
  { left: 34, top: 58, delay: 1.1 },
  { left: 89, top: 65, delay: 1.3 },
  { left: 56, top: 72, delay: 1.5 },
  { left: 15, top: 85, delay: 1.7 },
  { left: 82, top: 92, delay: 1.9 },
  { left: 38, top: 18, delay: 0.2 },
  { left: 91, top: 38, delay: 0.4 },
  { left: 7, top: 52, delay: 0.6 },
  { left: 62, top: 28, delay: 0.8 },
  { left: 28, top: 78, delay: 1.0 },
  { left: 73, top: 88, delay: 1.2 },
  { left: 48, top: 45, delay: 1.4 },
  { left: 95, top: 12, delay: 1.6 },
  { left: 18, top: 68, delay: 1.8 },
  { left: 55, top: 95, delay: 0.15 },
];

// ============================================================================
// Splash Screen
// ============================================================================

/** Pre-generate star data to avoid impure render - optimized for GPU performance */
export function generateStars(count: number): GeneratedStar[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (i % 4) + 1,
    left: (i * 7.3 + 13) % 100,
    top: (i * 11.7 + 23) % 100,
    duration: 2 + (i % 3),
    delay: (i * 0.13) % 3,
    brightness: 0.3 + (i % 5) * 0.15,
  }));
}

/** Generate shooting star data */
export function generateShootingStars(count: number): ShootingStar[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: 10 + (i * 25) % 60,
    startY: 5 + (i * 15) % 30,
    delay: i * 2.5,
    duration: 3 + (i % 2),
  }));
}

export const SPLASH_STARS: GeneratedStar[] = generateStars(40);
export const SPLASH_SHOOTING_STARS: ShootingStar[] = generateShootingStars(3);
