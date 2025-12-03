/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock stores
const mockUseMountStore = jest.fn((selector) => {
  const state = {
    profileInfo: {
      AstrometrySettings: {
        Latitude: 40.7128,
        Longitude: -74.006,
      },
    },
    mountInfo: {
      Connected: false,
    },
  };
  return selector ? selector(state) : state;
});

const mockUseTargetListStore = jest.fn((selector) => {
  const state = {
    addTarget: jest.fn(),
    targets: [],
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/starmap/stores', () => ({
  useStellariumStore: jest.fn(() => ({
    stel: null,
    isReady: true,
    selectedObject: null,
    skyCultureLanguage: 'native',
  })),
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
  useTargetListStore: (selector: (state: unknown) => unknown) => mockUseTargetListStore(selector),
}));

// Mock hooks
jest.mock('@/lib/starmap/hooks', () => ({
  useCelestialName: jest.fn((name: string) => name),
  useCelestialNames: jest.fn((names: string[]) => names || []),
}));

// Mock astro-utils
jest.mock('@/lib/starmap/astro-utils', () => ({
  getMoonPhase: jest.fn(() => 0.25),
  getMoonPhaseName: jest.fn(() => 'First Quarter'),
  getMoonIllumination: jest.fn(() => 50),
  getMoonPosition: jest.fn(() => ({ ra: 0, dec: 0 })),
  getSunPosition: jest.fn(() => ({ ra: 0, dec: 0 })),
  angularSeparation: jest.fn(() => 90),
  calculateTargetVisibility: jest.fn(() => ({
    isVisible: true,
    altitude: 45,
    transitAltitude: 75,
    riseTime: new Date(),
    setTime: new Date(),
    transitTime: new Date(),
  })),
  calculateImagingFeasibility: jest.fn(() => ({
    score: 80,
    factors: [],
    moonDistance: 90,
    moonIllumination: 50,
  })),
  calculateTwilightTimes: jest.fn(() => ({
    sunset: new Date(),
    sunrise: new Date(),
    astronomicalDusk: new Date(),
    astronomicalDawn: new Date(),
  })),
  formatTimeShort: jest.fn((date: Date) => date?.toLocaleTimeString() || '--:--'),
  getAltitudeOverTime: jest.fn(() => [
    { time: new Date(), altitude: 30 },
    { time: new Date(), altitude: 45 },
    { time: new Date(), altitude: 60 },
  ]),
  getTransitTime: jest.fn(() => new Date()),
}));

// Mock utils
jest.mock('@/lib/starmap/utils', () => ({
  raDecToAltAz: jest.fn(() => ({ altitude: 45, azimuth: 180 })),
  getLST: jest.fn(() => 12),
  degreesToHMS: jest.fn(() => '00h 00m 00s'),
  degreesToDMS: jest.fn(() => '+00° 00\' 00"'),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  ReferenceLine: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

import { InfoPanel } from '../InfoPanel';

describe('InfoPanel', () => {
  const defaultProps = {
    selectedObject: null,
    onSetFramingCoordinates: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when no object selected', () => {
    render(<InfoPanel {...defaultProps} />);
    // Component should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('renders card container', () => {
    render(<InfoPanel {...defaultProps} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
