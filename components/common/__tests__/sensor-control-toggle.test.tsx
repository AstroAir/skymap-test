/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SensorControlToggle } from '../sensor-control-toggle';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the stores
const mockToggleStellariumSetting = jest.fn();
const mockSetViewDirection = jest.fn();
let mockSensorControl = false;

interface SettingsState {
  stellarium: {
    sensorControl: boolean;
  };
  toggleStellariumSetting: (key: string) => void;
}

interface StellariumState {
  setViewDirection: (ra: number, dec: number) => void;
  stel: {
    D2R: number;
    R2D: number;
    core: { observer: Record<string, unknown> };
    s2c: jest.Mock;
    convertFrame: jest.Mock;
    c2s: jest.Mock;
    anp: jest.Mock;
  };
}

jest.mock('@/lib/stores', () => ({
  useSettingsStore: <T,>(selector: (state: SettingsState) => T): T => {
    return selector({
      stellarium: {
        sensorControl: mockSensorControl,
      },
      toggleStellariumSetting: mockToggleStellariumSetting,
    });
  },
  useStellariumStore: <T,>(selector: (state: StellariumState) => T): T => {
    return selector({
      setViewDirection: mockSetViewDirection,
      stel: {
        D2R: Math.PI / 180,
        R2D: 180 / Math.PI,
        core: { observer: {} },
        s2c: jest.fn(),
        convertFrame: jest.fn(),
        c2s: jest.fn(),
        anp: jest.fn((v: number) => v),
      },
    });
  },
}));

// Mock useDeviceOrientation hook
const mockRequestPermission = jest.fn();
let mockIsSupported = true;
let mockIsPermissionGranted = false;

interface DeviceOrientationProps {
  onOrientationChange: (dir: { azimuth: number; altitude: number }) => void;
}

jest.mock('@/lib/hooks/use-device-orientation', () => ({
  useDeviceOrientation: ({ onOrientationChange }: DeviceOrientationProps) => {
    // Expose onOrientationChange for testing if needed
    (global as unknown as { triggerOrientationChange: (dir: { azimuth: number; altitude: number }) => void }).triggerOrientationChange = onOrientationChange;
    return {
      isSupported: mockIsSupported,
      isPermissionGranted: mockIsPermissionGranted,
      requestPermission: mockRequestPermission,
      error: null,
    };
  },
}));

const messages = {
  settings: {
    sensorControlEnable: 'Enable Sensor Control',
    sensorControlDisable: 'Disable Sensor Control',
    sensorControlPermission: 'Permission Required',
  },
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>
        {ui}
      </TooltipProvider>
    </NextIntlClientProvider>
  );
};

describe('SensorControlToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSensorControl = false;
    mockIsSupported = true;
    mockIsPermissionGranted = false;
  });

  it('renders nothing when not supported', () => {
    mockIsSupported = false;
    const { container } = renderWithProviders(<SensorControlToggle />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when supported', () => {
    renderWithProviders(<SensorControlToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('requests permission if not granted when turning on', async () => {
    mockIsPermissionGranted = false;
    mockRequestPermission.mockResolvedValue(true);
    
    renderWithProviders(<SensorControlToggle />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(mockRequestPermission).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockToggleStellariumSetting).toHaveBeenCalledWith('sensorControl');
    });
  });

  it('does not toggle if permission is denied', async () => {
    mockIsPermissionGranted = false;
    mockRequestPermission.mockResolvedValue(false);
    
    renderWithProviders(<SensorControlToggle />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(mockToggleStellariumSetting).not.toHaveBeenCalled();
  });

  it('toggles immediately if permission is already granted', async () => {
    mockIsPermissionGranted = true;
    renderWithProviders(<SensorControlToggle />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockToggleStellariumSetting).toHaveBeenCalledWith('sensorControl');
  });

  it('auto-disables if sensor control is on but not supported', () => {
    mockSensorControl = true;
    mockIsSupported = false;
    
    renderWithProviders(<SensorControlToggle />);
    
    expect(mockToggleStellariumSetting).toHaveBeenCalledWith('sensorControl');
  });

  /* it('shows appropriate tooltip text based on state', async () => {
    // Test permission required
    mockIsPermissionGranted = false;
    const { rerender } = renderWithProviders(<SensorControlToggle />);
    
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(await screen.findByText('Permission Required')).toBeInTheDocument();

    // Test enable
    mockIsPermissionGranted = true;
    mockSensorControl = false;
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TooltipProvider>
          <SensorControlToggle />
        </TooltipProvider>
      </NextIntlClientProvider>
    );
    expect(await screen.findByText('Enable Sensor Control')).toBeInTheDocument();

    // Test disable
    mockSensorControl = true;
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TooltipProvider>
          <SensorControlToggle />
        </TooltipProvider>
      </NextIntlClientProvider>
    );
    expect(await screen.findByText('Disable Sensor Control')).toBeInTheDocument();
  }); */
});
