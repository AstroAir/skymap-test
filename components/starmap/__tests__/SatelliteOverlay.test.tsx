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
    viewDirection: { ra: 0, dec: 0 },
    fov: 60,
  };
  return selector ? selector(state) : state;
});

const mockUseSatelliteStore = jest.fn((selector) => {
  const state = {
    satellites: [],
    trackedSatellites: [],
    showLabels: true,
    showOrbits: false,
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/starmap/stores', () => ({
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
  useSatelliteStore: (selector: (state: unknown) => unknown) => mockUseSatelliteStore(selector),
}));

jest.mock('@/lib/starmap/celestial-icons', () => ({
  getSatelliteColor: jest.fn(() => '#ffffff'),
}));

// Mock UI components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

import { SatelliteOverlay } from '../SatelliteOverlay';

describe('SatelliteOverlay', () => {
  const defaultProps = {
    containerWidth: 800,
    containerHeight: 600,
    onSatelliteClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<SatelliteOverlay {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders with different container sizes', () => {
    const { container } = render(
      <SatelliteOverlay {...defaultProps} containerWidth={1920} containerHeight={1080} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders without onSatelliteClick callback', () => {
    const { container } = render(
      <SatelliteOverlay containerWidth={800} containerHeight={600} />
    );
    expect(container).toBeInTheDocument();
  });
});
