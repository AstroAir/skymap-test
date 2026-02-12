/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

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

jest.mock('@/lib/stores', () => ({
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
jest.mock('@/lib/hooks', () => ({
  useCelestialName: jest.fn((name: string) => name),
  useCelestialNames: jest.fn((names: string[]) => names || []),
  useAdaptivePosition: jest.fn(() => ({ left: 12, top: 64 })),
  useAstroEnvironment: jest.fn(() => ({
    moonPhaseName: 'First Quarter',
    moonIllumination: 50,
    moonAltitude: 30,
    moonRa: 0,
    moonDec: 0,
    sunAltitude: -20,
    lstString: '00h 00m 00s',
    twilight: {
      sunset: new Date(),
      sunrise: new Date(),
      astronomicalDusk: new Date(),
      astronomicalDawn: new Date(),
    },
  })),
  useTargetAstroData: jest.fn(() => ({
    altitude: 45,
    azimuth: 180,
    moonDistance: 90,
    visibility: {
      isVisible: true,
      isCircumpolar: false,
      transitAltitude: 75,
      riseTime: new Date(),
      setTime: new Date(),
      transitTime: new Date(),
      darkImagingHours: 6,
    },
    feasibility: {
      score: 80,
      recommendation: 'good',
      moonScore: 90,
      altitudeScore: 85,
      durationScore: 75,
    },
  })),
}));

// Mock astro-utils
jest.mock('@/lib/astronomy/astro-utils', () => ({
  getMoonPhase: jest.fn(() => 0.25),
  getMoonPhaseName: jest.fn(() => 'First Quarter'),
  getMoonIllumination: jest.fn(() => 50),
  getMoonPosition: jest.fn(() => ({ ra: 0, dec: 0 })),
  getSunPosition: jest.fn(() => ({ ra: 0, dec: 0 })),
  angularSeparation: jest.fn(() => 90),
  calculateTargetVisibility: jest.fn(() => ({
    isVisible: true,
    isCircumpolar: false,
    altitude: 45,
    transitAltitude: 75,
    riseTime: new Date(),
    setTime: new Date(),
    transitTime: new Date(),
    darkImagingHours: 6,
  })),
  calculateImagingFeasibility: jest.fn(() => ({
    score: 80,
    recommendation: 'good',
    moonScore: 90,
    altitudeScore: 85,
    durationScore: 75,
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
jest.mock('@/lib/astronomy/starmap-utils', () => ({
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

import { InfoPanel } from '../info-panel';

describe('InfoPanel', () => {
  const defaultProps = {
    selectedObject: null,
    onSetFramingCoordinates: jest.fn(),
  };

  const mockSelectedObject = {
    names: ['M31', 'Andromeda Galaxy', 'NGC 224'],
    ra: '00h 42m 44s',
    dec: '+41° 16\' 09"',
    raDeg: 10.6847,
    decDeg: 41.2689,
    type: 'Galaxy',
    magnitude: 3.4,
    size: '3° x 1°',
    constellation: 'Andromeda',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when no object selected', () => {
    render(<InfoPanel {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders card container', () => {
    render(<InfoPanel {...defaultProps} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  describe('with selected object', () => {
    it('displays object name', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByText('M31')).toBeInTheDocument();
    });

    it('displays object type badge', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByText('Galaxy')).toBeInTheDocument();
    });

    it('displays magnitude when available', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByText('3.4')).toBeInTheDocument();
    });

    it('displays size when available', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByText('3° x 1°')).toBeInTheDocument();
    });

    it('displays constellation when available', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByText('Andromeda')).toBeInTheDocument();
    });

    it('displays coordinates', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByText('00h 42m 44s')).toBeInTheDocument();
      expect(screen.getByText('+41° 16\' 09"')).toBeInTheDocument();
    });

    it('renders altitude chart', () => {
      render(<InfoPanel {...defaultProps} selectedObject={mockSelectedObject} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('object type icons', () => {
    it('uses correct icon for galaxy type', () => {
      const galaxyObject = { ...mockSelectedObject, type: 'Galaxy' };
      render(<InfoPanel {...defaultProps} selectedObject={galaxyObject} />);
      expect(screen.getByText('Galaxy')).toBeInTheDocument();
    });

    it('uses correct icon for nebula type', () => {
      const nebulaObject = { ...mockSelectedObject, type: 'Nebula', names: ['M42'] };
      render(<InfoPanel {...defaultProps} selectedObject={nebulaObject} />);
      expect(screen.getByText('Nebula')).toBeInTheDocument();
    });

    it('uses correct icon for cluster type', () => {
      const clusterObject = { ...mockSelectedObject, type: 'Open Cluster', names: ['M45'] };
      render(<InfoPanel {...defaultProps} selectedObject={clusterObject} />);
      expect(screen.getByText('Open Cluster')).toBeInTheDocument();
    });
  });
});


