/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock store
const mockUseMountStore = jest.fn((selector) => {
  const state = {
    profileInfo: {
      AstrometrySettings: {
        Latitude: 40.7128,
        Longitude: -74.006,
      },
    },
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
}));

// Mock astro-utils
jest.mock('@/lib/astronomy/astro-utils', () => ({
  getAltitudeOverTime: jest.fn(() => [
    { hour: 0, altitude: 30, time: '20:00' },
    { hour: 1, altitude: 45, time: '21:00' },
    { hour: 2, altitude: 60, time: '22:00' },
    { hour: 3, altitude: 75, time: '23:00' },
    { hour: 4, altitude: 60, time: '00:00' },
    { hour: 5, altitude: 45, time: '01:00' },
  ]),
  getTransitTime: jest.fn(() => new Date()),
  calculateTargetVisibility: jest.fn(() => ({
    riseTime: new Date(),
    setTime: new Date(),
    transitTime: new Date(),
    maxAltitude: 75,
    isVisible: true,
    visibilityHours: 8,
  })),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3 data-testid="card-title">{children}</h3>,
}));

import { AltitudeChart } from '../altitude-chart';

describe('AltitudeChart', () => {
  const defaultProps = {
    ra: 10.685,
    dec: 41.269,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AltitudeChart {...defaultProps} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders card content', () => {
    render(<AltitudeChart {...defaultProps} />);
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('renders with custom name', () => {
    render(<AltitudeChart {...defaultProps} name="M31" />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders with custom hoursAhead', () => {
    render(<AltitudeChart {...defaultProps} hoursAhead={24} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});


