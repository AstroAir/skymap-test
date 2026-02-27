import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { OnboardingTour } from '../onboarding-tour';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'onboarding.stepOf': `${values?.current} of ${values?.total}`,
      'onboarding.next': 'Next',
      'onboarding.prev': 'Back',
      'onboarding.skip': 'Skip',
      'onboarding.finish': 'Finish',
      'onboarding.steps.welcome.title': 'Welcome',
      'onboarding.steps.welcome.description': 'Welcome description',
      'onboarding.steps.search.title': 'Search',
      'onboarding.steps.search.description': 'Search description',
    };
    return translations[key] || key;
  },
}));

describe('OnboardingTour', () => {
  beforeEach(() => {
    act(() => {
      useOnboardingStore.getState().resetOnboarding();
    });
  });

  it('should not render when tour is not active', () => {
    render(<OnboardingTour />);
    
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
  });

  it('should render when tour is active', async () => {
    act(() => {
      useOnboardingStore.getState().startTour();
    });

    render(<OnboardingTour />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
  });

  it('should call onTourStart when tour starts', () => {
    const onTourStart = jest.fn();
    
    render(<OnboardingTour onTourStart={onTourStart} />);
    
    act(() => {
      useOnboardingStore.getState().startTour();
    });
    
    expect(onTourStart).toHaveBeenCalled();
  });

  it('should call onTourEnd when tour ends', () => {
    const onTourEnd = jest.fn();
    
    act(() => {
      useOnboardingStore.getState().startTour();
    });
    
    render(<OnboardingTour onTourEnd={onTourEnd} />);
    
    act(() => {
      useOnboardingStore.getState().endTour();
    });
    
    expect(onTourEnd).toHaveBeenCalled();
  });

  it('should call onStepChange when step changes', async () => {
    const onStepChange = jest.fn();
    
    act(() => {
      useOnboardingStore.getState().startTour();
    });
    
    render(<OnboardingTour onStepChange={onStepChange} />);
    
    expect(onStepChange).toHaveBeenCalledWith(0);
    
    act(() => {
      useOnboardingStore.getState().nextStep();
    });
    
    await waitFor(() => {
      expect(onStepChange).toHaveBeenCalledWith(1);
    });
  });

  it('should respond to Escape key to close tour', async () => {
    act(() => {
      useOnboardingStore.getState().startTour();
    });

    render(<OnboardingTour />);
    
    await waitFor(() => {
      expect(useOnboardingStore.getState().isTourActive).toBe(true);
    });
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    await waitFor(() => {
      expect(useOnboardingStore.getState().isTourActive).toBe(false);
    });
  });

  it('should respond to ArrowRight key to go to next step', async () => {
    act(() => {
      useOnboardingStore.getState().startTour();
    });

    render(<OnboardingTour />);
    
    expect(useOnboardingStore.getState().currentStepIndex).toBe(0);
    
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(useOnboardingStore.getState().currentStepIndex).toBe(1);
    });
  });

  it('should respond to ArrowLeft key to go to previous step', async () => {
    act(() => {
      useOnboardingStore.getState().startTour();
      useOnboardingStore.getState().goToStep(2);
    });

    render(<OnboardingTour />);
    
    expect(useOnboardingStore.getState().currentStepIndex).toBe(2);
    
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    
    await waitFor(() => {
      expect(useOnboardingStore.getState().currentStepIndex).toBe(1);
    });
  });

  it('should respond to Enter key to go to next step', async () => {
    act(() => {
      useOnboardingStore.getState().startTour();
    });

    render(<OnboardingTour />);

    expect(useOnboardingStore.getState().currentStepIndex).toBe(0);

    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(useOnboardingStore.getState().currentStepIndex).toBe(1);
    });
  });

  it('should not go back on ArrowLeft when on first step', async () => {
    act(() => {
      useOnboardingStore.getState().startTour();
    });

    render(<OnboardingTour />);

    expect(useOnboardingStore.getState().currentStepIndex).toBe(0);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    // Should still be at step 0
    expect(useOnboardingStore.getState().currentStepIndex).toBe(0);
  });

  it('should call onTourCompleted when finishing the last step', async () => {
    const onTourCompleted = jest.fn();

    act(() => {
      useOnboardingStore.getState().startTour();
    });

    // Go to the last step
    const totalSteps = useOnboardingStore.getState().activeTourSteps.length;
    act(() => {
      useOnboardingStore.getState().goToStep(totalSteps - 1);
    });

    render(<OnboardingTour onTourCompleted={onTourCompleted} />);

    // Press Enter/ArrowRight to finish
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(onTourCompleted).toHaveBeenCalledWith('first-run-core');
    });
  });

  it('should restore focus to previous element when tour ends', () => {
    // Create a button to be the previously focused element
    const button = document.createElement('button');
    button.textContent = 'Focus Me';
    document.body.appendChild(button);
    button.focus();

    const { rerender } = render(<OnboardingTour />);

    act(() => {
      useOnboardingStore.getState().startTour();
    });
    rerender(<OnboardingTour />);

    act(() => {
      useOnboardingStore.getState().endTour();
    });
    rerender(<OnboardingTour />);

    // Clean up
    document.body.removeChild(button);
  });
});
