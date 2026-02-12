/**
 * Landing page constants
 * Static data and pure utility functions for landing page components
 */

import type { Star, TechCategory } from '@/types/landing';

// ============================================================================
// Feature Keys
// ============================================================================

export const FEATURE_KEYS = [
  'stellarium',
  'planning',
  'shotList',
  'fovSimulator',
  'tonight',
  'coordinates',
  'equipment',
  'i18n',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

// ============================================================================
// Screenshot Keys
// ============================================================================

export const SCREENSHOT_KEYS = [
  'starmap',
  'planning',
  'fov',
  'settings',
] as const;

export type ScreenshotKey = (typeof SCREENSHOT_KEYS)[number];

// ============================================================================
// Technology Data (without icon references)
// ============================================================================

export interface TechnologyData {
  name: string;
  category: TechCategory;
  description: string;
  i18nKey: string;
}

export const TECHNOLOGIES: TechnologyData[] = [
  { name: 'Stellarium Web Engine', category: 'core', description: 'Realistic sky rendering engine', i18nKey: 'stellariumEngine' },
  { name: 'Next.js 16', category: 'framework', description: 'React framework with App Router', i18nKey: 'nextjs' },
  { name: 'React 19', category: 'framework', description: 'Latest React with Server Components', i18nKey: 'react' },
  { name: 'TypeScript', category: 'language', description: 'Type-safe JavaScript', i18nKey: 'typescript' },
  { name: 'Tailwind CSS v4', category: 'styling', description: 'Utility-first CSS framework', i18nKey: 'tailwind' },
  { name: 'Tauri 2.9', category: 'desktop', description: 'Cross-platform desktop apps', i18nKey: 'tauri' },
  { name: 'Zustand', category: 'state', description: 'Lightweight state management', i18nKey: 'zustand' },
  { name: 'shadcn/ui', category: 'components', description: 'Beautiful UI components', i18nKey: 'shadcnui' },
];

// ============================================================================
// Tech Category Colors
// ============================================================================

export const TECH_CATEGORY_COLORS: Record<TechCategory, string> = {
  core: 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30',
  framework: 'bg-secondary/20 text-secondary-foreground border-secondary/30 hover:bg-secondary/30',
  language: 'bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30',
  styling: 'bg-chart-3/20 text-foreground border-chart-3/30 hover:bg-chart-3/30',
  desktop: 'bg-chart-1/20 text-foreground border-chart-1/30 hover:bg-chart-1/30',
  state: 'bg-chart-2/20 text-foreground border-chart-2/30 hover:bg-chart-2/30',
  components: 'bg-chart-4/20 text-foreground border-chart-4/30 hover:bg-chart-4/30',
};

// ============================================================================
// Star Field Utilities
// ============================================================================

export function generateStars(count: number): Star[] {
  const result: Star[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return result;
}

export function createShootingStar() {
  return {
    x: Math.random() * 0.5,
    y: Math.random() * 0.3,
    length: Math.random() * 80 + 40,
    speed: Math.random() * 4 + 2,
    opacity: 1,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
  };
}
