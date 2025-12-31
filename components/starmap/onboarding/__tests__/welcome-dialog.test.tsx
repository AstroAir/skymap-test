import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { WelcomeDialog, TourRestartButton } from '../welcome-dialog';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'onboarding.restartTour': 'Restart Tour',
      'onboarding.welcome.title': 'Welcome to SkyMap',
      'onboarding.welcome.subtitle': 'Your personal window to the universe',
      'onboarding.welcome.startTour': 'Start Tour',
      'onboarding.welcome.skipTour': 'Skip for now',
      'onboarding.welcome.dontShowAgain': "Don't show this again",
      'onboarding.welcome.features.explore.title': 'Explore the Sky',
      'onboarding.welcome.features.explore.description': 'Navigate the night sky',
      'onboarding.welcome.features.objects.title': 'Discover Objects',
      'onboarding.welcome.features.objects.description': 'Find stars and galaxies',
      'onboarding.welcome.features.plan.title': 'Plan Sessions',
      'onboarding.welcome.features.plan.description': 'Create observation lists',
      'onboarding.welcome.features.track.title': 'Track Satellites',
      'onboarding.welcome.features.track.description': 'Follow ISS live',
    };
    return translations[key] || key;
  },
}));

describe('WelcomeDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useOnboardingStore.getState().resetOnboarding();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show dialog for first-time users after delay', async () => {
    render(<WelcomeDialog />);
    
    // Dialog should not be visible immediately
    expect(screen.queryByText('Welcome to SkyMap')).not.toBeInTheDocument();
    
    // Advance timers to trigger dialog
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to SkyMap')).toBeInTheDocument();
    });
  });

  it('should not show dialog if user has seen welcome', async () => {
    act(() => {
      useOnboardingStore.getState().setHasSeenWelcome(true);
    });

    render(<WelcomeDialog />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    expect(screen.queryByText('Welcome to SkyMap')).not.toBeInTheDocument();
  });

  it('should not show dialog if showOnNextVisit is false', async () => {
    act(() => {
      useOnboardingStore.getState().setShowOnNextVisit(false);
    });

    render(<WelcomeDialog />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    expect(screen.queryByText('Welcome to SkyMap')).not.toBeInTheDocument();
  });

  it('should display all feature cards', async () => {
    render(<WelcomeDialog />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Explore the Sky')).toBeInTheDocument();
      expect(screen.getByText('Discover Objects')).toBeInTheDocument();
      expect(screen.getByText('Plan Sessions')).toBeInTheDocument();
      expect(screen.getByText('Track Satellites')).toBeInTheDocument();
    });
  });

  it('should start tour when clicking Start Tour button', async () => {
    const onStartTour = jest.fn();
    
    render(<WelcomeDialog onStartTour={onStartTour} />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Start Tour')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Start Tour'));
    
    expect(onStartTour).toHaveBeenCalled();
    expect(useOnboardingStore.getState().isTourActive).toBe(true);
    expect(useOnboardingStore.getState().hasSeenWelcome).toBe(true);
  });

  it('should skip tour when clicking Skip button', async () => {
    const onSkip = jest.fn();
    
    render(<WelcomeDialog onSkip={onSkip} />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Skip for now')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Skip for now'));
    
    expect(onSkip).toHaveBeenCalled();
    expect(useOnboardingStore.getState().hasSeenWelcome).toBe(true);
  });

  it('should handle dont show again checkbox', async () => {
    render(<WelcomeDialog />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    await waitFor(() => {
      expect(screen.getByText("Don't show this again")).toBeInTheDocument();
    });
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Now skip the tour
    fireEvent.click(screen.getByText('Skip for now'));
    
    expect(useOnboardingStore.getState().showOnNextVisit).toBe(false);
  });
});

describe('TourRestartButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useOnboardingStore.getState().resetOnboarding();
      // Simulate completed onboarding
      useOnboardingStore.getState().completeOnboarding();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render restart button', () => {
    render(<TourRestartButton />);
    
    expect(screen.getByText('Restart Tour')).toBeInTheDocument();
  });

  it('should restart tour when clicked', async () => {
    render(<TourRestartButton />);
    
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
    
    fireEvent.click(screen.getByText('Restart Tour'));
    
    // After reset
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(false);
    
    // After delay, tour should start
    act(() => {
      jest.advanceTimersByTime(150);
    });
    
    await waitFor(() => {
      expect(useOnboardingStore.getState().isTourActive).toBe(true);
    });
  });
});
