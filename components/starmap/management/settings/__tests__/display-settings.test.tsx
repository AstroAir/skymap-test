/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockUseSatelliteStore = jest.fn((selector) => {
  const state = {
    showSatellites: true,
    showLabels: true,
    showOrbits: false,
    setShowSatellites: jest.fn(),
    setShowLabels: jest.fn(),
    setShowOrbits: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useSatelliteStore: (selector: (state: unknown) => unknown) => mockUseSatelliteStore(selector),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, id }: { checked?: boolean; id?: string }) => (
    <input type="checkbox" checked={checked} data-testid={`switch-${id || 'default'}`} readOnly />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <option>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span>Select...</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children?: React.ReactNode }) => <button data-testid="button">{children}</button>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible">{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

jest.mock('../../../settings/stellarium-survey-selector', () => ({
  StellariumSurveySelector: () => <div data-testid="stellarium-survey-selector">StellariumSurveySelector</div>,
}));

jest.mock('../../../objects/object-info-sources-config', () => ({
  ObjectInfoSourcesConfig: () => <div data-testid="object-info-sources-config">ObjectInfoSourcesConfig</div>,
}));

jest.mock('../../../onboarding/welcome-dialog', () => ({
  TourRestartButton: () => <button data-testid="tour-restart-button">Restart Tour</button>,
}));

import { DisplaySettings } from '../display-settings';

const mockSettings = {
  constellationsLinesVisible: true,
  constellationArtVisible: false,
  azimuthalLinesVisible: false,
  equatorialLinesVisible: false,
  meridianLinesVisible: false,
  eclipticLinesVisible: false,
  atmosphereVisible: false,
  landscapesVisible: false,
  dsosVisible: true,
  surveyEnabled: true,
  surveyId: 'dss',
  surveyUrl: undefined,
  skyCultureLanguage: 'native' as const,
  nightMode: false,
  sensorControl: false,
};

describe('DisplaySettings', () => {
  const mockOnToggleSetting = jest.fn();
  const mockOnSurveyChange = jest.fn();
  const mockOnSurveyToggle = jest.fn();
  const mockOnSkyCultureLanguageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders display settings sections', () => {
    render(
      <DisplaySettings
        localSettings={mockSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getAllByTestId('collapsible').length).toBeGreaterThan(0);
  });

  it('renders separators between sections', () => {
    render(
      <DisplaySettings
        localSettings={mockSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getAllByTestId('separator').length).toBeGreaterThan(0);
  });

  it('renders stellarium survey selector', () => {
    render(
      <DisplaySettings
        localSettings={mockSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getByTestId('stellarium-survey-selector')).toBeInTheDocument();
  });

  it('renders object info sources config', () => {
    render(
      <DisplaySettings
        localSettings={mockSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getByTestId('object-info-sources-config')).toBeInTheDocument();
  });

  it('renders tour restart button', () => {
    render(
      <DisplaySettings
        localSettings={mockSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getByTestId('tour-restart-button')).toBeInTheDocument();
  });

  it('renders sky culture language select', () => {
    render(
      <DisplaySettings
        localSettings={mockSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getAllByTestId('select').length).toBeGreaterThan(0);
  });
});

describe('DisplaySettings callbacks', () => {
  const mockOnToggleSetting = jest.fn();
  const mockOnSurveyChange = jest.fn();
  const mockOnSurveyToggle = jest.fn();
  const mockOnSkyCultureLanguageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with all settings enabled', () => {
    const allEnabledSettings = {
      ...mockSettings,
      constellationsLinesVisible: true,
      constellationArtVisible: true,
      azimuthalLinesVisible: true,
      equatorialLinesVisible: true,
      meridianLinesVisible: true,
      eclipticLinesVisible: true,
      atmosphereVisible: true,
      landscapesVisible: true,
      dsosVisible: true,
      nightMode: true,
      sensorControl: true,
    };

    render(
      <DisplaySettings
        localSettings={allEnabledSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getAllByTestId('collapsible').length).toBeGreaterThan(0);
  });

  it('renders with all settings disabled', () => {
    const allDisabledSettings = {
      ...mockSettings,
      constellationsLinesVisible: false,
      constellationArtVisible: false,
      azimuthalLinesVisible: false,
      equatorialLinesVisible: false,
      meridianLinesVisible: false,
      eclipticLinesVisible: false,
      atmosphereVisible: false,
      landscapesVisible: false,
      dsosVisible: false,
      surveyEnabled: false,
      nightMode: false,
      sensorControl: false,
    };

    render(
      <DisplaySettings
        localSettings={allDisabledSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getAllByTestId('collapsible').length).toBeGreaterThan(0);
  });

  it('handles different sky culture languages', () => {
    const chineseSettings = { ...mockSettings, skyCultureLanguage: 'zh' as const };

    render(
      <DisplaySettings
        localSettings={chineseSettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getAllByTestId('select').length).toBeGreaterThan(0);
  });

  it('handles custom survey URL', () => {
    const customSurveySettings = {
      ...mockSettings,
      surveyId: 'custom',
      surveyUrl: 'https://custom-survey.example.com',
    };

    render(
      <DisplaySettings
        localSettings={customSurveySettings}
        onToggleSetting={mockOnToggleSetting}
        onSurveyChange={mockOnSurveyChange}
        onSurveyToggle={mockOnSurveyToggle}
        onSkyCultureLanguageChange={mockOnSkyCultureLanguageChange}
      />
    );

    expect(screen.getByTestId('stellarium-survey-selector')).toBeInTheDocument();
  });
});
