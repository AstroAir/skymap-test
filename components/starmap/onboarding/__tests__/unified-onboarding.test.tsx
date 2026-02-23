/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores', () => ({
  useOnboardingStore: Object.assign(
    jest.fn((selector) => {
      const state = {
        phase: 'idle',
        isSetupOpen: false,
        isTourActive: false,
        hasCompletedOnboarding: true,
        showOnNextVisit: false,
        currentStep: 0,
        totalSteps: 3,
        setPhase: jest.fn(),
        openSetup: jest.fn(),
        closeSetup: jest.fn(),
        startTour: jest.fn(),
        stopTour: jest.fn(),
        nextStep: jest.fn(),
        prevStep: jest.fn(),
        completeOnboarding: jest.fn(),
      };
      return selector(state);
    }),
    { getState: jest.fn(() => ({ phase: 'idle', hasCompletedOnboarding: true })) }
  ),
  useSettingsStore: Object.assign(
    jest.fn((selector) => {
      const state = { preferences: { locale: 'en' } };
      return selector(state);
    }),
    { getState: jest.fn() }
  ),
  useStellariumStore: jest.fn((selector) => {
    const state = { stel: null };
    return selector(state);
  }),
}));

jest.mock('../welcome-dialog', () => ({ WelcomeDialog: () => <div data-testid="welcome-dialog" /> }));
jest.mock('../onboarding-tour', () => ({ OnboardingTour: () => <div data-testid="onboarding-tour" /> }));

import { UnifiedOnboarding } from '../unified-onboarding';

describe('UnifiedOnboarding', () => {
  it('renders without crashing', () => {
    render(<UnifiedOnboarding />);
  });
});
