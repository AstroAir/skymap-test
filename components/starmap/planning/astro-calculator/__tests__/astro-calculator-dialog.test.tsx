/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AstroCalculatorDialog } from '../../astro-calculator-dialog';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: React.PropsWithChildren) => <button type="button">{children}</button>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: React.PropsWithChildren) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: React.PropsWithChildren<{ value: string }>) => <button type="button" data-value={value}>{children}</button>,
  TabsContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => selector({
    profileInfo: {
      AstrometrySettings: {
        Latitude: 39.9042,
        Longitude: 116.4074,
      },
    },
  }),
  useStellariumStore: (selector: (state: unknown) => unknown) => selector({
    setViewDirection: jest.fn(),
  }),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: (selector: (state: unknown) => unknown) => selector({
    addTarget: jest.fn(),
  }),
}));

jest.mock('@/lib/astronomy/starmap-utils', () => ({
  degreesToHMS: (value: number) => `${value}h`,
  degreesToDMS: (value: number) => `${value}d`,
}));

jest.mock('../index', () => ({
  PositionsTab: () => <div data-testid="tab-positions" />,
  WUTTab: () => <div data-testid="tab-wut" />,
  RTSTab: () => <div data-testid="tab-rts" />,
  EphemerisTab: () => <div data-testid="tab-ephemeris" />,
  AlmanacTab: () => <div data-testid="tab-almanac" />,
  PhenomenaTab: () => <div data-testid="tab-phenomena" />,
  CoordinateTab: () => <div data-testid="tab-coordinate" />,
  TimeTab: () => <div data-testid="tab-time" />,
  SolarSystemTab: () => <div data-testid="tab-solar-system" />,
}));

describe('AstroCalculatorDialog', () => {
  it('renders nine calculator tab triggers', () => {
    render(<AstroCalculatorDialog />);

    expect(screen.getByText('astroCalc.wut')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.positions')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.rts')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.ephemeris')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.almanac')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.phenomena')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.coordinate')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.timeCalc')).toBeInTheDocument();
    expect(screen.getByText('astroCalc.solarSystem')).toBeInTheDocument();
  });
});
