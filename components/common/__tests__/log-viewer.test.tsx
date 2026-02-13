/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LogViewer } from '../log-viewer';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LogLevel } from '@/lib/logger';

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
const mockSetFilter = jest.fn();
const mockClearFilter = jest.fn();
const mockClearLogs = jest.fn();
const mockDownloadLogs = jest.fn();
const mockRefresh = jest.fn();
const mockSetAutoScroll = jest.fn();

let mockLogs: Array<{
  id: string;
  level: number;
  module: string;
  message: string;
  timestamp: Date;
  data?: unknown;
  stack?: string;
}> = [];

jest.mock('@/lib/stores/log-store', () => ({
  useLogStore: () => ({
    logs: mockLogs,
    totalCount: mockLogs.length,
    filter: { search: undefined, level: undefined, module: undefined },
    modules: ['App', 'Network'],
    stats: {
      byLevel: { debug: 0, info: 1, warn: 0, error: 0 },
      total: 1,
    },
    autoScroll: true,
    setFilter: mockSetFilter,
    clearFilter: mockClearFilter,
    clearLogs: mockClearLogs,
    downloadLogs: mockDownloadLogs,
    refresh: mockRefresh,
    setAutoScroll: mockSetAutoScroll,
  }),
}));

jest.mock('@/lib/logger', () => ({
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
  LOG_LEVEL_NAMES: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },
  formatTimestamp: (ts: Date) => ts.toLocaleTimeString(),
  serializeData: (data: unknown) => JSON.stringify(data, null, 2),
  formatLogEntryToText: (entry: { message: string }) => entry.message,
  groupConsecutiveLogs: (logs: Array<{ id: string; module: string; message: string; timestamp: Date }>) => {
    if (logs.length === 0) return [];
    const groups: Array<{ entry: typeof logs[0]; count: number; timestamps: Date[] }> = [];
    let cur = { entry: logs[0], count: 1, timestamps: [logs[0].timestamp] };
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].module === cur.entry.module && logs[i].message === cur.entry.message) {
        cur.count++;
        cur.timestamps.push(logs[i].timestamp);
      } else {
        groups.push(cur);
        cur = { entry: logs[i], count: 1, timestamps: [logs[i].timestamp] };
      }
    }
    groups.push(cur);
    return groups;
  },
}));

const messages = {
  logViewer: {
    title: 'Log Viewer',
    description: 'View application logs',
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
    errors: 'errors',
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

describe('LogViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogs = [];
  });

  it('renders empty state when no logs', () => {
    renderWithProviders(<LogViewer />);
    expect(screen.getByText('noLogs')).toBeInTheDocument();
  });

  it('calls refresh on mount', () => {
    renderWithProviders(<LogViewer />);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders log entries', () => {
    mockLogs = [
      {
        id: '1',
        level: LogLevel.INFO,
        module: 'App',
        message: 'Application started',
        timestamp: new Date(),
      },
    ];
    renderWithProviders(<LogViewer />);
    expect(screen.getByText('Application started')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
  });

  it('renders toolbar when showToolbar is true', () => {
    renderWithProviders(<LogViewer showToolbar />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('hides toolbar when showToolbar is false', () => {
    renderWithProviders(<LogViewer showToolbar={false} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('debounces search input', () => {
    jest.useFakeTimers();
    renderWithProviders(<LogViewer />);
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Should not be called immediately
    expect(mockSetFilter).not.toHaveBeenCalled();
    
    // Should be called after debounce
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(mockSetFilter).toHaveBeenCalledWith({ search: 'test' });
    jest.useRealTimers();
  });

  it('renders stats bar when showStats is true', () => {
    renderWithProviders(<LogViewer showStats />);
    // Stats bar renders count info
    const { container } = renderWithProviders(<LogViewer showStats />);
    const statsElements = container.querySelectorAll('.text-muted-foreground');
    expect(statsElements.length).toBeGreaterThan(0);
  });

  it('hides stats bar when showStats is false', () => {
    renderWithProviders(<LogViewer showStats={false} />);
    // Without stats bar, the 'showing' key text should not appear
    expect(screen.queryByText(/showing/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(<LogViewer className="custom-log" />);
    expect(container.firstChild).toHaveClass('custom-log');
  });

  it('renders expandable log entry with data', () => {
    mockLogs = [
      {
        id: '1',
        level: LogLevel.INFO,
        module: 'App',
        message: 'Test message',
        timestamp: new Date(),
        data: { key: 'value' },
      },
    ];
    const { container } = renderWithProviders(<LogViewer />);
    
    // Should have the expandable row with aria-expanded
    const expandableRow = container.querySelector('[aria-expanded]');
    expect(expandableRow).toBeInTheDocument();
    expect(expandableRow).toHaveAttribute('aria-expanded', 'false');
    
    // Click on the inner div (first child) which has the onClick handler
    const clickableDiv = expandableRow!.firstElementChild!;
    fireEvent.click(clickableDiv);
    // After click, aria-expanded should be true
    expect(expandableRow).toHaveAttribute('aria-expanded', 'true');
  });
});
