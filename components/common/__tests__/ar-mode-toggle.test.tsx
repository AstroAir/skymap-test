/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ARModeToggle } from '../ar-mode-toggle';

const mockSetStellariumSetting = jest.fn();

let mockArMode = false;
let mockAtmosphereVisible = true;
let mockLandscapesVisible = true;
let mockFogVisible = false;
let mockMilkyWayVisible = true;
let mockSensorControl = false;

interface SettingsState {
  stellarium: {
    arMode: boolean;
    atmosphereVisible: boolean;
    landscapesVisible: boolean;
    fogVisible: boolean;
    milkyWayVisible: boolean;
    sensorControl: boolean;
  };
  setStellariumSetting: (key: string, value: unknown) => void;
}

jest.mock('@/lib/stores', () => ({
  useSettingsStore: <T,>(selector: (state: SettingsState) => T): T => {
    return selector({
      stellarium: {
        arMode: mockArMode,
        atmosphereVisible: mockAtmosphereVisible,
        landscapesVisible: mockLandscapesVisible,
        fogVisible: mockFogVisible,
        milkyWayVisible: mockMilkyWayVisible,
        sensorControl: mockSensorControl,
      },
      setStellariumSetting: mockSetStellariumSetting,
    });
  },
}));

jest.mock('@/lib/hooks/use-is-client', () => ({
  useIsClient: () => true,
}));

const messages = {
  settings: {
    arModeEnable: 'Enable AR sky overlay',
    arModeDisable: 'Disable AR mode',
  },
};

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>{ui}</TooltipProvider>
    </NextIntlClientProvider>
  );

describe('ARModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockArMode = false;
    mockAtmosphereVisible = true;
    mockLandscapesVisible = true;
    mockFogVisible = false;
    mockMilkyWayVisible = true;
    mockSensorControl = false;
  });

  it('renders a button with test id', () => {
    renderWithProviders(<ARModeToggle />);
    expect(screen.getByTestId('ar-mode-toggle')).toBeInTheDocument();
  });

  it('enables AR mode and disables opaque layers on click', () => {
    renderWithProviders(<ARModeToggle />);
    fireEvent.click(screen.getByTestId('ar-mode-toggle'));

    expect(mockSetStellariumSetting).toHaveBeenCalledWith('arMode', true);
    expect(mockSetStellariumSetting).toHaveBeenCalledWith('sensorControl', true);
    expect(mockSetStellariumSetting).toHaveBeenCalledWith('atmosphereVisible', false);
    expect(mockSetStellariumSetting).toHaveBeenCalledWith('landscapesVisible', false);
    expect(mockSetStellariumSetting).toHaveBeenCalledWith('fogVisible', false);
    expect(mockSetStellariumSetting).toHaveBeenCalledWith('milkyWayVisible', false);
  });

  it('disables AR mode on second click', () => {
    mockArMode = true;
    renderWithProviders(<ARModeToggle />);
    fireEvent.click(screen.getByTestId('ar-mode-toggle'));

    expect(mockSetStellariumSetting).toHaveBeenCalledWith('arMode', false);
  });

  it('shows active indicator when AR is on', () => {
    mockArMode = true;
    renderWithProviders(<ARModeToggle />);
    const button = screen.getByTestId('ar-mode-toggle');
    expect(button.querySelector('.bg-blue-500')).toBeInTheDocument();
  });
});
