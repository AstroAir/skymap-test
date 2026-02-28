/**
 * Tests for log-store.ts
 * Log store reactive state management
 */

import { act } from '@testing-library/react';
import { useLogStore, useLogPanel, useLogStats } from '../log-store';
import { renderHook } from '@testing-library/react';

// Mock the logger module
jest.mock('@/lib/logger', () => ({
  getLogs: jest.fn((): unknown[] => []),
  getFilteredLogs: jest.fn((): unknown[] => []),
  clearLogs: jest.fn(),
  setLogLevel: jest.fn(),
  getLogLevel: jest.fn(() => 'info'),
  onLogsChanged: jest.fn(() => jest.fn()),
  getUniqueModules: jest.fn((): string[] => []),
  getLogStats: jest.fn(() => ({
    total: 0,
    byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
    byModule: {},
  })),
  exportLogsAsText: jest.fn(() => 'text logs'),
  exportLogsAsJson: jest.fn(() => '{"logs":[]}'),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockLogger = require('@/lib/logger') as Record<string, jest.Mock>;

function resetLogStore() {
  useLogStore.setState({
    logs: [],
    totalCount: 0,
    filter: { level: undefined, module: undefined, search: undefined, limit: 500 },
    level: 'info' as never,
    modules: [],
    stats: { total: 0, byLevel: { debug: 0, info: 0, warn: 0, error: 0 }, byModule: {} },
    isPanelOpen: false,
    autoScroll: true,
  });
}

describe('useLogStore', () => {
  beforeEach(() => {
    resetLogStore();
    jest.clearAllMocks();
  });

  it('should have initial state', () => {
    const state = useLogStore.getState();
    expect(state.logs).toEqual([]);
    expect(state.isPanelOpen).toBe(false);
    expect(state.autoScroll).toBe(true);
    expect(state.filter.limit).toBe(500);
  });

  describe('filter actions', () => {
    it('should set filter', () => {
      act(() => { useLogStore.getState().setFilter({ module: 'test' }); });
      expect(useLogStore.getState().filter.module).toBe('test');
    });

    it('should merge filters incrementally', () => {
      act(() => {
        useLogStore.getState().setFilter({ module: 'test' });
        useLogStore.getState().setFilter({ search: 'err' });
      });
      expect(useLogStore.getState().filter.module).toBe('test');
      expect(useLogStore.getState().filter.search).toBe('err');
    });

    it('should clear filter', () => {
      act(() => {
        useLogStore.getState().setFilter({ module: 'test' });
        useLogStore.getState().clearFilter();
      });
      expect(useLogStore.getState().filter.module).toBeUndefined();
      expect(useLogStore.getState().filter.limit).toBe(500);
    });
  });

  describe('refresh', () => {
    it('should populate logs, modules, stats from logger', () => {
      const fakeLogs = [
        { level: 'info', module: 'app', message: 'hello', timestamp: Date.now() },
      ];
      mockLogger.getLogs.mockReturnValue(fakeLogs);
      mockLogger.getUniqueModules.mockReturnValue(['app']);
      mockLogger.getLogStats.mockReturnValue({
        total: 1,
        byLevel: { debug: 0, info: 1, warn: 0, error: 0 },
        byModule: { app: 1 },
      });

      act(() => { useLogStore.getState().refresh(); });

      const s = useLogStore.getState();
      expect(s.totalCount).toBe(1);
      expect(s.modules).toEqual(['app']);
      expect(s.stats.total).toBe(1);
    });

    it('should apply filters when filter is set', () => {
      mockLogger.getLogs.mockReturnValue([{ level: 'info', module: 'a', message: 'x', timestamp: 0 }]);
      mockLogger.getFilteredLogs.mockReturnValue([]);

      act(() => {
        useLogStore.getState().setFilter({ module: 'b' });
      });

      expect(mockLogger.getFilteredLogs).toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    it('should call setLogLevel and update state', () => {
      act(() => { useLogStore.getState().setLevel('debug' as never); });
      expect(mockLogger.setLogLevel).toHaveBeenCalledWith('debug');
      expect(useLogStore.getState().level).toBe('debug');
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs and reset stats', () => {
      useLogStore.setState({ totalCount: 5, logs: [{ level: 'info' }] as never[] });
      act(() => { useLogStore.getState().clearLogs(); });
      expect(mockLogger.clearLogs).toHaveBeenCalled();
      const s = useLogStore.getState();
      expect(s.logs).toEqual([]);
      expect(s.totalCount).toBe(0);
      expect(s.stats.total).toBe(0);
    });
  });

  describe('exportAsText / exportAsJson', () => {
    it('should call exportLogsAsText', () => {
      mockLogger.getLogs.mockReturnValue([]);
      const result = useLogStore.getState().exportAsText();
      expect(result).toBe('text logs');
      expect(mockLogger.exportLogsAsText).toHaveBeenCalled();
    });

    it('should call exportLogsAsJson', () => {
      mockLogger.getLogs.mockReturnValue([]);
      const result = useLogStore.getState().exportAsJson();
      expect(result).toBe('{"logs":[]}');
      expect(mockLogger.exportLogsAsJson).toHaveBeenCalled();
    });
  });

  describe('panel actions', () => {
    it('should open panel and refresh', () => {
      act(() => { useLogStore.getState().openPanel(); });
      expect(useLogStore.getState().isPanelOpen).toBe(true);
    });

    it('should close panel', () => {
      act(() => {
        useLogStore.getState().openPanel();
        useLogStore.getState().closePanel();
      });
      expect(useLogStore.getState().isPanelOpen).toBe(false);
    });

    it('should toggle panel open and refresh', () => {
      act(() => { useLogStore.getState().togglePanel(); });
      expect(useLogStore.getState().isPanelOpen).toBe(true);
    });

    it('should toggle panel closed without refresh', () => {
      act(() => { useLogStore.setState({ isPanelOpen: true }); });
      const callsBefore = mockLogger.getLogs.mock.calls.length;
      act(() => { useLogStore.getState().togglePanel(); });
      expect(useLogStore.getState().isPanelOpen).toBe(false);
      // When closing, refresh should NOT be called
      expect(mockLogger.getLogs.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('setAutoScroll', () => {
    it('should update autoScroll', () => {
      act(() => { useLogStore.getState().setAutoScroll(false); });
      expect(useLogStore.getState().autoScroll).toBe(false);
      act(() => { useLogStore.getState().setAutoScroll(true); });
      expect(useLogStore.getState().autoScroll).toBe(true);
    });
  });

  describe('downloadLogs', () => {
    it('should create a download link for text format (browser fallback)', async () => {
      mockLogger.getLogs.mockReturnValue([]);
      const createObjectURL = jest.fn(() => 'blob:url');
      const revokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockLink = { href: '', download: '', click: mockClick };

      Object.defineProperty(global, 'URL', {
        value: { createObjectURL, revokeObjectURL },
        writable: true,
      });
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);

      await act(async () => {
        await useLogStore.getState().downloadLogs('text');
      });

      expect(mockClick).toHaveBeenCalled();
      expect(mockLink.download).toContain('skymap-logs-');
      expect(mockLink.download).toContain('.txt');

      jest.restoreAllMocks();
    });
  });
});

describe('useLogPanel', () => {
  beforeEach(() => resetLogStore());

  it('should expose panel state and actions', () => {
    const { result } = renderHook(() => useLogPanel());
    expect(result.current.isOpen).toBe(false);
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(typeof result.current.toggle).toBe('function');
  });
});

describe('useLogStats', () => {
  beforeEach(() => resetLogStore());

  it('should expose stats and totalCount', () => {
    const { result } = renderHook(() => useLogStats());
    expect(result.current.stats).toBeDefined();
    expect(result.current.totalCount).toBe(0);
  });
});
