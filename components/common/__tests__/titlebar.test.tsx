/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TitleBar } from '../titlebar';
import { NextIntlClientProvider } from 'next-intl';

// Mock the app-control-api
const mockRestartApp = jest.fn();
const mockQuitApp = jest.fn();
const mockReloadWebview = jest.fn();
const mockCloseWindow = jest.fn();
const mockMinimizeWindow = jest.fn();
const mockToggleMaximizeWindow = jest.fn();
const mockIsWindowMaximized = jest.fn();
const mockIsTauri = jest.fn();

jest.mock('@/lib/tauri/app-control-api', () => ({
  restartApp: () => mockRestartApp(),
  quitApp: () => mockQuitApp(),
  reloadWebview: () => mockReloadWebview(),
  closeWindow: () => mockCloseWindow(),
  minimizeWindow: () => mockMinimizeWindow(),
  toggleMaximizeWindow: () => mockToggleMaximizeWindow(),
  isWindowMaximized: () => mockIsWindowMaximized(),
  isTauri: () => mockIsTauri(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Minus: () => <span data-testid="icon-minus">-</span>,
  Square: () => <span data-testid="icon-square">[]</span>,
  X: () => <span data-testid="icon-x">X</span>,
  Maximize2: () => <span data-testid="icon-maximize">+</span>,
  RotateCw: () => <span data-testid="icon-rotate">R</span>,
  Power: () => <span data-testid="icon-power">P</span>,
  RefreshCw: () => <span data-testid="icon-refresh">F</span>,
}));

// Mock context menu components
jest.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu">{children}</div>,
  ContextMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu-content">{children}</div>,
  ContextMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button data-testid="context-menu-item" onClick={onClick}>{children}</button>
  ),
  ContextMenuSeparator: () => <hr data-testid="context-menu-separator" />,
  ContextMenuShortcut: ({ children }: { children: React.ReactNode }) => <span data-testid="context-menu-shortcut">{children}</span>,
  ContextMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu-trigger">{children}</div>,
}));

// Test messages
const messages = {
  titlebar: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close',
    quit: 'Quit Application',
    restart: 'Restart Application',
    reload: 'Reload',
  },
};

const renderWithIntl = (component: React.ReactNode) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('TitleBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTauri.mockReturnValue(true);
    mockIsWindowMaximized.mockResolvedValue(false);
  });

  describe('rendering', () => {
    it('should not render when not in Tauri environment', async () => {
      mockIsTauri.mockReturnValue(false);

      const { container } = renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render when in Tauri environment', async () => {
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });
    });

    it('should render window control buttons', async () => {
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(3); // minimize, maximize, close
      });
    });

    it('should apply custom className', async () => {
      renderWithIntl(<TitleBar className="custom-class" />);

      await waitFor(() => {
        const titlebar = screen.getByText('SkyMap').closest('.titlebar');
        expect(titlebar).toHaveClass('custom-class');
      });
    });
  });

  describe('window controls', () => {
    it('should call minimizeWindow when minimize button is clicked', async () => {
      mockMinimizeWindow.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const minimizeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Minimize');

      if (minimizeButton) {
        fireEvent.click(minimizeButton);
        await waitFor(() => {
          expect(mockMinimizeWindow).toHaveBeenCalled();
        });
      }
    });

    it('should call toggleMaximizeWindow when maximize button is clicked', async () => {
      mockToggleMaximizeWindow.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const maximizeButton = buttons.find(btn =>
        btn.getAttribute('aria-label') === 'Maximize' ||
        btn.getAttribute('aria-label') === 'Restore'
      );

      if (maximizeButton) {
        fireEvent.click(maximizeButton);
        await waitFor(() => {
          expect(mockToggleMaximizeWindow).toHaveBeenCalled();
        });
      }
    });

    it('should call closeWindow when close button is clicked', async () => {
      mockCloseWindow.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Close');

      if (closeButton) {
        fireEvent.click(closeButton);
        await waitFor(() => {
          expect(mockCloseWindow).toHaveBeenCalled();
        });
      }
    });
  });

  describe('maximized state', () => {
    it('should show restore button when maximized', async () => {
      mockIsWindowMaximized.mockResolvedValue(true);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const restoreButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Restore');
        expect(restoreButton).toBeDefined();
      });
    });

    it('should show maximize button when not maximized', async () => {
      mockIsWindowMaximized.mockResolvedValue(false);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const maximizeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Maximize');
        expect(maximizeButton).toBeDefined();
      });
    });
  });

  describe('keyboard shortcuts', () => {
    it('should call quitApp on Ctrl+Q', async () => {
      mockQuitApp.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'q', ctrlKey: true });

      await waitFor(() => {
        expect(mockQuitApp).toHaveBeenCalled();
      });
    });

    it('should call restartApp on Ctrl+Shift+R', async () => {
      mockRestartApp.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'R', ctrlKey: true, shiftKey: true });

      await waitFor(() => {
        expect(mockRestartApp).toHaveBeenCalled();
      });
    });

    it('should call reloadWebview on F5', async () => {
      mockReloadWebview.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'F5' });

      await waitFor(() => {
        expect(mockReloadWebview).toHaveBeenCalled();
      });
    });

    it('should call reloadWebview on Ctrl+R (without Shift)', async () => {
      mockReloadWebview.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'r', ctrlKey: true, shiftKey: false });

      await waitFor(() => {
        expect(mockReloadWebview).toHaveBeenCalled();
      });
    });
  });

  describe('double click', () => {
    it('should toggle maximize on double click of drag region', async () => {
      mockToggleMaximizeWindow.mockResolvedValue(undefined);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      const dragRegion = screen.getByText('SkyMap').closest('[data-tauri-drag-region]');

      if (dragRegion) {
        fireEvent.doubleClick(dragRegion);
        await waitFor(() => {
          expect(mockToggleMaximizeWindow).toHaveBeenCalled();
        });
      }
    });
  });

  describe('context menu', () => {
    it('should render context menu container', async () => {
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument();
      });
    });

    it('should render context menu content with menu items', async () => {
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle minimize error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMinimizeWindow.mockRejectedValue(new Error('Minimize failed'));

      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const minimizeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Minimize');

      if (minimizeButton) {
        fireEvent.click(minimizeButton);
        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        });
      }

      consoleError.mockRestore();
    });

    it('should handle close error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCloseWindow.mockRejectedValue(new Error('Close failed'));

      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Close');

      if (closeButton) {
        fireEvent.click(closeButton);
        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        });
      }

      consoleError.mockRestore();
    });
  });

  describe('window resize listener', () => {
    it('should update maximized state on window resize', async () => {
      mockIsWindowMaximized.mockResolvedValue(false);
      renderWithIntl(<TitleBar />);

      await waitFor(() => {
        expect(screen.getByText('SkyMap')).toBeInTheDocument();
      });

      // Clear previous calls
      mockIsWindowMaximized.mockClear();
      mockIsWindowMaximized.mockResolvedValue(true);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(mockIsWindowMaximized).toHaveBeenCalled();
      });
    });
  });
});
