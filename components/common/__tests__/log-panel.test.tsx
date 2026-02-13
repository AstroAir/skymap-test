/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LogPanel, LogPanelTrigger } from '../log-panel';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock @tanstack/react-virtual for JSDOM (no layout engine)
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 40,
        size: 40,
        key: i,
      })),
    getTotalSize: () => count * 40,
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}));

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
  LOG_LEVEL_NAMES: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },
  formatTimestamp: (ts: Date) => ts.toLocaleTimeString(),
  serializeData: (data: unknown) => JSON.stringify(data, null, 2),
  formatLogEntryToText: (entry: { message: string }) => entry.message,
  groupConsecutiveLogs: (logs: unknown[]) => logs.map((e) => ({ entry: e, count: 1, timestamps: [] })),
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
    pause: 'Pause',
    resume: 'Resume',
    pausedNewLogs: '{count} new logs while paused',
    scrollToBottom: 'Bottom',
    timeRange: 'Time Range',
    last5min: '5 min',
    last15min: '15 min',
    last1hr: '1 hour',
    allTime: 'All',
    groupDuplicates: 'Group duplicates',
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
