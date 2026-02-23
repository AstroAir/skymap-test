/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useMountStore: jest.fn((selector) => {
    const state = {
      profileInfo: {
        AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 0 },
      },
    };
    return selector(state);
  }),
}));

jest.mock('@/lib/astronomy/astro-utils', () => ({
  getAltitudeOverTime: jest.fn(() => [{ hour: 0, altitude: 30 }, { hour: 1, altitude: 45 }]),
  getTransitTime: jest.fn(() => ({ hoursUntilTransit: 3, transitTime: new Date() })),
  calculateTargetVisibility: jest.fn(() => ({
    riseTime: null,
    setTime: null,
    transitTime: null,
    maxAltitude: 45,
    transitAltitude: 45,
    isCircumpolar: false,
    isNeverVisible: false,
    isCurrentlyVisible: true,
    neverRises: false,
    imagingWindowStart: null,
    imagingWindowEnd: null,
    totalVisibleMinutes: 600,
    aboveThresholdMinutes: 400,
    bestImagingWindow: null,
    imagingHours: 8,
    darkImagingStart: null,
    darkImagingEnd: null,
    darkImagingHours: 6,
  })),
}));

jest.mock('recharts', () => ({
  AreaChart: ({ children }: React.PropsWithChildren) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  ReferenceLine: () => <div />,
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

import { AltitudeChartCompact } from '../altitude-chart-compact';

describe('AltitudeChartCompact', () => {
  const defaultProps = {
    ra: 83.63,
    dec: -5.39,
    name: 'Orion Nebula',
  };

  it('renders without crashing', () => {
    render(<AltitudeChartCompact {...defaultProps} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders area element', () => {
    render(<AltitudeChartCompact {...defaultProps} />);
    expect(screen.getByTestId('area')).toBeInTheDocument();
  });
});
