/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';

// Mock stores
const mockUseMountStore = jest.fn((selector) => {
  const state = {
    isConnected: false,
    isSlewing: false,
    isTracking: false,
    profileInfo: {
      AstrometrySettings: {
        Latitude: 40.7128,
        Longitude: -74.006,
        Elevation: 10,
      },
    },
    mountInfo: {
      Connected: false,
      Coordinates: {
        RADegrees: 0,
        Dec: 0,
      },
    },
    connect: jest.fn(),
    disconnect: jest.fn(),
    slew: jest.fn(),
    sync: jest.fn(),
    park: jest.fn(),
    unpark: jest.fn(),
    setTracking: jest.fn(),
  };
  return selector ? selector(state) : state;
});

const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    stel: null,
    isReady: true,
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
}));

// Mock utils
jest.mock('@/lib/astronomy/starmap-utils', () => ({
  degreesToHMS: jest.fn(() => '00h 00m 00s'),
  degreesToDMS: jest.fn(() => '+00° 00\' 00"'),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { StellariumMount } from '../stellarium-mount';

describe('StellariumMount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<StellariumMount />);
    // Component should render
    expect(document.body).toBeInTheDocument();
  });
});


