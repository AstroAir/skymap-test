'use client';

import { useEffect, useCallback } from 'react';
import { useOnboardingStore, TOUR_STEPS } from '@/lib/stores/onboarding-store';
import { TourSpotlight } from './tour-spotlight';
import { TourTooltip } from './tour-tooltip';

interface OnboardingTourProps {
  onTourStart?: () => void;
  onTourEnd?: () => void;
  onStepChange?: (stepIndex: number) => void;
}

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

  // Notify callbacks
  useEffect(() => {
    if (isTourActive) {
      onTourStart?.();
    } else {
      onTourEnd?.();
    }
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

  // Handle clicking on the spotlight overlay
  const handleSpotlightClick = useCallback(() => {
    // Optional: advance on spotlight click
    // nextStep();
  }, []);

  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleSkip = useCallback(() => {
    skipTour();
  }, [skipTour]);

  const handleClose = useCallback(() => {
    endTour();
  }, [endTour]);

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
        onClick={handleSpotlightClick}
        spotlightRadius={currentStep.spotlightRadius}
      />

      {/* Tooltip */}
      <TourTooltip
        step={currentStep}
        currentIndex={currentStepIndex}
        totalSteps={TOUR_STEPS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onClose={handleClose}
        isFirst={isFirstStep()}
        isLast={isLastStep()}
      />
    </>
  );
}
