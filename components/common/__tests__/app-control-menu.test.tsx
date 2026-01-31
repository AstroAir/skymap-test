/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AppControlMenu } from '../app-control-menu';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next-intl's useTranslations
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => namespace ? `${namespace}.${key}` : key,
}));

// Mock the app-control-api
const mockCloseWindow = jest.fn();
const mockMinimizeWindow = jest.fn();
const mockToggleMaximizeWindow = jest.fn();
const mockIsWindowMaximized = jest.fn();
const mockToggleFullscreen = jest.fn();
const mockRestartApp = jest.fn();
const mockQuitApp = jest.fn();
const mockReloadWebview = jest.fn();
const mockIsTauri = jest.fn();
const mockSetAlwaysOnTop = jest.fn();
const mockIsAlwaysOnTop = jest.fn();
const mockSaveWindowState = jest.fn();
const mockCenterWindow = jest.fn();

jest.mock('@/lib/tauri/app-control-api', () => ({
  closeWindow: () => mockCloseWindow(),
  minimizeWindow: () => mockMinimizeWindow(),
  toggleMaximizeWindow: () => mockToggleMaximizeWindow(),
  isWindowMaximized: () => mockIsWindowMaximized(),
  toggleFullscreen: () => mockToggleFullscreen(),
  restartApp: () => mockRestartApp(),
  quitApp: () => mockQuitApp(),
  reloadWebview: () => mockReloadWebview(),
  isTauri: () => mockIsTauri(),
  setAlwaysOnTop: (value: boolean) => mockSetAlwaysOnTop(value),
  isAlwaysOnTop: () => mockIsAlwaysOnTop(),
  saveWindowState: () => mockSaveWindowState(),
  centerWindow: () => mockCenterWindow(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
};

describe('AppControlMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
    mockIsWindowMaximized.mockResolvedValue(false);
    mockIsAlwaysOnTop.mockResolvedValue(false);
    mockSaveWindowState.mockResolvedValue(undefined);
  });

  describe('dropdown variant', () => {
    it('renders dropdown trigger button', () => {
      renderWithProviders(<AppControlMenu variant="dropdown" />);
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'appControl.appControls');
    });

    it('renders trigger with correct aria attributes', () => {
      renderWithProviders(<AppControlMenu variant="dropdown" />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('inline variant', () => {
    it('renders Tauri controls correctly', async () => {
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      // Wait for useEffect to complete and state to update
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        // Tauri inline variant shows: pinWindow, minimize, maximize, fullscreen, close
        expect(screen.getByLabelText('appControl.pinWindow')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.minimize')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.maximize')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.fullscreen')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.close')).toBeInTheDocument();
      });
    });

    it('renders Web controls correctly when not in Tauri', async () => {
      mockIsTauri.mockReturnValue(false);
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      // Component starts with isTauriEnv = false when isTauri() returns false
      // Since isTauri() returns false synchronously, web controls show immediately
      await waitFor(() => {
        expect(screen.getByLabelText('appControl.reload')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.fullscreen')).toBeInTheDocument();
      });
    });

    it('calls minimize on Tauri environment', async () => {
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      await act(async () => {
        await Promise.resolve();
      });

      const minimizeBtn = await screen.findByLabelText('appControl.minimize');
      fireEvent.click(minimizeBtn);
      expect(mockMinimizeWindow).toHaveBeenCalled();
    });

    it('calls toggleFullscreen', async () => {
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      await act(async () => {
        await Promise.resolve();
      });

      const fullscreenBtn = await screen.findByLabelText('appControl.fullscreen');
      fireEvent.click(fullscreenBtn);
      expect(mockToggleFullscreen).toHaveBeenCalled();
    });
  });

  it('updates state on window resize in Tauri environment', async () => {
    renderWithProviders(<AppControlMenu variant="inline" />);
    
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('appControl.maximize')).toBeInTheDocument();
    });

    mockIsWindowMaximized.mockResolvedValue(true);
    
    await act(async () => {
      fireEvent(window, new Event('resize'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('appControl.restore')).toBeInTheDocument();
    });
  });
});
