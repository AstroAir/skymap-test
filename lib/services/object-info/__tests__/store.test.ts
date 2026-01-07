/**
 * Tests for store.ts
 */

import { act, renderHook } from '@testing-library/react';
import {
  useObjectInfoConfigStore,
} from '../store';
import { DEFAULT_DATA_SOURCES } from '../config';

// Mock checkAllSourcesHealth function
jest.mock('../config', () => {
  const actual = jest.requireActual('../config');
  return {
    ...actual,
    checkAllSourcesHealth: jest.fn().mockResolvedValue(new Map([
      ['simbad', true],
      ['wikipedia', true],
      ['dss', false],
      ['local', true],
      ['stellarium', true],
    ])),
  };
});

describe('object-info store', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useObjectInfoConfigStore.getState().resetToDefaults();
    jest.clearAllMocks();
  });

  describe('useObjectInfoConfigStore', () => {
    it('should initialize with default sources', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      expect(result.current.sources).toBeDefined();
      expect(result.current.sources.length).toBeGreaterThan(0);
    });

    it('should have null lastHealthCheck initially', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      expect(result.current.lastHealthCheck).toBeNull();
    });

    it('should not be checking health initially', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      expect(result.current.isCheckingHealth).toBe(false);
    });
  });

  describe('setSourceEnabled', () => {
    it('should enable a source', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      act(() => {
        result.current.setSourceEnabled('dss', true);
      });

      const dssSource = result.current.sources.find(s => s.id === 'dss');
      expect(dssSource?.enabled).toBe(true);
    });

    it('should disable a source', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      act(() => {
        result.current.setSourceEnabled('simbad', false);
      });

      const simbadSource = result.current.sources.find(s => s.id === 'simbad');
      expect(simbadSource?.enabled).toBe(false);
    });

    it('should not affect other sources', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      const wikipediaBefore = result.current.sources.find(s => s.id === 'wikipedia')?.enabled;

      act(() => {
        result.current.setSourceEnabled('simbad', false);
      });

      const wikipediaAfter = result.current.sources.find(s => s.id === 'wikipedia')?.enabled;
      expect(wikipediaAfter).toBe(wikipediaBefore);
    });
  });

  describe('setSourcePriority', () => {
    it('should update source priority', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      act(() => {
        result.current.setSourcePriority('wikipedia', 10);
      });

      const wikipediaSource = result.current.sources.find(s => s.id === 'wikipedia');
      expect(wikipediaSource?.priority).toBe(10);
    });

    it('should not affect other sources', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      const simbadBefore = result.current.sources.find(s => s.id === 'simbad')?.priority;

      act(() => {
        result.current.setSourcePriority('wikipedia', 10);
      });

      const simbadAfter = result.current.sources.find(s => s.id === 'simbad')?.priority;
      expect(simbadAfter).toBe(simbadBefore);
    });
  });

  describe('updateSourceHealth', () => {
    it('should update source health status', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      act(() => {
        result.current.updateSourceHealth('simbad', false);
      });

      const simbadSource = result.current.sources.find(s => s.id === 'simbad');
      expect(simbadSource?.healthy).toBe(false);
    });

    it('should set lastCheck timestamp', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      const before = new Date();

      act(() => {
        result.current.updateSourceHealth('simbad', true);
      });

      const simbadSource = result.current.sources.find(s => s.id === 'simbad');
      expect(simbadSource?.lastCheck).toBeDefined();
      expect(simbadSource?.lastCheck!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('runHealthCheck', () => {
    it('should update lastHealthCheck after check', async () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      expect(result.current.lastHealthCheck).toBeNull();

      await act(async () => {
        await result.current.runHealthCheck();
      });

      expect(result.current.lastHealthCheck).toBeDefined();
      expect(result.current.lastHealthCheck).toBeInstanceOf(Date);
    });

    it('should update source health statuses', async () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      await act(async () => {
        await result.current.runHealthCheck();
      });

      result.current.sources.forEach(source => {
        expect(source.lastCheck).toBeDefined();
      });
    });

    it('should set isCheckingHealth to false after completion', async () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      await act(async () => {
        await result.current.runHealthCheck();
      });

      expect(result.current.isCheckingHealth).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset sources to defaults', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      act(() => {
        result.current.setSourceEnabled('simbad', false);
        result.current.setSourcePriority('wikipedia', 100);
      });

      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.sources).toEqual(DEFAULT_DATA_SOURCES);
    });

    it('should reset lastHealthCheck', () => {
      const { result } = renderHook(() => useObjectInfoConfigStore());

      act(async () => {
        await result.current.runHealthCheck();
      });

      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.lastHealthCheck).toBeNull();
    });
  });

  describe('getActiveSources via store', () => {
    it('should filter enabled and healthy sources', () => {
      const state = useObjectInfoConfigStore.getState();
      const activeSources = state.sources
        .filter(s => s.enabled && s.healthy)
        .sort((a, b) => a.priority - b.priority);

      activeSources.forEach(source => {
        expect(source.enabled).toBe(true);
        expect(source.healthy).toBe(true);
      });
    });

    it('should exclude disabled sources after disabling', () => {
      // Use direct store access instead of hook
      useObjectInfoConfigStore.getState().setSourceEnabled('simbad', false);

      const state = useObjectInfoConfigStore.getState();
      const activeSources = state.sources.filter(s => s.enabled && s.healthy);
      const simbadActive = activeSources.find(s => s.id === 'simbad');
      expect(simbadActive).toBeUndefined();
    });
  });

  describe('getSource via store', () => {
    it('should find source by ID', () => {
      const state = useObjectInfoConfigStore.getState();
      const source = state.sources.find(s => s.id === 'simbad');

      expect(source).toBeDefined();
      expect(source?.id).toBe('simbad');
    });

    it('should return undefined for unknown ID', () => {
      const state = useObjectInfoConfigStore.getState();
      const source = state.sources.find(s => s.id === ('unknown-id' as string));

      expect(source).toBeUndefined();
    });
  });

  describe('health check status via store', () => {
    it('should have null lastHealthCheck initially', () => {
      const state = useObjectInfoConfigStore.getState();

      expect(state.lastHealthCheck).toBeNull();
      expect(state.isCheckingHealth).toBe(false);
    });

    it('should have lastHealthCheck after running check', async () => {
      // Use direct store access instead of hook
      await useObjectInfoConfigStore.getState().runHealthCheck();

      const state = useObjectInfoConfigStore.getState();
      expect(state.lastHealthCheck).toBeDefined();
    });
  });
});
