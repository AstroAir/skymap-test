import type {
  OnboardingEntrySurface,
  OnboardingResumeCheckpoint,
} from '@/types/starmap/onboarding';

export interface OnboardingEntryResolverState {
  hasSeenWelcome: boolean;
  hasCompletedOnboarding: boolean;
  showOnNextVisit: boolean;
  isSetupOpen: boolean;
  isTourActive: boolean;
  tourHubOpen: boolean;
  resumeCheckpoint: OnboardingResumeCheckpoint | null;
}

function hasSetupCheckpoint(
  checkpoint: OnboardingResumeCheckpoint | null,
): boolean {
  return checkpoint?.phase === 'setup' && checkpoint.setupStep !== null;
}

function hasTourCheckpoint(
  checkpoint: OnboardingResumeCheckpoint | null,
): boolean {
  return (
    checkpoint?.phase === 'tour'
    && checkpoint.activeTourId !== null
    && checkpoint.currentStepIndex >= 0
  );
}

export function resolveOnboardingEntrySurface(
  state: OnboardingEntryResolverState,
): OnboardingEntrySurface {
  if (state.isTourActive || hasTourCheckpoint(state.resumeCheckpoint)) {
    return 'resume-tour';
  }

  if (state.isSetupOpen || hasSetupCheckpoint(state.resumeCheckpoint)) {
    return 'setup';
  }

  if (state.tourHubOpen) {
    return 'tour-hub';
  }

  if (
    !state.hasSeenWelcome
    && state.showOnNextVisit
    && !state.hasCompletedOnboarding
  ) {
    return 'welcome';
  }

  return 'idle';
}

