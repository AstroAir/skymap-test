import { act, renderHook } from '@testing-library/react';
import { useSetupWizardStore, SETUP_WIZARD_STEPS } from '../setup-wizard-store';

describe('setup-wizard-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useSetupWizardStore());
    act(() => {
      result.current.resetSetup();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      expect(result.current.hasCompletedSetup).toBe(false);
      expect(result.current.showOnNextVisit).toBe(true);
      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.isOpen).toBe(false);
      expect(result.current.completedSteps).toEqual([]);
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
    it('should open wizard', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.openWizard();
      });
      
      expect(result.current.isOpen).toBe(true);
    });

    it('should close wizard', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.openWizard();
        result.current.closeWizard();
      });
      
      expect(result.current.isOpen).toBe(false);
    });

    it('should navigate to next step', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.nextStep();
      });
      
      expect(result.current.currentStep).toBe('location');
      expect(result.current.completedSteps).toContain('welcome');
    });

    it('should navigate through all steps', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      // Navigate through each step
      act(() => {
        result.current.nextStep(); // welcome -> location
      });
      expect(result.current.currentStep).toBe('location');
      
      act(() => {
        result.current.nextStep(); // location -> equipment
      });
      expect(result.current.currentStep).toBe('equipment');
      
      act(() => {
        result.current.nextStep(); // equipment -> preferences
      });
      expect(result.current.currentStep).toBe('preferences');
      
      act(() => {
        result.current.nextStep(); // preferences -> complete
      });
      expect(result.current.currentStep).toBe('complete');
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.nextStep(); // welcome -> location
        result.current.nextStep(); // location -> equipment
        result.current.prevStep(); // equipment -> location
      });
      
      expect(result.current.currentStep).toBe('location');
    });

    it('should not go before first step', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.prevStep();
      });
      
      expect(result.current.currentStep).toBe('welcome');
    });

    it('should go to specific step', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.goToStep('preferences');
      });
      
      expect(result.current.currentStep).toBe('preferences');
    });
  });

  describe('step completion', () => {
    it('should mark step as completed', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.markStepCompleted('location');
      });
      
      expect(result.current.completedSteps).toContain('location');
    });

    it('should not duplicate completed steps', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.markStepCompleted('location');
        result.current.markStepCompleted('location');
      });
      
      expect(result.current.completedSteps.filter(s => s === 'location')).toHaveLength(1);
    });

    it('should complete setup', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.openWizard();
        result.current.completeSetup();
      });
      
      expect(result.current.hasCompletedSetup).toBe(true);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.completedSteps).toEqual(SETUP_WIZARD_STEPS);
    });
  });

  describe('setup data', () => {
    it('should update setup data', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.updateSetupData({ locationConfigured: true });
      });
      
      expect(result.current.setupData.locationConfigured).toBe(true);
    });

    it('should preserve other setup data when updating', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.updateSetupData({ locationConfigured: true });
        result.current.updateSetupData({ equipmentConfigured: true });
      });
      
      expect(result.current.setupData.locationConfigured).toBe(true);
      expect(result.current.setupData.equipmentConfigured).toBe(true);
    });
  });

  describe('helper functions', () => {
    it('should return correct step index', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      expect(result.current.getCurrentStepIndex()).toBe(0);
      
      act(() => {
        result.current.nextStep();
      });
      
      expect(result.current.getCurrentStepIndex()).toBe(1);
    });

    it('should return total steps count', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      expect(result.current.getTotalSteps()).toBe(5);
    });

    it('should identify first step', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      expect(result.current.isFirstStep()).toBe(true);
      
      act(() => {
        result.current.nextStep();
      });
      
      expect(result.current.isFirstStep()).toBe(false);
    });

    it('should identify last step', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      expect(result.current.isLastStep()).toBe(false);
      
      act(() => {
        result.current.goToStep('complete');
      });
      
      expect(result.current.isLastStep()).toBe(true);
    });

    it('should allow proceeding on all steps', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      // All steps should allow proceeding (they are optional)
      SETUP_WIZARD_STEPS.forEach(step => {
        act(() => {
          result.current.goToStep(step);
        });
        expect(result.current.canProceed()).toBe(true);
      });
    });
  });

  describe('reset functionality', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      // Modify state
      act(() => {
        result.current.openWizard();
        result.current.nextStep();
        result.current.nextStep();
        result.current.updateSetupData({ locationConfigured: true });
        result.current.setShowOnNextVisit(false);
      });
      
      // Reset
      act(() => {
        result.current.resetSetup();
      });
      
      expect(result.current.hasCompletedSetup).toBe(false);
      expect(result.current.showOnNextVisit).toBe(true);
      expect(result.current.currentStep).toBe('welcome');
      expect(result.current.isOpen).toBe(false);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.setupData.locationConfigured).toBe(false);
    });
  });

  describe('showOnNextVisit', () => {
    it('should update showOnNextVisit', () => {
      const { result } = renderHook(() => useSetupWizardStore());
      
      act(() => {
        result.current.setShowOnNextVisit(false);
      });
      
      expect(result.current.showOnNextVisit).toBe(false);
    });
  });
});
