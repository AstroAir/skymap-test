'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  MapPin, 
  Telescope, 
  Settings2, 
  Rocket, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSetupWizardStore, SETUP_WIZARD_STEPS, type SetupWizardStep } from '@/lib/stores/setup-wizard-store';
import { LocationStep } from './steps/location-step';
import { EquipmentStep } from './steps/equipment-step';
import { PreferencesStep } from './steps/preferences-step';

interface SetupWizardProps {
  onComplete?: () => void;
}

const STEP_ICONS: Record<SetupWizardStep, typeof MapPin> = {
  welcome: Sparkles,
  location: MapPin,
  equipment: Telescope,
  preferences: Settings2,
  complete: Rocket,
};

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const t = useTranslations();
  const isOpen = useSetupWizardStore((state) => state.isOpen);
  const hasCompletedSetup = useSetupWizardStore((state) => state.hasCompletedSetup);
  const showOnNextVisit = useSetupWizardStore((state) => state.showOnNextVisit);
  const currentStep = useSetupWizardStore((state) => state.currentStep);
  const completedSteps = useSetupWizardStore((state) => state.completedSteps);
  const openWizard = useSetupWizardStore((state) => state.openWizard);
  const closeWizard = useSetupWizardStore((state) => state.closeWizard);
  const nextStep = useSetupWizardStore((state) => state.nextStep);
  const prevStep = useSetupWizardStore((state) => state.prevStep);
  const completeSetup = useSetupWizardStore((state) => state.completeSetup);
  const isFirstStep = useSetupWizardStore((state) => state.isFirstStep);
  const isLastStep = useSetupWizardStore((state) => state.isLastStep);
  const getCurrentStepIndex = useSetupWizardStore((state) => state.getCurrentStepIndex);

  // Use a ref for client-side mounting detection to avoid lint warning
  const [mounted, setMounted] = useState(() => {
    // This will be false during SSR and true after hydration
    return typeof window !== 'undefined';
  });

  // Handle client-side mounting - use layout effect to set before paint
  useEffect(() => {
    if (!mounted) {
      // Only needed if initial state was false (during SSR)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
  }, [mounted]);

  // Auto-open wizard for first-time users
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setTimeout(() => {
      if (!hasCompletedSetup && showOnNextVisit) {
        openWizard();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [mounted, hasCompletedSetup, showOnNextVisit, openWizard]);

  const handleNext = () => {
    if (isLastStep()) {
      completeSetup();
      onComplete?.();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    completeSetup();
    onComplete?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeWizard();
    }
  };

  const currentIndex = getCurrentStepIndex();
  const progress = ((currentIndex + 1) / SETUP_WIZARD_STEPS.length) * 100;

  if (!mounted) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStepContent />;
      case 'location':
        return <LocationStep />;
      case 'equipment':
        return <EquipmentStep />;
      case 'preferences':
        return <PreferencesStep />;
      case 'complete':
        return <CompleteStepContent />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden bg-card/95 backdrop-blur-md border-border p-0">
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {t('setupWizard.title') || 'Setup Wizard'}
        </DialogTitle>
        {/* Header with progress */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          
          {/* Step indicators */}
          <div className="relative px-6 pt-10 pb-4">
            <div className="flex items-center justify-between mb-4">
              {SETUP_WIZARD_STEPS.map((step, index) => {
                const Icon = STEP_ICONS[step];
                const isActive = step === currentStep;
                const isCompleted = completedSteps.includes(step);
                const isPast = index < currentIndex;
                
                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                        isActive && 'bg-primary border-primary text-primary-foreground scale-110',
                        isCompleted && !isActive && 'bg-primary/20 border-primary/50 text-primary',
                        isPast && !isCompleted && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                        !isActive && !isCompleted && !isPast && 'bg-muted/50 border-border text-muted-foreground'
                      )}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    {index < SETUP_WIZARD_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'w-12 h-0.5 mx-2 transition-colors duration-300',
                          index < currentIndex ? 'bg-primary/50' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Progress bar */}
            <Progress value={progress} className="h-1" />
            
            {/* Step title */}
            <div className="mt-4 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {t(`setupWizard.steps.${currentStep}.title`)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t(`setupWizard.steps.${currentStep}.subtitle`)}
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {renderStepContent()}
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div>
            {currentStep !== 'welcome' && currentStep !== 'complete' && (
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
            {!isFirstStep() && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('setupWizard.back')}
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1 bg-primary hover:bg-primary/90"
            >
              {isLastStep() ? (
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
  );
}

function WelcomeStepContent() {
  const t = useTranslations();
  
  const features = [
    { icon: MapPin, key: 'location' },
    { icon: Telescope, key: 'equipment' },
    { icon: Settings2, key: 'preferences' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p className="text-muted-foreground">
          {t('setupWizard.steps.welcome.description')}
        </p>
      </div>

      {/* What we'll configure */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          {t('setupWizard.steps.welcome.whatWellConfigure')}
        </h3>
        <div className="grid gap-3">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`setupWizard.steps.welcome.features.${key}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`setupWizard.steps.welcome.features.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time estimate */}
      <p className="text-center text-xs text-muted-foreground">
        {t('setupWizard.steps.welcome.timeEstimate')}
      </p>
    </div>
  );
}

function CompleteStepContent() {
  const t = useTranslations();

  return (
    <div className="text-center space-y-6 py-4">
      {/* Success animation */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-green-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Message */}
      <div>
        <p className="text-muted-foreground mb-4">
          {t('setupWizard.steps.complete.description')}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
          <Rocket className="w-4 h-4" />
          {t('setupWizard.steps.complete.readyToExplore')}
        </div>
      </div>

      {/* Tips */}
      <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-foreground">
          {t('setupWizard.steps.complete.quickTips')}
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• {t('setupWizard.steps.complete.tip1')}</li>
          <li>• {t('setupWizard.steps.complete.tip2')}</li>
          <li>• {t('setupWizard.steps.complete.tip3')}</li>
        </ul>
      </div>
    </div>
  );
}
