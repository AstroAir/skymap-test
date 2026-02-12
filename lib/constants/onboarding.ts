/**
 * Onboarding constants and pure utility functions
 * Extracted from components/starmap/onboarding/ and lib/stores/onboarding-store.ts
 */

import type { TourStep, TooltipPosition, WelcomeFeature } from '@/types/starmap/onboarding';
import { Telescope, Star, Map, Rocket } from 'lucide-react';

// ============================================================================
// Tour Steps
// ============================================================================

/** Predefined tour steps for the main application */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.welcome.title',
    descriptionKey: 'onboarding.steps.welcome.description',
    placement: 'center',
    showSkip: true,
  },
  {
    id: 'search',
    targetSelector: '[data-tour-id="search-button"]',
    titleKey: 'onboarding.steps.search.title',
    descriptionKey: 'onboarding.steps.search.description',
    placement: 'bottom',
    highlightPadding: 8,
    action: 'click',
  },
  {
    id: 'navigation',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.navigation.title',
    descriptionKey: 'onboarding.steps.navigation.description',
    placement: 'center',
  },
  {
    id: 'zoom',
    targetSelector: '[data-tour-id="zoom-controls"]',
    titleKey: 'onboarding.steps.zoom.title',
    descriptionKey: 'onboarding.steps.zoom.description',
    placement: 'left',
    highlightPadding: 8,
  },
  {
    id: 'settings',
    targetSelector: '[data-tour-id="settings-button"]',
    titleKey: 'onboarding.steps.settings.title',
    descriptionKey: 'onboarding.steps.settings.description',
    placement: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'fov',
    targetSelector: '[data-tour-id="fov-button"]',
    titleKey: 'onboarding.steps.fov.title',
    descriptionKey: 'onboarding.steps.fov.description',
    placement: 'left',
    highlightPadding: 8,
  },
  {
    id: 'shotlist',
    targetSelector: '[data-tour-id="shotlist-button"]',
    titleKey: 'onboarding.steps.shotlist.title',
    descriptionKey: 'onboarding.steps.shotlist.description',
    placement: 'left',
    highlightPadding: 8,
  },
  {
    id: 'tonight',
    targetSelector: '[data-tour-id="tonight-button"]',
    titleKey: 'onboarding.steps.tonight.title',
    descriptionKey: 'onboarding.steps.tonight.description',
    placement: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'contextmenu',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.contextmenu.title',
    descriptionKey: 'onboarding.steps.contextmenu.description',
    placement: 'center',
  },
  {
    id: 'complete',
    targetSelector: '[data-tour-id="canvas"]',
    titleKey: 'onboarding.steps.complete.title',
    descriptionKey: 'onboarding.steps.complete.description',
    placement: 'center',
  },
];

// ============================================================================
// Tooltip Layout Constants
// ============================================================================

/** Minimum margin from viewport edges */
export const TOOLTIP_MARGIN = 16;

/** Arrow triangle size in pixels */
export const ARROW_SIZE = 8;

// ============================================================================
// Welcome Dialog Features
// ============================================================================

export const WELCOME_FEATURES: readonly WelcomeFeature[] = [
  { icon: Telescope, key: 'explore' },
  { icon: Star, key: 'objects' },
  { icon: Map, key: 'plan' },
  { icon: Rocket, key: 'track' },
] as const;

// ============================================================================
// Arrow Style Utility
// ============================================================================

/** Compute CSS properties for the tooltip arrow based on position */
export function getArrowStyles(
  arrowPosition: TooltipPosition['arrowPosition'],
  arrowOffset: number,
  arrowSize: number = ARROW_SIZE,
): React.CSSProperties | null {
  if (arrowPosition === 'none') return null;

  const styles: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
  };

  const borderSize = `${arrowSize}px`;
  // Use CSS variable for theme consistency
  const borderColor = 'hsl(var(--card))';

  switch (arrowPosition) {
    case 'top':
      styles.top = -arrowSize;
      styles.left = arrowOffset - arrowSize;
      styles.borderLeft = `${borderSize} solid transparent`;
      styles.borderRight = `${borderSize} solid transparent`;
      styles.borderBottom = `${borderSize} solid ${borderColor}`;
      break;
    case 'bottom':
      styles.bottom = -arrowSize;
      styles.left = arrowOffset - arrowSize;
      styles.borderLeft = `${borderSize} solid transparent`;
      styles.borderRight = `${borderSize} solid transparent`;
      styles.borderTop = `${borderSize} solid ${borderColor}`;
      break;
    case 'left':
      styles.left = -arrowSize;
      styles.top = arrowOffset - arrowSize;
      styles.borderTop = `${borderSize} solid transparent`;
      styles.borderBottom = `${borderSize} solid transparent`;
      styles.borderRight = `${borderSize} solid ${borderColor}`;
      break;
    case 'right':
      styles.right = -arrowSize;
      styles.top = arrowOffset - arrowSize;
      styles.borderTop = `${borderSize} solid transparent`;
      styles.borderBottom = `${borderSize} solid transparent`;
      styles.borderLeft = `${borderSize} solid ${borderColor}`;
      break;
  }

  return styles;
}
