/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NightModeToggle } from '../night-mode-toggle';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the settings store
const mockToggleStellariumSetting = jest.fn();
let mockNightMode = false;

interface SettingsState {
  stellarium: {
    nightMode: boolean;
  };
  toggleStellariumSetting: (key: string) => void;
}

jest.mock('@/lib/stores', () => ({
  useSettingsStore: <T,>(selector: (state: SettingsState) => T): T => {
    const state: SettingsState = {
      stellarium: {
        nightMode: mockNightMode,
      },
      toggleStellariumSetting: mockToggleStellariumSetting,
    };
    return selector(state);
  },
}));

const messages = {
  settings: {
    nightMode: 'Night Mode',
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

describe('NightModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNightMode = false;
    document.documentElement.classList.remove('night-mode');
  });

  it('renders correctly', () => {
    renderWithProviders(<NightModeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls toggleStellariumSetting when clicked', () => {
    renderWithProviders(<NightModeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockToggleStellariumSetting).toHaveBeenCalledWith('nightMode');
  });

  it('applies night-mode class to document when enabled', () => {
    mockNightMode = true;
    renderWithProviders(<NightModeToggle />);
    expect(document.documentElement.classList.contains('night-mode')).toBe(true);
  });

  it('renders night-mode filter overlay with aria-hidden when enabled', () => {
    mockNightMode = true;
    const { container } = renderWithProviders(<NightModeToggle />);
    const overlay = container.querySelector('.night-mode-filter');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render overlay when night mode is off', () => {
    mockNightMode = false;
    const { container } = renderWithProviders(<NightModeToggle />);
    const overlay = container.querySelector('.night-mode-filter');
    expect(overlay).not.toBeInTheDocument();
  });
});
