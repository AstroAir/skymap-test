'use client';

import { useEffect, useRef } from 'react';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { TOUR_STEPS } from '@/lib/constants/onboarding';
import type { OnboardingTourProps } from '@/types/starmap/onboarding';
import { TourSpotlight } from './tour-spotlight';
import { TourTooltip } from './tour-tooltip';

export function OnboardingTour({
  onTourStart,
  onTourEnd,
  onStepChange,
}: OnboardingTourProps) {
  const isTourActive = useOnboardingStore((state) => state.isTourActive);
  const currentStepIndex = useOnboardingStore((state) => state.currentStepIndex);
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const prevStep = useOnboardingStore((state) => state.prevStep);
  const skipTour = useOnboardingStore((state) => state.skipTour);
  const endTour = useOnboardingStore((state) => state.endTour);
  const isFirstStep = useOnboardingStore((state) => state.isFirstStep);
  const isLastStep = useOnboardingStore((state) => state.isLastStep);

  const currentStep = isTourActive && currentStepIndex >= 0 && currentStepIndex < TOUR_STEPS.length
    ? TOUR_STEPS[currentStepIndex]
    : null;

  const wasTourActiveRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Notify callbacks and manage focus
  useEffect(() => {
    const wasActive = wasTourActiveRef.current;
    if (!wasActive && isTourActive) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      onTourStart?.();
    }
    if (wasActive && !isTourActive) {
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
      onTourEnd?.();
    }
    wasTourActiveRef.current = isTourActive;
  }, [isTourActive, onTourStart, onTourEnd]);

  useEffect(() => {
    if (isTourActive && currentStepIndex >= 0) {
      onStepChange?.(currentStepIndex);
    }
  }, [isTourActive, currentStepIndex, onStepChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          endTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!isLastStep()) {
            nextStep();
          } else {
            nextStep(); // This will complete the tour
          }
          break;
        case 'ArrowLeft':
          if (!isFirstStep()) {
            prevStep();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, nextStep, prevStep, endTour, isFirstStep, isLastStep]);

  if (!isTourActive || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Spotlight overlay */}
      <TourSpotlight
        targetSelector={currentStep.targetSelector}
        padding={currentStep.highlightPadding}
        isActive={isTourActive}
        spotlightRadius={currentStep.spotlightRadius}
      />

      {/* Tooltip */}
      <TourTooltip
        step={currentStep}
        currentIndex={currentStepIndex}
        totalSteps={TOUR_STEPS.length}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
        onClose={endTour}
        isFirst={isFirstStep()}
        isLast={isLastStep()}
      />
    </>
  );
}
