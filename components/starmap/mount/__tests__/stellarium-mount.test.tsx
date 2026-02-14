/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Mock stores
let mountState: {
  mountInfo: {
    Connected: boolean;
    Coordinates: { RADegrees: number; Dec: number };
    Tracking?: boolean;
    Slewing?: boolean;
    Parked?: boolean;
    PierSide?: string;
    TrackMode?: string;
    SlewRateIndex?: number;
    AtHome?: boolean;
  };
  profileInfo: { AstrometrySettings: { Latitude: number; Longitude: number; Elevation: number } };
  capabilities: {
    canSlew: boolean;
    canSlewAsync: boolean;
    canSync: boolean;
    canPark: boolean;
    canUnpark: boolean;
    canSetTracking: boolean;
    canMoveAxis: boolean;
    canPulseGuide: boolean;
    alignmentMode: string;
    equatorialSystem: string;
  };
  connectionConfig: {
    protocol: string;
    host: string;
    port: number;
    deviceId: number;
  };
} = {
  mountInfo: {
    Connected: false,
    Coordinates: {
      RADegrees: 0,
      Dec: 0,
    },
  },
  profileInfo: {
    AstrometrySettings: {
      Latitude: 0,
      Longitude: 0,
      Elevation: 0,
    },
  },
  capabilities: {
    canSlew: false,
    canSlewAsync: false,
    canSync: false,
    canPark: false,
    canUnpark: false,
    canSetTracking: false,
    canMoveAxis: false,
    canPulseGuide: false,
    alignmentMode: '',
    equatorialSystem: '',
  },
  connectionConfig: {
    protocol: 'simulator',
    host: 'localhost',
    port: 11111,
    deviceId: 0,
  },
};

const mockUseMountStore = jest.fn((selector) => {
  return selector ? selector(mountState) : mountState;
});

type MockStel = {
  observer: Record<string, unknown>;
  D2R: number;
  getObj: jest.Mock;
  createObj: jest.Mock;
  createLayer: jest.Mock;
  s2c: jest.Mock;
  convertFrame: jest.Mock;
  pointAndLock: jest.Mock;
};

let stellariumState: { stel: MockStel | null; isReady: boolean } = {
  stel: null,
  isReady: true,
};

const mockUseStellariumStore = jest.fn((selector) => {
  return selector ? selector(stellariumState) : stellariumState;
});

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
  useStellariumStore: (selector: (state: unknown) => unknown) => mockUseStellariumStore(selector),
}));

