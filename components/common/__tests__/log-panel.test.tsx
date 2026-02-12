/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LogPanel, LogPanelTrigger } from '../log-panel';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock log store
const mockOpen = jest.fn();
const mockClose = jest.fn();
const mockToggle = jest.fn();
let mockIsOpen = false;

jest.mock('@/lib/stores/log-store', () => ({
  useLogPanel: () => ({
    isOpen: mockIsOpen,
    open: mockOpen,
    close: mockClose,
    toggle: mockToggle,
  }),
  useLogStore: () => ({
    stats: {
      byLevel: { debug: 0, info: 1, warn: 0, error: 0 },
      total: 1,
    },
    logs: [],
    totalCount: 0,
    filter: {},
    modules: [],
    autoScroll: true,
    setFilter: jest.fn(),
    clearFilter: jest.fn(),
    clearLogs: jest.fn(),
    downloadLogs: jest.fn(),
    refresh: jest.fn(),
    setAutoScroll: jest.fn(),
  }),
}));

jest.mock('@/lib/logger', () => ({
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
  formatTimestamp: (ts: number) => new Date(ts).toLocaleTimeString(),
  serializeData: (data: unknown) => JSON.stringify(data, null, 2),
  formatLogEntryToText: (entry: { message: string }) => entry.message,
}));

const messages = {
  logViewer: {
    title: 'Log Viewer',
    description: 'View application logs',
    errors: 'errors',
    searchPlaceholder: 'Search logs...',
    allLevels: 'All Levels',
    allModules: 'All Modules',
    debug: 'Debug',
    info: 'Info',
    warn: 'Warning',
    error: 'Error',
    settings: 'Settings',
    refresh: 'Refresh',
    export: 'Export',
    exportText: 'Export as Text',
    exportJson: 'Export as JSON',
    clear: 'Clear',
    autoScroll: 'Auto-scroll',
    clearFilters: 'Clear Filters',
    noLogs: 'No logs yet',
    showing: 'Showing {count} of {total}',
    copy: 'Copy',
    data: 'Data',
    stackTrace: 'Stack Trace',
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

describe('LogPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOpen = false;
  });

  it('registers keyboard shortcut', () => {
    renderWithProviders(<LogPanel />);
    
    act(() => {
      fireEvent.keyDown(window, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });
    });
    
    expect(mockToggle).toHaveBeenCalled();
  });

  it('supports custom keyboard shortcut', () => {
    renderWithProviders(<LogPanel shortcut="ctrl+alt+l" />);
    
    act(() => {
      fireEvent.keyDown(window, {
        key: 'l',
        ctrlKey: true,
        altKey: true,
        shiftKey: false,
      });
    });
    
    expect(mockToggle).toHaveBeenCalled();
  });

  it('does not toggle on wrong shortcut', () => {
    renderWithProviders(<LogPanel />);
    
    act(() => {
      fireEvent.keyDown(window, {
        key: 'l',
        ctrlKey: false,
        shiftKey: false,
      });
    });
    
    expect(mockToggle).not.toHaveBeenCalled();
  });
});

describe('LogPanelTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button', () => {
    renderWithProviders(<LogPanelTrigger />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens log panel on click', () => {
    renderWithProviders(<LogPanelTrigger />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOpen).toHaveBeenCalled();
  });

  it('shows title text', () => {
    renderWithProviders(<LogPanelTrigger />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });
});
