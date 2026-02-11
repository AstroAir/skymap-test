/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock stores - StellariumSettings now wraps DisplaySettings which uses both stores
jest.mock('@/lib/stores', () => ({
  useSatelliteStore: (selector: (state: unknown) => unknown) => {
    const state = {
      showSatellites: true,
      showLabels: true,
      showOrbits: false,
      setShowSatellites: jest.fn(),
      setShowLabels: jest.fn(),
      setShowOrbits: jest.fn(),
    };
    return selector ? selector(state) : state;
  },
  useSettingsStore: (selector: (state: unknown) => unknown) => {
    const state = {
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
        skyCultureLanguage: 'native',
        nightMode: false,
        sensorControl: false,
      },
      toggleStellariumSetting: jest.fn(),
      setStellariumSetting: jest.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock DisplaySettings since StellariumSettings is now a thin wrapper
jest.mock('../display-settings', () => ({
  DisplaySettings: () => <div data-testid="display-settings">DisplaySettings</div>,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="dialog-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

import { StellariumSettings } from '../stellarium-settings';

describe('StellariumSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<StellariumSettings />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders the dialog with trigger button', () => {
    render(<StellariumSettings />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('renders DisplaySettings inside the dialog', () => {
    render(<StellariumSettings />);
    expect(screen.getByTestId('display-settings')).toBeInTheDocument();
  });

  it('renders dialog title', () => {
    render(<StellariumSettings />);
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
  });
});
