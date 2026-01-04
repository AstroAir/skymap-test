/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {ui}
    </TooltipProvider>
  );
};

describe('AppControlMenu', () => {
  const mockReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
    mockIsWindowMaximized.mockResolvedValue(false);
    
    // Mock window.location.reload in a way that works with JSDOM
    // @ts-expect-error - JSDOM location is read-only but we can override it this way in tests
    delete window.location;
    // @ts-expect-error - Casting to unknown then Location to satisfy TS
    window.location = { reload: mockReload, assign: jest.fn(), replace: jest.fn() } as unknown as Location;
  });

  afterEach(() => {
    // No need to restore original location if it was deleted, 
    // but in some environments you might want to.
  });

  describe('dropdown variant', () => {
    it('renders correctly in Tauri environment', async () => {
      renderWithProviders(<AppControlMenu variant="dropdown" />);
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('appControl.reload')).toBeInTheDocument();
        expect(screen.getByText('appControl.restart')).toBeInTheDocument();
        expect(screen.getByText('appControl.minimize')).toBeInTheDocument();
        expect(screen.getByText('appControl.maximize')).toBeInTheDocument();
        expect(screen.getByText('appControl.close')).toBeInTheDocument();
        expect(screen.getByText('appControl.quit')).toBeInTheDocument();
      });
    });

    it('renders correctly in Web environment', async () => {
      mockIsTauri.mockReturnValue(false);
      renderWithProviders(<AppControlMenu variant="dropdown" />);
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('appControl.reload')).toBeInTheDocument();
        expect(screen.getByText('appControl.fullscreen')).toBeInTheDocument();
        expect(screen.queryByText('appControl.restart')).not.toBeInTheDocument();
      });
    });

    it('calls appropriate functions when items are clicked', async () => {
      renderWithProviders(<AppControlMenu variant="dropdown" />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => screen.getByText('appControl.reload'));
      
      fireEvent.click(screen.getByText('appControl.reload'));
      expect(mockReloadWebview).toHaveBeenCalled();

      fireEvent.click(screen.getByText('appControl.minimize'));
      expect(mockMinimizeWindow).toHaveBeenCalled();
    });
  });

  describe('inline variant', () => {
    it('renders Tauri controls correctly', async () => {
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      await waitFor(() => {
        // Label text might be the key if it's used in aria-label/tooltip
        expect(screen.getByLabelText('appControl.maximize')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.fullscreen')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.close')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.quit')).toBeInTheDocument();
      });
    });

    it('renders Web controls correctly', async () => {
      mockIsTauri.mockReturnValue(false);
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('appControl.reload')).toBeInTheDocument();
        expect(screen.getByLabelText('appControl.fullscreen')).toBeInTheDocument();
      });
    });

    it('calls reload on web environment', async () => {
      mockIsTauri.mockReturnValue(false);
      renderWithProviders(<AppControlMenu variant="inline" />);
      
      await waitFor(() => {
        const reloadBtn = screen.getByLabelText('appControl.reload');
        fireEvent.click(reloadBtn);
        expect(mockReload).toHaveBeenCalled();
      });
    });
  });

  it('updates state on window resize', async () => {
    renderWithProviders(<AppControlMenu variant="inline" />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('appControl.maximize')).toBeInTheDocument();
    });

    mockIsWindowMaximized.mockResolvedValue(true);
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      expect(screen.getByLabelText('appControl.restore')).toBeInTheDocument();
    });
  });
});
