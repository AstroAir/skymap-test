/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SensorControlToggle } from '../sensor-control-toggle';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock device orientation hook
const mockRequestPermission = jest.fn();
jest.mock('@/lib/hooks/use-device-orientation', () => ({
  useDeviceOrientation: () => ({
    isSupported: true,
    isPermissionGranted: true,
    requestPermission: mockRequestPermission,
    error: null,
    orientation: null,
    skyDirection: null,
  }),
}));

// Mock settings store
const mockToggleStellariumSetting = jest.fn();
const mockState = {
  stellarium: { sensorControl: false },
  toggleStellariumSetting: mockToggleStellariumSetting,
};

jest.mock('@/lib/stores', () => ({
  useSettingsStore: (selector: (state: typeof mockState) => unknown) => {
    return selector(mockState);
  },
  useStellariumStore: (selector: (state: { stel: null; setViewDirection: () => void }) => unknown) => {
    const state = { stel: null, setViewDirection: jest.fn() };
    return selector(state);
  },
}));

// Mock TooltipProvider
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SensorControlToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPermission.mockResolvedValue(true);
  });

  it('renders when supported', () => {
    render(<SensorControlToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders smartphone icon when sensor control is off', () => {
    render(<SensorControlToggle />);
    
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SensorControlToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct base styles', () => {
    render(<SensorControlToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10', 'backdrop-blur-sm');
  });

  it('handles click to toggle sensor control', async () => {
    const user = userEvent.setup();
    render(<SensorControlToggle />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(mockToggleStellariumSetting).toHaveBeenCalledWith('sensorControl');
    });
  });
});

// Note: Testing "not supported" case would require module reset
// which is complex with Jest. The component returns null when not supported.
