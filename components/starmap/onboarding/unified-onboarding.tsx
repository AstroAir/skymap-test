'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Rocket, 
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { SETUP_WIZARD_STEPS, STEP_ICONS } from '@/lib/constants/onboarding';
import type { SetupWizardStep, UnifiedOnboardingProps } from '@/types/starmap/onboarding';
import { LocationStep } from './steps/location-step';
import { EquipmentStep } from './steps/equipment-step';
import { PreferencesStep } from './steps/preferences-step';
import { WelcomeDialog } from './welcome-dialog';
import { OnboardingTour } from './onboarding-tour';

export function UnifiedOnboarding({ onComplete }: UnifiedOnboardingProps) {
  const t = useTranslations();
  const phase = useOnboardingStore((state) => state.phase);
  const isSetupOpen = useOnboardingStore((state) => state.isSetupOpen);
  const setupStep = useOnboardingStore((state) => state.setupStep);
  const setupCompletedSteps = useOnboardingStore((state) => state.setupCompletedSteps);
  const setupNextStep = useOnboardingStore((state) => state.setupNextStep);
  const setupPrevStep = useOnboardingStore((state) => state.setupPrevStep);
  const goToSetupStep = useOnboardingStore((state) => state.goToSetupStep);
  const closeSetup = useOnboardingStore((state) => state.closeSetup);
  const completeSetup = useOnboardingStore((state) => state.completeSetup);
  const finishSetupAndStartTour = useOnboardingStore((state) => state.finishSetupAndStartTour);
  const isSetupFirstStep = useOnboardingStore((state) => state.isSetupFirstStep);
  const isSetupLastStep = useOnboardingStore((state) => state.isSetupLastStep);
  const canSetupProceed = useOnboardingStore((state) => state.canSetupProceed);
  const getSetupStepIndex = useOnboardingStore((state) => state.getSetupStepIndex);

  const [direction, setDirection] = useState(1);

  // Track animation direction for step transitions
  const handleNext = () => {
    setDirection(1);
    if (isSetupLastStep()) {
      // On last step (complete), offer to start tour
      finishSetupAndStartTour();
    } else {
      setupNextStep();
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setupPrevStep();
  };

  const handleSkip = () => {
    completeSetup();
    onComplete?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeSetup();
    }
  };

  const handleStepClick = useCallback((step: SetupWizardStep, index: number) => {
    const currentIdx = useOnboardingStore.getState().getSetupStepIndex();
    const completed = useOnboardingStore.getState().setupCompletedSteps;
    if (completed.includes(step) || index <= currentIdx) {
      setDirection(index > currentIdx ? 1 : -1);
      goToSetupStep(step);
    }
  }, [goToSetupStep]);

  // Keyboard navigation for setup wizard
  useEffect(() => {
    if (!isSetupOpen) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setDirection(1);
        if (!isSetupLastStep()) setupNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setDirection(-1);
        if (!isSetupFirstStep()) setupPrevStep();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSetupOpen, isSetupLastStep, isSetupFirstStep, setupNextStep, setupPrevStep]);

  const currentIndex = getSetupStepIndex();
  const progress = ((currentIndex + 1) / SETUP_WIZARD_STEPS.length) * 100;

  // Filter steps to show only configuration steps (skip welcome/complete in the wizard)
  const configSteps: SetupWizardStep[] = ['location', 'equipment', 'preferences'];
  const isConfigStep = configSteps.includes(setupStep);

  const stepContent = (() => {
    switch (setupStep) {
      case 'welcome':
        // Skip welcome in wizard (handled by WelcomeDialog), auto-advance
        return null;
      case 'location':
        return <LocationStep />;
      case 'equipment':
        return <EquipmentStep />;
      case 'preferences':
        return <PreferencesStep />;
      case 'complete':
        return <SetupCompleteTransition onStartTour={finishSetupAndStartTour} onSkip={handleSkip} />;
      default:
        return null;
    }
  })();

  // Welcome step is handled by WelcomeDialog, so setup wizard starts at 'location'

  return (
    <>
      {/* Unified Welcome Dialog */}
      <WelcomeDialog />

      {/* Setup Wizard Dialog */}
      {isSetupOpen && isConfigStep && (
        <Dialog open={isSetupOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden bg-card/95 backdrop-blur-md border-border p-0">
            <DialogTitle className="sr-only">
              {t('setupWizard.title')}
            </DialogTitle>
            {/* Header with progress */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
              
              <div className="relative px-6 pt-10 pb-4">
                <div className="flex items-center justify-between mb-4" role="tablist" aria-label={t('setupWizard.title')}>
                  {SETUP_WIZARD_STEPS.filter(s => s !== 'welcome').map((step, index) => {
                    const Icon = STEP_ICONS[step];
                    const isActive = step === setupStep;
                    const isCompleted = setupCompletedSteps.includes(step);
                    const realIndex = SETUP_WIZARD_STEPS.indexOf(step);
                    const isPast = realIndex < SETUP_WIZARD_STEPS.indexOf(setupStep);
                    const isClickable = isCompleted || realIndex <= SETUP_WIZARD_STEPS.indexOf(setupStep);
                    
                    return (
                      <div key={step} className="flex items-center">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-current={isActive ? 'step' : undefined}
                          aria-label={t(`setupWizard.steps.${step}.title`)}
                          tabIndex={isActive ? 0 : -1}
                          disabled={!isClickable}
                          onClick={() => handleStepClick(step, realIndex)}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                            isActive && 'bg-primary border-primary text-primary-foreground scale-110',
                            isCompleted && !isActive && 'bg-primary/20 border-primary/50 text-primary',
                            isPast && !isCompleted && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                            !isActive && !isCompleted && !isPast && 'bg-muted/50 border-border text-muted-foreground',
                            isClickable && !isActive && 'cursor-pointer hover:scale-105',
                            !isClickable && 'cursor-default opacity-60'
                          )}
                        >
                          {isCompleted && !isActive ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </button>
                        {index < SETUP_WIZARD_STEPS.filter(s => s !== 'welcome').length - 1 && (
                          <div
                            className={cn(
                              'flex-1 min-w-6 h-0.5 mx-1 sm:mx-2 transition-colors duration-300',
                              isPast || isCompleted ? 'bg-primary/50' : 'bg-border'
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <Progress value={progress} className="h-1" />
                
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    {t(`setupWizard.steps.${setupStep}.title`)}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(`setupWizard.steps.${setupStep}.subtitle`)}
                  </p>
                </div>
              </div>
            </div>

            {/* Content area with step transition animation */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={setupStep}
                  initial={{ opacity: 0, x: direction * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -60 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {stepContent}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer with navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
              <div>
                {setupStep !== 'complete' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleSkip}
                  >
                    {t('setupWizard.skipSetup')}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!isSetupFirstStep() && setupStep !== 'welcome' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('setupWizard.back')}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={!canSetupProceed()}
                  className="gap-1 bg-primary hover:bg-primary/90"
                >
                  {isSetupLastStep() ? (
                    <>
                      {t('setupWizard.getStarted')}
                      <Rocket className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {t('setupWizard.next')}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Setup Complete Transition Dialog */}
      {isSetupOpen && setupStep === 'complete' && (
        <Dialog open={true} onOpenChange={() => handleSkip()}>
          <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border">
            <DialogTitle className="sr-only">
              {t('setupWizard.steps.complete.title')}
            </DialogTitle>
            <SetupCompleteTransition onStartTour={finishSetupAndStartTour} onSkip={handleSkip} />
          </DialogContent>
        </Dialog>
      )}

      {/* Feature Tour (Spotlight mode) */}
      {phase === 'tour' && <OnboardingTour />}
    </>
  );
}

function SetupCompleteTransition({ onStartTour, onSkip }: { onStartTour: () => void; onSkip: () => void }) {
  const t = useTranslations();

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-green-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t('setupWizard.steps.complete.title')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('onboarding.transition.description')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={onStartTour}
          className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          {t('onboarding.transition.startTour')}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {t('onboarding.transition.skipTour')}
        </Button>
      </div>
    </div>
  );
}
