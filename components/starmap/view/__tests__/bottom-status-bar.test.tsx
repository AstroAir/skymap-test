/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.useFakeTimers();

// IMPORTANT: stable references to avoid infinite re-render loops
const MOCK_STEL_STATE = { stel: null, activeEngine: 'stellarium', getCurrentViewDirection: null, viewDirection: null };
const MOCK_MOUNT_STATE = { profileInfo: { AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 0 } } };
jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((sel: (s: Record<string, unknown>) => unknown) => sel(MOCK_STEL_STATE)),
  useMountStore: jest.fn((sel: (s: Record<string, unknown>) => unknown) => sel(MOCK_MOUNT_STATE)),
}));
jest.mock('@/lib/astronomy/starmap-utils', () => ({
  rad2deg: jest.fn((v: number) => v),
  degreesToHMS: jest.fn(() => '12h 00m'),
  degreesToDMS: jest.fn(() => "+40° 00'"),
}));
jest.mock('@/lib/astronomy/time/sidereal', () => ({
  getLST: jest.fn(() => 0),
  lstToHours: jest.fn(() => 0),
}));
jest.mock('@/lib/astronomy/time-scales', () => ({
  getEopSnapshot: jest.fn(() => ({ freshness: 'fallback' })),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
}));
jest.mock('@/components/common/system-status-indicator', () => ({
  SystemStatusIndicator: () => <div data-testid="system-status" />,
}));

import { BottomStatusBar } from '../bottom-status-bar';

describe('BottomStatusBar', () => {
  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('renders without crashing', () => {
    const { container } = render(<BottomStatusBar currentFov={60} />);
    expect(container).toBeTruthy();
  });

  it('displays FOV value', () => {
    render(<BottomStatusBar currentFov={60} />);
    expect(screen.getByText('60.0°')).toBeInTheDocument();
  });

  it('formats FOV with extra precision when < 1', () => {
    render(<BottomStatusBar currentFov={0.5} />);
    expect(screen.getByText('0.50°')).toBeInTheDocument();
  });

  it('renders system status indicator', () => {
    render(<BottomStatusBar currentFov={60} />);
    expect(screen.getByTestId('system-status')).toBeInTheDocument();
  });
});
