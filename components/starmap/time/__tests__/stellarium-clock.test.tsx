/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Create mock stel engine
const createMockStel = (overrides?: { time_speed?: number; utc?: number }) => ({
  core: {
    observer: { utc: overrides?.utc ?? 60000.5 },
    time_speed: overrides?.time_speed ?? 1,
  },
});

let mockStel: ReturnType<typeof createMockStel> | null = null;

// Mock dependencies before importing component
const mockUseStellariumStore = jest.fn((selector) => {
  const state = {
    stel: mockStel,
    isReady: true,
  };
  return selector ? selector(state) : state;
});

const mockUseSettingsStore = jest.fn((selector) => {
  const state = {
    preferences: {
      timeFormat: '24h',
      dateFormat: 'iso',
    },
  };
  return selector ? selector(state) : state;
});

const mockUseMountStore = jest.fn((selector) => {
  const state = {
    profileInfo: {
      AstrometrySettings: {
        Longitude: 116.4,
        Latitude: 39.9,
        Elevation: 0,
      },
    },
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
  useSettingsStore: (selector: (state: unknown) => unknown) => mockUseSettingsStore(selector),
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
}));

// Mock utils
jest.mock('@/lib/astronomy/starmap-utils', () => ({
  mjdToUTC: jest.fn(() => new Date('2024-06-15T12:00:00Z')),
  utcToMJD: jest.fn(() => 60000.5),
  formatDateForInput: jest.fn(() => '2024-06-15'),
  formatTimeForInput: jest.fn(() => '12:00:00'),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode }) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, ...props }: { value: number[]; onValueChange: (v: number[]) => void; 'aria-label'?: string }) => (
    <input type="range" value={value?.[0] || 0} onChange={(e) => onValueChange?.([Number(e.target.value)])} data-testid="slider" aria-label={props['aria-label']} />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children: React.ReactNode; variant?: string }) => (
    <span data-testid="speed-badge" {...props}>{children}</span>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

import { StellariumClock } from '../stellarium-clock';

describe('StellariumClock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockStel = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when stel is null', () => {
    mockStel = null;
    const { container } = render(<StellariumClock />);
    expect(container.innerHTML).toBe('');
  });

  it('renders clock display when stel is available', () => {
    mockStel = createMockStel();
    render(<StellariumClock />);
    // Should render the popover structure
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByTestId('popover-trigger')).toBeInTheDocument();
  });

  it('renders time jump buttons', () => {
    mockStel = createMockStel();
    render(<StellariumClock />);
    // 8 jump buttons (±1min, ±1hour, ±1day, ±1week)
    const buttons = screen.getAllByRole('button');
    // At least 8 jump buttons + now button + pause button
    expect(buttons.length).toBeGreaterThanOrEqual(10);
  });

  it('renders UTC and LST display sections', () => {
    mockStel = createMockStel();
    render(<StellariumClock />);
    expect(screen.getByText('time.utc')).toBeInTheDocument();
    expect(screen.getByText('time.lst')).toBeInTheDocument();
  });

  it('renders time speed slider', () => {
    mockStel = createMockStel();
    render(<StellariumClock />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('shows speed badge when not real-time', () => {
    mockStel = createMockStel({ time_speed: 4 });
    render(<StellariumClock />);
    act(() => { jest.advanceTimersByTime(1100); });
    // Badge should appear since speed != 1
    const badge = screen.queryByTestId('speed-badge');
    expect(badge).toBeInTheDocument();
  });

  it('does not show speed badge at real-time speed', () => {
    mockStel = createMockStel({ time_speed: 1 });
    render(<StellariumClock />);
    act(() => { jest.advanceTimersByTime(1100); });
    const badge = screen.queryByTestId('speed-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('time jump button modifies observer utc', () => {
    mockStel = createMockStel({ utc: 60000.5 });
    render(<StellariumClock />);
    // Find the -1d button by its translated text
    const minus1DayBtn = screen.getByText('time.minus1Day').closest('button');
    expect(minus1DayBtn).toBeTruthy();
    fireEvent.click(minus1DayBtn!);
    expect(mockStel!.core.observer.utc).toBeCloseTo(59999.5, 5);
  });

  it('now button resets time and speed', () => {
    mockStel = createMockStel({ time_speed: 4 });
    render(<StellariumClock />);
    const nowBtn = screen.getByText('time.now').closest('button');
    expect(nowBtn).toBeTruthy();
    fireEvent.click(nowBtn!);
    expect(mockStel!.core.time_speed).toBe(1);
  });

  it('pause button sets speed to 0', () => {
    mockStel = createMockStel({ time_speed: 1 });
    render(<StellariumClock />);
    act(() => { jest.advanceTimersByTime(1100); });
    // Find pause button by aria-label
    const pauseBtn = screen.getByLabelText('time.pause');
    fireEvent.click(pauseBtn);
    expect(mockStel!.core.time_speed).toBe(0);
  });

  it('play button restores previous speed after pause', () => {
    mockStel = createMockStel({ time_speed: 4 });
    render(<StellariumClock />);
    act(() => { jest.advanceTimersByTime(1100); });
    // Pause
    const pauseBtn = screen.getByLabelText('time.pause');
    fireEvent.click(pauseBtn);
    expect(mockStel!.core.time_speed).toBe(0);
    // Need to re-render after speed change
    act(() => { jest.advanceTimersByTime(2100); });
    // Resume
    const playBtn = screen.getByLabelText('time.play');
    fireEvent.click(playBtn);
    expect(mockStel!.core.time_speed).toBe(4);
  });

  it('time inputs include seconds precision', () => {
    mockStel = createMockStel();
    render(<StellariumClock />);
    const timeInput = screen.getByLabelText('time.time');
    expect(timeInput).toHaveAttribute('step', '1');
    expect(timeInput).toHaveAttribute('type', 'time');
  });
});
