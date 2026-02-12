/**
 * Landing page type definitions
 * Shared types for all landing page components
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Star Field Types
// ============================================================================

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

// ============================================================================
// Features Section Types
// ============================================================================

export interface LandingFeatureItem {
  icon: LucideIcon;
  key: string;
}

// ============================================================================
// Screenshot Carousel Types
// ============================================================================

export interface ScreenshotItem {
  key: string;
  icon: LucideIcon;
}

// ============================================================================
// Tech Stack Types
// ============================================================================

export type TechCategory =
  | 'core'
  | 'framework'
  | 'language'
  | 'styling'
  | 'desktop'
  | 'state'
  | 'components';

export interface TechnologyItem {
  name: string;
  category: TechCategory;
  icon: LucideIcon;
  description: string;
}
