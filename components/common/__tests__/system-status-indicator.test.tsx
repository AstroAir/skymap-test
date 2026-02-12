/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SystemStatusIndicator } from '../system-status-indicator';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the system stats hook
let mockOnline = true;
let mockMemoryUsage: number | null = 256;
let mockFps: number | null = 60;
let mockIsTauriEnv = false;

jest.mock('@/lib/hooks/use-system-stats', () => ({
  useSystemStats: () => ({
    online: mockOnline,
    memoryUsage: mockMemoryUsage,
    fps: mockFps,
    isTauriEnv: mockIsTauriEnv,
  }),
}));

const messages = {
  system: {
    online: 'online',
    offline: 'offline',
    connectionOnline: 'Connected to the internet',
    connectionOffline: 'No internet connection',
    memoryUsage: 'Memory Usage',
    fps: 'FPS',
    excellent: 'Excellent',
    good: 'Good',
    low: 'Low',
    desktop: 'desktop',
    desktopApp: 'Running as desktop application',
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

describe('SystemStatusIndicator', () => {
  beforeEach(() => {
    mockOnline = true;
    mockMemoryUsage = 256;
    mockFps = 60;
    mockIsTauriEnv = false;
  });

  it('renders in default mode with online status', () => {
    renderWithProviders(<SystemStatusIndicator />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('renders offline status correctly', () => {
    mockOnline = false;
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('renders FPS counter', () => {
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.getByText('60 FPS')).toBeInTheDocument();
  });

  it('renders memory usage', () => {
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.getByText('256MB')).toBeInTheDocument();
  });

  it('hides FPS when null', () => {
    mockFps = null;
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.queryByText(/FPS/)).not.toBeInTheDocument();
  });

  it('hides memory when null', () => {
    mockMemoryUsage = null;
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.queryByText(/MB/)).not.toBeInTheDocument();
  });

  it('shows desktop indicator in Tauri environment', () => {
    mockIsTauriEnv = true;
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.getByText('desktop')).toBeInTheDocument();
  });

  it('hides desktop indicator in web environment', () => {
    mockIsTauriEnv = false;
    renderWithProviders(<SystemStatusIndicator />);
    expect(screen.queryByText('desktop')).not.toBeInTheDocument();
  });

  it('renders compact mode', () => {
    renderWithProviders(<SystemStatusIndicator compact />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // Compact mode should not show text labels
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithProviders(<SystemStatusIndicator className="custom-class" />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('custom-class');
  });
});
