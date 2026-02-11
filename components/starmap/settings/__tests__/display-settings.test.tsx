/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockSettingsState = {
  stellarium: {
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
  },
  toggleStellariumSetting: jest.fn(),
  setStellariumSetting: jest.fn(),
};

const mockSatelliteState = {
  showSatellites: true,
  showLabels: true,
  showOrbits: false,
  setShowSatellites: jest.fn(),
  setShowLabels: jest.fn(),
  setShowOrbits: jest.fn(),
};

jest.mock('@/lib/stores', () => ({
  useSatelliteStore: (selector: (state: unknown) => unknown) => selector(mockSatelliteState),
  useSettingsStore: (selector: (state: unknown) => unknown) => selector(mockSettingsState),
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

jest.mock('@/components/starmap/settings/stellarium-survey-selector', () => ({
  StellariumSurveySelector: () => <div data-testid="stellarium-survey-selector">StellariumSurveySelector</div>,
}));

jest.mock('@/components/starmap/objects/object-info-sources-config', () => ({
  ObjectInfoSourcesConfig: () => <div data-testid="object-info-sources-config">ObjectInfoSourcesConfig</div>,
}));

jest.mock('@/components/starmap/onboarding/welcome-dialog', () => ({
  TourRestartButton: () => <button data-testid="tour-restart-button">Restart Tour</button>,
}));

import { DisplaySettings } from '../display-settings';

describe('DisplaySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders display settings sections', () => {
    render(<DisplaySettings />);
    expect(screen.getAllByTestId('collapsible').length).toBeGreaterThan(0);
  });

  it('renders separators between sections', () => {
    render(<DisplaySettings />);
    expect(screen.getAllByTestId('separator').length).toBeGreaterThan(0);
  });

  it('renders stellarium survey selector', () => {
    render(<DisplaySettings />);
    expect(screen.getByTestId('stellarium-survey-selector')).toBeInTheDocument();
  });

  it('renders object info sources config', () => {
    render(<DisplaySettings />);
    expect(screen.getByTestId('object-info-sources-config')).toBeInTheDocument();
  });

  it('renders tour restart button', () => {
    render(<DisplaySettings />);
    expect(screen.getByTestId('tour-restart-button')).toBeInTheDocument();
  });

  it('renders sky culture language select', () => {
    render(<DisplaySettings />);
    expect(screen.getAllByTestId('select').length).toBeGreaterThan(0);
  });
});

describe('DisplaySettings state rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default settings from store', () => {
    render(<DisplaySettings />);
    expect(screen.getAllByTestId('collapsible').length).toBeGreaterThan(0);
  });

  it('renders all collapsible sections', () => {
    render(<DisplaySettings />);
    expect(screen.getAllByTestId('collapsible').length).toBeGreaterThanOrEqual(5);
  });

  it('renders stellarium survey selector component', () => {
    render(<DisplaySettings />);
    expect(screen.getByTestId('stellarium-survey-selector')).toBeInTheDocument();
  });
});
