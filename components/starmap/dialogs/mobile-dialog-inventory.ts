import type { StarmapDialogTier } from './dialog-layout';

export type DialogMobileMode = 'sheet' | 'full-screen' | 'custom';
export type DialogCloseBehavior = 'deterministic-close' | 'confirm-before-close';
export type DialogScrollStrategy = 'internal-scroll' | 'panel-scroll';
export type DialogRolloutPriority = 'P0' | 'P1' | 'P2';

export interface StarmapDialogMobileRequirement {
  id: string;
  tier: StarmapDialogTier;
  mobileMode: DialogMobileMode;
  stickyFooter: boolean;
  scrollStrategy: DialogScrollStrategy;
  closeBehavior: DialogCloseBehavior;
  rolloutPriority: DialogRolloutPriority;
  area:
    | 'planning'
    | 'objects'
    | 'management'
    | 'mount'
    | 'dialogs'
    | 'view'
    | 'knowledge';
}

export const STARMAP_DIALOG_MOBILE_REQUIREMENTS: readonly StarmapDialogMobileRequirement[] = [
  {
    id: 'target-detail-dialog',
    area: 'planning',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P0',
  },
  {
    id: 'event-detail-dialog',
    area: 'planning',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P0',
  },
  {
    id: 'astro-calculator-dialog',
    area: 'planning',
    tier: 'complex-editor',
    mobileMode: 'full-screen',
    stickyFooter: false,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P0',
  },
  {
    id: 'daily-knowledge-dialog',
    area: 'knowledge',
    tier: 'complex-editor',
    mobileMode: 'full-screen',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P0',
  },
  {
    id: 'advanced-search-dialog',
    area: 'objects',
    tier: 'complex-editor',
    mobileMode: 'full-screen',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P0',
  },
  {
    id: 'marker-edit-dialog',
    area: 'management',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P1',
  },
  {
    id: 'update-dialog',
    area: 'management',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P1',
  },
  {
    id: 'mount-connection-dialog',
    area: 'mount',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P1',
  },
  {
    id: 'slew-confirm-dialog',
    area: 'mount',
    tier: 'compact-confirmation',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'confirm-before-close',
    rolloutPriority: 'P1',
  },
  {
    id: 'go-to-coordinates-dialog',
    area: 'view',
    tier: 'compact-confirmation',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P1',
  },
  {
    id: 'close-confirm-dialog',
    area: 'view',
    tier: 'compact-confirmation',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'panel-scroll',
    closeBehavior: 'confirm-before-close',
    rolloutPriority: 'P1',
  },
  {
    id: 'add-custom-source-dialog',
    area: 'objects',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P2',
  },
  {
    id: 'edit-source-dialog',
    area: 'objects',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P2',
  },
  {
    id: 'about-dialog',
    area: 'dialogs',
    tier: 'complex-editor',
    mobileMode: 'full-screen',
    stickyFooter: false,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P2',
  },
  {
    id: 'keyboard-shortcuts-dialog',
    area: 'dialogs',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: false,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P2',
  },
  {
    id: 'stellarium-credits-dialog',
    area: 'dialogs',
    tier: 'standard-form',
    mobileMode: 'sheet',
    stickyFooter: false,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'deterministic-close',
    rolloutPriority: 'P2',
  },
  {
    id: 'feedback-dialog',
    area: 'dialogs',
    tier: 'custom',
    mobileMode: 'custom',
    stickyFooter: true,
    scrollStrategy: 'internal-scroll',
    closeBehavior: 'confirm-before-close',
    rolloutPriority: 'P2',
  },
] as const;

export const STARMAP_DIALOG_ROLLOUT_ORDER: readonly string[] =
  STARMAP_DIALOG_MOBILE_REQUIREMENTS.slice()
    .sort((left, right) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2 } as const;
      return priorityOrder[left.rolloutPriority] - priorityOrder[right.rolloutPriority];
    })
    .map((item) => item.id);

export function getDialogMobileRequirement(id: string): StarmapDialogMobileRequirement | null {
  return STARMAP_DIALOG_MOBILE_REQUIREMENTS.find((item) => item.id === id) ?? null;
}
