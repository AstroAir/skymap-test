/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockUseMountStore = jest.fn((selector) => {
  const state = {
    profileInfo: {
      AstrometrySettings: {
        Latitude: 40.7128,
        Longitude: -74.006,
        Elevation: 100,
      },
    },
    setProfileInfo: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useMountStore: (selector: (state: unknown) => unknown) => mockUseMountStore(selector),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} data-testid="input" />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible">{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined)[]) => args.filter(Boolean).join(' '),
}));

// Mock navigator.permissions
const mockPermissionsQuery = jest.fn();
Object.defineProperty(navigator, 'permissions', {
  value: {
    query: mockPermissionsQuery,
  },
  writable: true,
});

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

import { LocationSettings } from '../location-settings';

describe('LocationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissionsQuery.mockResolvedValue({
      state: 'prompt',
      addEventListener: jest.fn(),
    });
  });

  it('renders location settings section', () => {
    render(<LocationSettings />);
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  it('renders latitude input', () => {
    render(<LocationSettings />);
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBeGreaterThanOrEqual(3); // lat, lon, elevation
  });

  it('renders longitude input', () => {
    render(<LocationSettings />);
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders elevation input', () => {
    render(<LocationSettings />);
    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
  });

  it('renders labels for location fields', () => {
    render(<LocationSettings />);
    expect(screen.getAllByTestId('label').length).toBeGreaterThan(0);
  });

  it('renders location permission status', () => {
    render(<LocationSettings />);
    // Should show permission status UI
    expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();
  });

  it('renders get location button when permission is not denied', async () => {
    render(<LocationSettings />);
    // Wait for permission check to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
  });
});

describe('LocationSettings permission edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles granted permission state', async () => {
    mockPermissionsQuery.mockResolvedValue({
      state: 'granted',
      addEventListener: jest.fn(),
    });

    render(<LocationSettings />);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  it('handles denied permission state', async () => {
    mockPermissionsQuery.mockResolvedValue({
      state: 'denied',
      addEventListener: jest.fn(),
    });

    render(<LocationSettings />);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  it('handles permission query error', async () => {
    mockPermissionsQuery.mockRejectedValue(new Error('Permission query failed'));

    render(<LocationSettings />);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  it('handles extreme latitude values', () => {
    mockUseMountStore.mockImplementation((selector) => {
      const state = {
        profileInfo: {
          AstrometrySettings: {
            Latitude: 90,
            Longitude: 0,
            Elevation: 0,
          },
        },
        setProfileInfo: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<LocationSettings />);
    expect(screen.getAllByTestId('input').length).toBeGreaterThanOrEqual(3);
  });

  it('handles extreme longitude values', () => {
    mockUseMountStore.mockImplementation((selector) => {
      const state = {
        profileInfo: {
          AstrometrySettings: {
            Latitude: 0,
            Longitude: 180,
            Elevation: 0,
          },
        },
        setProfileInfo: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<LocationSettings />);
    expect(screen.getAllByTestId('input').length).toBeGreaterThanOrEqual(3);
  });

  it('handles negative coordinates', () => {
    mockUseMountStore.mockImplementation((selector) => {
      const state = {
        profileInfo: {
          AstrometrySettings: {
            Latitude: -45.5,
            Longitude: -122.6,
            Elevation: 50,
          },
        },
        setProfileInfo: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<LocationSettings />);
    expect(screen.getAllByTestId('input').length).toBeGreaterThanOrEqual(3);
  });

  it('handles high elevation', () => {
    mockUseMountStore.mockImplementation((selector) => {
      const state = {
        profileInfo: {
          AstrometrySettings: {
            Latitude: 27.9881,
            Longitude: 86.925,
            Elevation: 8848,
          },
        },
        setProfileInfo: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<LocationSettings />);
    expect(screen.getAllByTestId('input').length).toBeGreaterThanOrEqual(3);
  });

  it('handles zero values', () => {
    mockUseMountStore.mockImplementation((selector) => {
      const state = {
        profileInfo: {
          AstrometrySettings: {
            Latitude: 0,
            Longitude: 0,
            Elevation: 0,
          },
        },
        setProfileInfo: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    render(<LocationSettings />);
    expect(screen.getAllByTestId('input').length).toBeGreaterThanOrEqual(3);
  });
});
