import { act } from '@testing-library/react';
import { useOnboardingStore, SETUP_WIZARD_STEPS } from '../onboarding-store';

describe('setup-wizard (unified onboarding store)', () => {
  const getState = () => useOnboardingStore.getState();

  beforeEach(() => {
    act(() => {
      getState().resetAll();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const s = getState();
      expect(s.hasCompletedSetup).toBe(false);
      expect(s.showOnNextVisit).toBe(true);
      expect(s.setupStep).toBe('welcome');
      expect(s.isSetupOpen).toBe(false);
      expect(s.setupCompletedSteps).toEqual([]);
    });

    it('should export SETUP_WIZARD_STEPS', () => {
      expect(SETUP_WIZARD_STEPS).toEqual([
        'welcome',
        'location',
        'equipment',
        'preferences',
        'complete',
      ]);
    });
  });

  describe('wizard navigation', () => {
    it('should open wizard at location step', () => {
      act(() => { getState().openSetup(); });
      expect(getState().isSetupOpen).toBe(true);
      expect(getState().setupStep).toBe('location');
    });

    it('should close wizard', () => {
      act(() => {
        getState().openSetup();
        getState().closeSetup();
      });
      expect(getState().isSetupOpen).toBe(false);
    });

    it('should navigate to next step', () => {
      act(() => { getState().setupNextStep(); });
      expect(getState().setupStep).toBe('location');
    });

    it('should navigate through all steps', () => {
      act(() => { getState().setupNextStep(); }); // welcome -> location
      expect(getState().setupStep).toBe('location');

      act(() => { getState().setupNextStep(); }); // location -> equipment
      expect(getState().setupStep).toBe('equipment');

      act(() => { getState().setupNextStep(); }); // equipment -> preferences
      expect(getState().setupStep).toBe('preferences');

      act(() => { getState().setupNextStep(); }); // preferences -> complete
      expect(getState().setupStep).toBe('complete');
    });

    it('should navigate to previous step', () => {
      act(() => {
        getState().setupNextStep(); // welcome -> location
        getState().setupNextStep(); // location -> equipment
        getState().setupPrevStep(); // equipment -> location
      });
      expect(getState().setupStep).toBe('location');
    });

    it('should not go before first step', () => {
      act(() => { getState().setupPrevStep(); });
      expect(getState().setupStep).toBe('welcome');
    });

    it('should go to specific step', () => {
      act(() => { getState().goToSetupStep('preferences'); });
      expect(getState().setupStep).toBe('preferences');
    });
  });

  describe('step completion', () => {
    it('should mark step as completed', () => {
      act(() => { getState().markSetupStepCompleted('location'); });
      expect(getState().setupCompletedSteps).toContain('location');
    });

    it('should not duplicate completed steps', () => {
      act(() => {
        getState().markSetupStepCompleted('location');
        getState().markSetupStepCompleted('location');
      });
      expect(getState().setupCompletedSteps.filter((s: string) => s === 'location')).toHaveLength(1);
    });

    it('should complete setup', () => {
      act(() => {
        getState().openSetup();
        getState().completeSetup();
      });
      expect(getState().hasCompletedSetup).toBe(true);
      expect(getState().isSetupOpen).toBe(false);
      expect(getState().setupCompletedSteps).toEqual(SETUP_WIZARD_STEPS);
    });
  });

  describe('setup data', () => {
    it('should update setup data', () => {
      act(() => { getState().updateSetupData({ locationConfigured: true }); });
      expect(getState().setupData.locationConfigured).toBe(true);
    });

    it('should preserve other setup data when updating', () => {
      act(() => {
        getState().updateSetupData({ locationConfigured: true });
        getState().updateSetupData({ equipmentConfigured: true });
      });
      expect(getState().setupData.locationConfigured).toBe(true);
      expect(getState().setupData.equipmentConfigured).toBe(true);
    });
  });

  describe('helper functions', () => {
    it('should return correct step index', () => {
      expect(getState().getSetupStepIndex()).toBe(0);
      act(() => { getState().setupNextStep(); });
      expect(getState().getSetupStepIndex()).toBe(1);
    });

    it('should return total steps count', () => {
      expect(getState().getSetupTotalSteps()).toBe(5);
    });

    it('should identify first step', () => {
      expect(getState().isSetupFirstStep()).toBe(true);
      act(() => { getState().setupNextStep(); });
      expect(getState().isSetupFirstStep()).toBe(false);
    });

    it('should identify last step', () => {
      expect(getState().isSetupLastStep()).toBe(false);
      act(() => { getState().goToSetupStep('complete'); });
      expect(getState().isSetupLastStep()).toBe(true);
    });

    it('should enforce soft constraints for location and equipment', () => {
      act(() => { getState().goToSetupStep('location'); });
      expect(getState().canSetupProceed()).toBe(false);

      act(() => { getState().updateSetupData({ locationConfigured: true }); });
      expect(getState().canSetupProceed()).toBe(true);

      act(() => { getState().goToSetupStep('equipment'); });
      expect(getState().canSetupProceed()).toBe(false);

      act(() => { getState().updateSetupData({ equipmentConfigured: true }); });
      expect(getState().canSetupProceed()).toBe(true);

      act(() => { getState().goToSetupStep('preferences'); });
      expect(getState().canSetupProceed()).toBe(true);
    });
  });

  describe('reset functionality', () => {
    it('should reset all state', () => {
      act(() => {
        getState().openSetup();
        getState().setupNextStep();
        getState().setupNextStep();
        getState().updateSetupData({ locationConfigured: true });
        getState().setShowOnNextVisit(false);
      });

      act(() => { getState().resetSetup(); });

      expect(getState().hasCompletedSetup).toBe(false);
      expect(getState().setupStep).toBe('welcome');
      expect(getState().isSetupOpen).toBe(false);
      expect(getState().setupCompletedSteps).toEqual([]);
      expect(getState().setupData.locationConfigured).toBe(false);
    });
  });

  describe('phase transitions', () => {
    it('should transition from setup to tour via finishSetupAndStartTour', () => {
      act(() => { getState().finishSetupAndStartTour(); });
      expect(getState().hasCompletedSetup).toBe(true);
      expect(getState().isSetupOpen).toBe(false);
      expect(getState().phase).toBe('tour');
      expect(getState().isTourActive).toBe(true);
    });

    it('should skip setup and start tour', () => {
      act(() => { getState().skipSetupStartTour(); });
      expect(getState().phase).toBe('tour');
      expect(getState().isTourActive).toBe(true);
    });

    it('should reset everything via resetAll', () => {
      act(() => {
        getState().finishSetupAndStartTour();
        getState().completeOnboarding();
        getState().resetAll();
      });
      expect(getState().hasCompletedSetup).toBe(false);
      expect(getState().hasCompletedOnboarding).toBe(false);
      expect(getState().phase).toBe('idle');
    });
  });

  describe('showOnNextVisit', () => {
    it('should update showOnNextVisit', () => {
      act(() => { getState().setShowOnNextVisit(false); });
      expect(getState().showOnNextVisit).toBe(false);
    });
  });
});