// Mock utils
// Mock new dependencies added during optimization
jest.mock('@/lib/hooks/use-mount-polling', () => ({
  useMountPolling: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/lib/astronomy/starmap-utils', () => ({
  degreesToHMS: jest.fn(() => '00h 00m 00s'),
  degreesToDMS: jest.fn(() => '+00° 00\' 00"'),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <div onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

jest.mock('@/lib/tauri/mount-api', () => ({
  mountApi: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getState: jest.fn(),
    getCapabilities: jest.fn(),
    setTracking: jest.fn(),
    park: jest.fn(),
    unpark: jest.fn(),
    abortSlew: jest.fn(),
    moveAxis: jest.fn(),
    stopAxis: jest.fn(),
    setSlewRate: jest.fn(),
    discover: jest.fn(),
    slewTo: jest.fn(),
    syncTo: jest.fn(),
  },
  SLEW_RATE_PRESETS: [
    { label: '1x', value: 1 },
    { label: '16x', value: 16 },
  ],
}));

jest.mock('@/lib/tauri/app-control-api', () => ({
  isTauri: jest.fn(() => false),
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

import { StellariumMount } from '../stellarium-mount';

const createMockStel = () => {
  const circle = {
    designations: jest.fn(() => []),
    getInfo: jest.fn(() => null),
    pos: [0, 0, 0],
    color: [0, 0, 0, 0],
    border_color: [0, 0, 0, 0],
    size: [0, 0],
    update: jest.fn(),
  };

  const layer = {
    add: jest.fn(),
  };

  const stel = {
    observer: {},
    D2R: Math.PI / 180,
    getObj: jest.fn(() => null),
    createObj: jest.fn(() => circle),
    createLayer: jest.fn(() => layer),
    s2c: jest.fn(() => [1, 2, 3]),
    convertFrame: jest.fn(() => [4, 5, 6]),
    pointAndLock: jest.fn(),
  };

  return { stel, layer, circle };
};

describe('StellariumMount', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mountState = {
      mountInfo: {
        Connected: false,
        Coordinates: {
          RADegrees: 0,
          Dec: 0,
        },
      },
      profileInfo: {
        AstrometrySettings: {
          Latitude: 0,
          Longitude: 0,
          Elevation: 0,
        },
      },
      capabilities: {
        canSlew: false,
        canSlewAsync: false,
        canSync: false,
        canPark: false,
        canUnpark: false,
        canSetTracking: false,
        canMoveAxis: false,
        canPulseGuide: false,
        alignmentMode: '',
        equatorialSystem: '',
      },
      connectionConfig: {
        protocol: 'simulator',
        host: 'localhost',
        port: 11111,
        deviceId: 0,
      },
    };

    stellariumState = {
      stel: null,
      isReady: true,
    };
  });

  it('does not create marker objects when mount is not connected', () => {
    const { stel } = createMockStel();
    stellariumState.stel = stel;

    render(<StellariumMount />);
    expect(stel.createLayer).not.toHaveBeenCalled();
    expect(stel.createObj).not.toHaveBeenCalled();
  });

  it('renders disconnected state when mount is not connected', () => {
    const { container } = render(<StellariumMount />);
    // useTranslations('mount') returns key without 'mount.' prefix
    expect(container.textContent).toContain('disconnected');
  });

  it('returns null in compact mode when disconnected', () => {
    const { container } = render(<StellariumMount compact />);
    expect(container.innerHTML).toBe('');
  });

  it('hides circle objects on unmount', () => {
    const { stel, circle } = createMockStel();
    stellariumState.stel = stel;
    mountState.mountInfo.Connected = true;

    const { unmount } = render(<StellariumMount />);
    unmount();

    expect(circle.size).toEqual([0, 0]);
    expect(circle.update).toHaveBeenCalled();
  });

  it('creates marker once when connected and updates circle on coord change', async () => {
    const { stel, layer, circle } = createMockStel();
    stellariumState.stel = stel;
    mountState.mountInfo.Connected = true;
    mountState.mountInfo.Coordinates.RADegrees = 10;
    mountState.mountInfo.Coordinates.Dec = 20;

    const { rerender } = render(<StellariumMount />);

    await waitFor(() => {
      expect(stel.createLayer).toHaveBeenCalledTimes(1);
      expect(stel.createObj).toHaveBeenCalledTimes(1);
      expect(layer.add).toHaveBeenCalledTimes(1);
    });

    mountState.mountInfo.Coordinates.RADegrees = 15;
    rerender(<StellariumMount />);
    await waitFor(() => {
      expect(circle.update).toHaveBeenCalled();
    });
    expect(stel.createLayer).toHaveBeenCalledTimes(1);
    expect(stel.createObj).toHaveBeenCalledTimes(1);
    expect(stel.pointAndLock).toHaveBeenCalledTimes(0);
  });

  it('renders in compact mode with popover when connected', () => {
    const { stel } = createMockStel();
    stellariumState.stel = stel;
    mountState.mountInfo.Connected = true;
    mountState.mountInfo.Coordinates.RADegrees = 45;
    mountState.mountInfo.Coordinates.Dec = 30;

    const { container, getAllByRole } = render(<StellariumMount compact />);
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    // useTranslations('mount') returns key without 'mount.' prefix
    expect(container.textContent).toContain('mount');
  });
});
