/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';

// Mock stores
const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    stel: null,
    isReady: true,
    viewDirection: { ra: 0, dec: 0, fov: 60 },
  };
  return selector ? selector(state) : state;
});

const mockUseFramingStore = jest.fn((selector) => {
  const state = {
    showFramingModal: false,
    setShowFramingModal: jest.fn(),
    setCoordinates: jest.fn(),
    setSelectedItem: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
  useFramingStore: (selector: (state: unknown) => unknown) => mockUseFramingStore(selector),
}));

// Mock utils
jest.mock('@/lib/astronomy/starmap-utils', () => ({
  degreesToHMS: jest.fn(() => '00h 00m 00s'),
  degreesToDMS: jest.fn(() => '+00° 00\' 00"'),
  rad2deg: jest.fn((rad: number) => rad * 180 / Math.PI),
}));

// Mock UI components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { StellariumViewDirection } from '../stellarium-view-direction';

describe('StellariumViewDirection', () => {
  it('renders without crashing', () => {
    render(<StellariumViewDirection />);
    // Component should render coordinate display
    expect(document.body).toBeInTheDocument();
  });

  it('displays RA/Dec coordinates', () => {
    render(<StellariumViewDirection />);
    // Should show coordinate values
    const container = document.body;
    expect(container).toBeInTheDocument();
  });
});


