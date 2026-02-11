/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mock stores
let mountState: {
  mountInfo: { Connected: boolean; Coordinates: { RADegrees: number; Dec: number } };
  profileInfo: { AstrometrySettings: { Latitude: number; Longitude: number; Elevation: number } };
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
    expect(container.textContent).toContain('mount.disconnected');
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

  it('creates marker once when connected and locks only when autosync enabled', async () => {
    const { stel, layer, circle } = createMockStel();
    stellariumState.stel = stel;
    mountState.mountInfo.Connected = true;
    mountState.mountInfo.Coordinates.RADegrees = 10;
    mountState.mountInfo.Coordinates.Dec = 20;

    const { rerender, getAllByRole } = render(<StellariumMount />);

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

    const buttons = getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(stel.pointAndLock).toHaveBeenCalledTimes(1);
    });

    mountState.mountInfo.Coordinates.RADegrees = 25;
    rerender(<StellariumMount />);
    await waitFor(() => {
      expect(stel.pointAndLock).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(stel.pointAndLock).toHaveBeenCalledTimes(2);
    });

    mountState.mountInfo.Coordinates.RADegrees = 35;
    rerender(<StellariumMount />);
    await waitFor(() => {
      expect(stel.pointAndLock).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(stel.pointAndLock).toHaveBeenCalledTimes(3);
    });
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
    expect(container.textContent).toContain('mount.mount');
  });
});