describe('setup-wizard-store adapter (backward compatibility)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const adapter = require('../setup-wizard-store');

  beforeEach(() => {
    act(() => {
      useOnboardingStore.getState().resetAll();
    });
  });

  it('should export useSetupWizardStore with getState()', () => {
    expect(adapter.useSetupWizardStore).toBeDefined();
    expect(adapter.useSetupWizardStore.getState).toBeDefined();
  });

  it('should map getState() fields correctly', () => {
    const s = adapter.useSetupWizardStore.getState();
    expect(s.hasCompletedSetup).toBe(false);
    expect(s.showOnNextVisit).toBe(true);
    expect(s.currentStep).toBe('welcome');
    expect(s.isOpen).toBe(false);
    expect(s.completedSteps).toEqual([]);
    expect(s.setupData).toBeDefined();
  });

  it('should map action functions correctly', () => {
    const s = adapter.useSetupWizardStore.getState();
    expect(typeof s.openWizard).toBe('function');
    expect(typeof s.closeWizard).toBe('function');
    expect(typeof s.nextStep).toBe('function');
    expect(typeof s.prevStep).toBe('function');
    expect(typeof s.goToStep).toBe('function');
    expect(typeof s.completeSetup).toBe('function');
    expect(typeof s.resetSetup).toBe('function');
    expect(typeof s.updateSetupData).toBe('function');
    expect(typeof s.getCurrentStepIndex).toBe('function');
    expect(typeof s.getTotalSteps).toBe('function');
    expect(typeof s.isFirstStep).toBe('function');
    expect(typeof s.isLastStep).toBe('function');
    expect(typeof s.canProceed).toBe('function');
  });

  it('openWizard should set step to welcome and open setup', () => {
    const s = adapter.useSetupWizardStore.getState();
    act(() => { s.openWizard(); });
    const os = useOnboardingStore.getState();
    expect(os.isSetupOpen).toBe(true);
    expect(os.setupStep).toBe('welcome');
    expect(os.phase).toBe('setup');
  });

  it('adapter nextStep should delegate to onboarding store', () => {
    const s = adapter.useSetupWizardStore.getState();
    act(() => { s.nextStep(); });
    const updated = adapter.useSetupWizardStore.getState();
    expect(updated.currentStep).toBe('location');
  });

  it('should re-export SETUP_WIZARD_STEPS', () => {
    expect(adapter.SETUP_WIZARD_STEPS).toEqual([
      'welcome', 'location', 'equipment', 'preferences', 'complete',
    ]);
  });
});
