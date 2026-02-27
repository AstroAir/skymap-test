/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

const mockSetSafetyConfig = jest.fn();
const mockResetSafetyConfig = jest.fn();

const defaultSafetyConfig = {
  mountType: 'gem' as const,
  minAltitude: 15,
  hourAngleLimitEast: -90,
  hourAngleLimitWest: 90,
  declinationLimitMin: -85,
  declinationLimitMax: 85,
  meridianFlip: { enabled: true, minutesAfterMeridian: 5, maxMinutesAfterMeridian: 15, pauseBeforeMeridian: 2 },
  telescopeLength: 800,
  counterweightBarLength: 400,
  slewRate: 4,
  settleTime: 5,
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (s: unknown) => unknown) =>
    selector({
      profileInfo: {
        AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 100 },
      },
      safetyConfig: defaultSafetyConfig,
      setSafetyConfig: mockSetSafetyConfig,
      resetSafetyConfig: mockResetSafetyConfig,
    }),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: (selector: (s: unknown) => unknown) =>
    selector({
      targets: [
        { id: 't1', name: 'M31', ra: 10.68, dec: 41.27, status: 'planned', isArchived: false, exposurePlan: { singleExposure: 120 } },
        { id: 't2', name: 'M42', ra: 83.82, dec: -5.39, status: 'planned', isArchived: false },
      ],
    }),
}));

jest.mock('@/lib/astronomy/astro-utils', () => ({
  calculateTwilightTimes: jest.fn(() => ({
    sunset: new Date('2025-06-15T18:00:00Z'),
    astronomicalDusk: new Date('2025-06-15T20:00:00Z'),
    astronomicalDawn: new Date('2025-06-16T04:00:00Z'),
    sunrise: new Date('2025-06-16T05:30:00Z'),
    nightDuration: 8,
    darknessDuration: 8,
  })),
}));

jest.mock('@/lib/astronomy/session-scheduler', () => ({
  optimizeSchedule: jest.fn(() => ({
    targets: [
      {
        target: { id: 't1', name: 'M31', ra: 10.68, dec: 41.27, exposurePlan: { singleExposure: 120 } },
        startTime: new Date('2025-06-15T21:00:00Z'),
        endTime: new Date('2025-06-15T23:00:00Z'),
      },
    ],
    gaps: [],
  })),
}));

jest.mock('@/lib/astronomy/mount-simulator', () => ({
  simulateSequence: jest.fn(() => ({
    targets: [
      {
        targetId: 't1',
        targetName: 'M31',
        ra: 10.68,
        dec: 41.27,
        hourAngleAtStart: -30,
        hourAngleAtEnd: 10,
        minAltitude: 45,
        maxAltitude: 75,
        pierSideAtStart: 'east',
        pierSideAtEnd: 'west',
        needsMeridianFlip: true,
        issues: [
          { severity: 'warning', descriptionKey: 'issues.nearMeridian', descriptionParams: {}, suggestionKey: 'suggestions.planFlip', suggestionParams: {}, type: 'meridian_proximity' },
        ],
      },
    ],
    slews: [],
    allIssues: [{ severity: 'warning', descriptionKey: 'issues.nearMeridian', descriptionParams: {}, suggestionKey: 'suggestions.planFlip', suggestionParams: {} }],
    overallSafe: true,
    totalMeridianFlips: 1,
    totalSlewTime: 15,
    cumulativeRotation: 40,
    cableWrapRisk: false,
    summary: { safe: 0, warnings: 1, dangers: 0 },
  })),
}));

jest.mock('@/lib/astronomy/starmap-utils', () => ({
  degreesToHMS: (v: number) => `${v.toFixed(2)}h`,
  degreesToDMS: (v: number) => `${v.toFixed(2)}d`,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => <button onClick={onClick} {...props}>{children}</button>,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span data-testid="badge">{children}</span>,
}));
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <input type="checkbox" checked={!!checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
  ),
}));
jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: React.PropsWithChildren) => <label>{children}</label>,
}));
jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value?: number[]; onValueChange?: (v: number[]) => void }) => (
    <input type="range" value={value?.[0] ?? 0} onChange={(e) => onValueChange?.([Number(e.target.value)])} data-testid="slider" />
  ),
}));
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: React.PropsWithChildren<{ onValueChange?: (v: string) => void }>) => (
    <div data-testid="select" onClick={() => onValueChange?.('altaz')}>{children}</div>
  ),
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <div />,
}));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CollapsibleContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import { MountSafetySimulator } from '../mount-safety-simulator';

describe('MountSafetySimulator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('trigger')).toBeInTheDocument();
  });

  it('renders simulation summary with warnings count', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('1 results.warnings')).toBeInTheDocument();
    expect(screen.getByText('0 results.dangers')).toBeInTheDocument();
  });

  it('renders target safety card with target name', () => {
    render(<MountSafetySimulator />);
    expect(screen.getAllByText('M31').length).toBeGreaterThanOrEqual(1);
  });

  it('renders HA and altitude info for target', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText((content) => content.includes('HA:') && content.includes('-30.0°'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Alt:') && content.includes('45°'))).toBeInTheDocument();
  });

  it('renders meridian flip badge when needed', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('results.flipNeeded')).toBeInTheDocument();
  });

  it('renders config panel with mount type and limits', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('config.title')).toBeInTheDocument();
    expect(screen.getByText((t) => t.includes('config.minAltitude') && t.includes('15'))).toBeInTheDocument();
  });

  it('renders meridian flip settings for GEM mount', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('config.meridianFlip')).toBeInTheDocument();
    expect(screen.getByText('config.flipAfter')).toBeInTheDocument();
  });

  it('renders close button in footer', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('close')).toBeInTheDocument();
  });

  it('renders reset config button', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('config.reset')).toBeInTheDocument();
  });

  it('renders polar safety diagram', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('diagram.title')).toBeInTheDocument();
  });

  it('renders meridian flips and slew time in summary', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText((t) => t.includes('results.flips') && t.includes('1'))).toBeInTheDocument();
    expect(screen.getByText((t) => t.includes('results.slewTime') && t.includes('15'))).toBeInTheDocument();
  });

  it('renders pier side information', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText((t) => t.includes('results.pierSide') && t.includes('east'))).toBeInTheDocument();
  });

  it('renders issue descriptions', () => {
    render(<MountSafetySimulator />);
    expect(screen.getByText('issues.nearMeridian')).toBeInTheDocument();
    expect(screen.getByText('suggestions.planFlip')).toBeInTheDocument();
  });
});
