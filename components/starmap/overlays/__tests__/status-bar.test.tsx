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
        AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 100 },
      },
    };
    return selector(state);
  }),
  useStellariumStore: jest.fn((selector) => {
    const state = { getCurrentViewDirection: null };
    return selector(state);
  }),
}));

jest.mock('@/lib/astronomy/astro-utils', () => ({
  formatTimeShort: jest.fn(() => '12:00'),
}));

jest.mock('@/lib/astronomy/starmap-utils', () => ({
  rad2deg: jest.fn((v: number) => v * 180 / Math.PI),
  degreesToHMS: jest.fn(() => '12h 00m 00s'),
}));

jest.mock('@/lib/astronomy/sky-quality', () => ({
  calculateAstroConditions: jest.fn(() => ({
    moonPhase: 0.5,
    moonIllumination: 100,
    moonAltitude: 45,
    moonPhaseName: 'Full Moon',
    skyQuality: 'average',
    sunAltitude: -30,
    isTwilight: false,
    bortleClass: 5,
    limitingMagnitude: 5.0,
    lstString: '12:00:00',
    twilight: {
      sunset: new Date(),
      sunrise: new Date(),
      astronomicalDusk: new Date(),
      astronomicalDawn: new Date(),
    },
  })),
  getSkyQualityColor: jest.fn(() => 'text-yellow-400'),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren) => <button {...props}>{children}</button>,
}));
jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

import { StatusBar } from '../status-bar';

describe('StatusBar', () => {
  it('renders without crashing', () => {
    render(<StatusBar currentFov={60} />);
  });

  it('renders location coordinates', () => {
    render(<StatusBar currentFov={60} />);
    expect(screen.getByText(/40\.0/)).toBeInTheDocument();
  });

  it('displays FOV >= 1 with 1 decimal', () => {
    render(<StatusBar currentFov={5.678} />);
    expect(screen.getByText('5.7°')).toBeInTheDocument();
  });

  it('displays FOV < 1 with 2 decimals', () => {
    render(<StatusBar currentFov={0.45} />);
    expect(screen.getByText('0.45°')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBar currentFov={60} className="my-custom" />);
    expect(container.querySelector('.my-custom')).toBeInTheDocument();
  });

  it('renders moon illumination in conditions popup', () => {
    render(<StatusBar currentFov={60} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders sky quality text', () => {
    render(<StatusBar currentFov={60} />);
    const matches = screen.getAllByText(/statusBar\.sky\.average/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders twilight times', () => {
    render(<StatusBar currentFov={60} />);
    // formatTimeShort is mocked to return '12:00'
    const times = screen.getAllByText('12:00');
    expect(times.length).toBeGreaterThanOrEqual(2); // sunset, sunrise, etc.
  });

  it('renders FOV icon label', () => {
    render(<StatusBar currentFov={60} />);
    expect(screen.getByText('zoom.fov')).toBeInTheDocument();
  });

  it('renders time display', () => {
    render(<StatusBar currentFov={60} />);
    // LocationTimeDisplay renders Clock icon + time
    expect(document.body.textContent).toContain('session.location');
  });
});
