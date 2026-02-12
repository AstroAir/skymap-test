/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WindowControls } from '../window-controls';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the app-control-api
const mockCloseWindow = jest.fn();
const mockMinimizeWindow = jest.fn();
const mockToggleMaximizeWindow = jest.fn();
const mockIsWindowMaximized = jest.fn();
const mockIsTauri = jest.fn();
const mockIsAlwaysOnTop = jest.fn().mockResolvedValue(false);
const mockToggleFullscreen = jest.fn();
const mockRestartApp = jest.fn();
const mockQuitApp = jest.fn();
const mockReloadWebview = jest.fn();
const mockSetAlwaysOnTop = jest.fn();
const mockSaveWindowState = jest.fn();
const mockCenterWindow = jest.fn();

jest.mock('@/lib/tauri/app-control-api', () => ({
  closeWindow: () => mockCloseWindow(),
  minimizeWindow: () => mockMinimizeWindow(),
  toggleMaximizeWindow: () => mockToggleMaximizeWindow(),
  isWindowMaximized: () => mockIsWindowMaximized(),
  isTauri: () => mockIsTauri(),
  isAlwaysOnTop: () => mockIsAlwaysOnTop(),
  toggleFullscreen: () => mockToggleFullscreen(),
  restartApp: () => mockRestartApp(),
  quitApp: () => mockQuitApp(),
  reloadWebview: () => mockReloadWebview(),
  setAlwaysOnTop: (...args: unknown[]) => mockSetAlwaysOnTop(...args),
  saveWindowState: () => mockSaveWindowState(),
  centerWindow: () => mockCenterWindow(),
}));

const messages = {
  titlebar: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close',
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

describe('WindowControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
    mockIsWindowMaximized.mockResolvedValue(false);
  });

  it('renders nothing when not in Tauri environment', async () => {
    mockIsTauri.mockReturnValue(false);
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('renders window control buttons in Tauri environment', async () => {
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
  });

  it('calls minimizeWindow when minimize button is clicked', async () => {
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      const btn = screen.getByLabelText('Minimize');
      fireEvent.click(btn);
      expect(mockMinimizeWindow).toHaveBeenCalled();
    });
  });

  it('calls toggleMaximizeWindow when maximize button is clicked', async () => {
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      const btn = screen.getByLabelText('Maximize');
      fireEvent.click(btn);
      expect(mockToggleMaximizeWindow).toHaveBeenCalled();
    });
  });

  it('calls closeWindow when close button is clicked', async () => {
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      const btn = screen.getByLabelText('Close');
      fireEvent.click(btn);
      expect(mockCloseWindow).toHaveBeenCalled();
    });
  });

  it('shows restore label when maximized', async () => {
    mockIsWindowMaximized.mockResolvedValue(true);
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Restore')).toBeInTheDocument();
    });
  });

  it('updates state on window resize', async () => {
    renderWithProviders(<WindowControls />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
    });

    mockIsWindowMaximized.mockResolvedValue(true);
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      expect(screen.getByLabelText('Restore')).toBeInTheDocument();
    });
  });
});
