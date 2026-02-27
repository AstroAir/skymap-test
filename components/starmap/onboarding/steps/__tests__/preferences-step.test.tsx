/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// --- Mocks ---

const mockToggleStellariumSetting = jest.fn();
const mockSetStellariumSetting = jest.fn();
const mockUpdateSetupData = jest.fn();

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      stellarium: {
        skyCultureLanguage: 'native',
        constellationsLinesVisible: true,
        dsosVisible: false,
        equatorialLinesVisible: false,
        nightMode: false,
      },
      toggleStellariumSetting: mockToggleStellariumSetting,
      setStellariumSetting: mockSetStellariumSetting,
    };
    return selector(state);
  }),
}));

jest.mock('@/lib/stores/onboarding-store', () => ({
  useOnboardingStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) => {
    const state = { updateSetupData: mockUpdateSetupData };
    return selector(state);
  }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <span>native</span>,
}));

import { PreferencesStep } from '../preferences-step';

describe('PreferencesStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders description text', () => {
    render(<PreferencesStep />);
    expect(screen.getByText('setupWizard.steps.preferences.description')).toBeInTheDocument();
  });

  it('renders language selection section', () => {
    render(<PreferencesStep />);
    expect(screen.getByText('setupWizard.steps.preferences.objectLanguage')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.preferences.objectLanguageDesc')).toBeInTheDocument();
  });

  it('renders display options heading', () => {
    render(<PreferencesStep />);
    expect(screen.getByText('setupWizard.steps.preferences.displayOptions')).toBeInTheDocument();
  });

  it('renders all 4 display option toggles', () => {
    render(<PreferencesStep />);
    expect(screen.getByText('setupWizard.steps.preferences.constellationLines')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.preferences.deepSkyObjects')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.preferences.equatorialGrid')).toBeInTheDocument();
    expect(screen.getByText('setupWizard.steps.preferences.nightMode')).toBeInTheDocument();
  });

  it('calls toggleStellariumSetting when a switch is clicked', () => {
    render(<PreferencesStep />);
    // Find switches (role="switch")
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(4);
    fireEvent.click(switches[0]);
    expect(mockToggleStellariumSetting).toHaveBeenCalledWith('constellationsLinesVisible');
  });

  it('shows tip alert', () => {
    render(<PreferencesStep />);
    expect(screen.getByText('setupWizard.steps.preferences.tipMessage')).toBeInTheDocument();
  });

  it('marks preferencesConfigured true on mount', () => {
    render(<PreferencesStep />);
    expect(mockUpdateSetupData).toHaveBeenCalledWith({ preferencesConfigured: true });
  });
});
