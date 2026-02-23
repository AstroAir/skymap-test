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
});
