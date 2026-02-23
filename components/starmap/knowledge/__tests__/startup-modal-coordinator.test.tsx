/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { StartupModalCoordinator } from '../startup-modal-coordinator';

const mockOpenDialog = jest.fn();
const mockShouldAutoShowToday = jest.fn(() => false);

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useDailyKnowledgeStore: jest.fn((selector) => {
    const state = {
      shouldAutoShowToday: mockShouldAutoShowToday,
      openDialog: mockOpenDialog,
      isOpen: false,
      currentItem: null,
      items: [],
      closeDialog: jest.fn(),
    };
    return selector(state);
  }),
  useOnboardingBridgeStore: jest.fn((selector) => {
    const state = { openDailyKnowledgeRequestId: 0 };
    return selector(state);
  }),
  useOnboardingStore: jest.fn((selector) => {
    const state = {
      hasCompletedOnboarding: true,
      showOnNextVisit: false,
      isSetupOpen: false,
      isTourActive: false,
      phase: 'idle',
    };
    return selector(state);
  }),
  useSettingsStore: jest.fn((selector) => {
    const state = { preferences: { dailyKnowledgeEnabled: false } };
    return selector(state);
  }),
}));

jest.mock('../daily-knowledge-dialog', () => ({
  DailyKnowledgeDialog: () => <div data-testid="daily-knowledge-dialog" />,
}));

describe('StartupModalCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders DailyKnowledgeDialog', () => {
    const { getByTestId } = render(<StartupModalCoordinator showSplash={false} />);
    expect(getByTestId('daily-knowledge-dialog')).toBeInTheDocument();
  });

  it('does not auto-open dialog when splash is showing', () => {
    render(<StartupModalCoordinator showSplash={true} />);
    expect(mockOpenDialog).not.toHaveBeenCalled();
  });

  it('does not auto-open dialog when dailyKnowledge is disabled', () => {
    render(<StartupModalCoordinator showSplash={false} />);
    expect(mockOpenDialog).not.toHaveBeenCalled();
  });
});
