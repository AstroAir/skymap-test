/**
 * @jest-environment jsdom
 */

import {
  useUpdaterStore,
  selectIsChecking,
  selectIsDownloading,
  selectIsReady,
  selectHasUpdate,
  selectUpdateInfo,
  selectProgress,
  selectError,
  type UpdaterStore,
} from '../updater-store';

describe('updater-store', () => {
  beforeEach(() => {
    useUpdaterStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have idle status', () => {
      const state = useUpdaterStore.getState();
      expect(state.status).toEqual({ status: 'idle' });
    });

    it('should have null currentVersion', () => {
      expect(useUpdaterStore.getState().currentVersion).toBeNull();
    });

    it('should have null lastChecked', () => {
      expect(useUpdaterStore.getState().lastChecked).toBeNull();
    });

    it('should have null skippedVersion', () => {
      expect(useUpdaterStore.getState().skippedVersion).toBeNull();
    });

    it('should have null downloadSpeed', () => {
      expect(useUpdaterStore.getState().downloadSpeed).toBeNull();
    });

    it('should have null estimatedTimeRemaining', () => {
      expect(useUpdaterStore.getState().estimatedTimeRemaining).toBeNull();
    });
  });

  describe('actions', () => {
    describe('setStatus', () => {
      it('should set status to checking', () => {
        useUpdaterStore.getState().setStatus({ status: 'checking' });
        expect(useUpdaterStore.getState().status).toEqual({ status: 'checking' });
      });

      it('should set status to available with data', () => {
        const info = { version: '1.0.1', current_version: '1.0.0', date: null, body: 'Fix bugs' };
        useUpdaterStore.getState().setStatus({ status: 'available', data: info });
        expect(useUpdaterStore.getState().status).toEqual({ status: 'available', data: info });
      });

      it('should set status to downloading with progress', () => {
        const progress = { downloaded: 500, total: 1000, percent: 50 };
        useUpdaterStore.getState().setStatus({ status: 'downloading', data: progress });
        expect(useUpdaterStore.getState().status).toEqual({ status: 'downloading', data: progress });
      });

      it('should set status to ready with data', () => {
        const info = { version: '1.0.1', current_version: '1.0.0', date: null, body: null };
        useUpdaterStore.getState().setStatus({ status: 'ready', data: info });
        expect(useUpdaterStore.getState().status).toEqual({ status: 'ready', data: info });
      });

      it('should set status to error with message', () => {
        useUpdaterStore.getState().setStatus({ status: 'error', data: 'Network error' });
        expect(useUpdaterStore.getState().status).toEqual({ status: 'error', data: 'Network error' });
      });

      it('should set status to not_available', () => {
        useUpdaterStore.getState().setStatus({ status: 'not_available' });
        expect(useUpdaterStore.getState().status).toEqual({ status: 'not_available' });
      });
    });

    describe('setCurrentVersion', () => {
      it('should set current version', () => {
        useUpdaterStore.getState().setCurrentVersion('2.0.0');
        expect(useUpdaterStore.getState().currentVersion).toBe('2.0.0');
      });
    });

    describe('setLastChecked', () => {
      it('should set last checked timestamp', () => {
        const now = Date.now();
        useUpdaterStore.getState().setLastChecked(now);
        expect(useUpdaterStore.getState().lastChecked).toBe(now);
      });
    });

    describe('setSkippedVersion', () => {
      it('should set skipped version', () => {
        useUpdaterStore.getState().setSkippedVersion('1.0.1');
        expect(useUpdaterStore.getState().skippedVersion).toBe('1.0.1');
      });

      it('should clear skipped version with null', () => {
        useUpdaterStore.getState().setSkippedVersion('1.0.1');
        useUpdaterStore.getState().setSkippedVersion(null);
        expect(useUpdaterStore.getState().skippedVersion).toBeNull();
      });
    });

    describe('setDownloadMetrics', () => {
      it('should set download speed and ETA', () => {
        useUpdaterStore.getState().setDownloadMetrics(1024000, 30);
        expect(useUpdaterStore.getState().downloadSpeed).toBe(1024000);
        expect(useUpdaterStore.getState().estimatedTimeRemaining).toBe(30);
      });

      it('should clear metrics with null values', () => {
        useUpdaterStore.getState().setDownloadMetrics(1024000, 30);
        useUpdaterStore.getState().setDownloadMetrics(null, null);
        expect(useUpdaterStore.getState().downloadSpeed).toBeNull();
        expect(useUpdaterStore.getState().estimatedTimeRemaining).toBeNull();
      });
    });

    describe('reset', () => {
      it('should reset all state to initial values', () => {
        // Set various state
        useUpdaterStore.getState().setStatus({ status: 'error', data: 'fail' });
        useUpdaterStore.getState().setCurrentVersion('2.0.0');
        useUpdaterStore.getState().setLastChecked(123456);
        useUpdaterStore.getState().setSkippedVersion('1.0.1');
        useUpdaterStore.getState().setDownloadMetrics(500, 10);

        // Reset
        useUpdaterStore.getState().reset();

        const state = useUpdaterStore.getState();
        expect(state.status).toEqual({ status: 'idle' });
        expect(state.currentVersion).toBeNull();
        expect(state.lastChecked).toBeNull();
        expect(state.skippedVersion).toBeNull();
        expect(state.downloadSpeed).toBeNull();
        expect(state.estimatedTimeRemaining).toBeNull();
      });
    });
  });

  describe('selectors', () => {
    const makeState = (overrides: Partial<UpdaterStore>): UpdaterStore => ({
      status: { status: 'idle' },
      currentVersion: null,
      lastChecked: null,
      skippedVersion: null,
      downloadSpeed: null,
      estimatedTimeRemaining: null,
      setStatus: jest.fn(),
      setCurrentVersion: jest.fn(),
      setLastChecked: jest.fn(),
      setSkippedVersion: jest.fn(),
      setDownloadMetrics: jest.fn(),
      reset: jest.fn(),
      ...overrides,
    });

    describe('selectIsChecking', () => {
      it('should return true when checking', () => {
        expect(selectIsChecking(makeState({ status: { status: 'checking' } }))).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(selectIsChecking(makeState({ status: { status: 'idle' } }))).toBe(false);
        expect(selectIsChecking(makeState({ status: { status: 'not_available' } }))).toBe(false);
      });
    });

    describe('selectIsDownloading', () => {
      it('should return true when downloading', () => {
        const state = makeState({
          status: { status: 'downloading', data: { downloaded: 0, total: 100, percent: 0 } },
        });
        expect(selectIsDownloading(state)).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(selectIsDownloading(makeState({ status: { status: 'idle' } }))).toBe(false);
      });
    });

    describe('selectIsReady', () => {
      it('should return true when ready', () => {
        const state = makeState({
          status: { status: 'ready', data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null } },
        });
        expect(selectIsReady(state)).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(selectIsReady(makeState({ status: { status: 'idle' } }))).toBe(false);
        expect(selectIsReady(makeState({ status: { status: 'checking' } }))).toBe(false);
      });
    });

    describe('selectHasUpdate', () => {
      it('should return true for available status', () => {
        const state = makeState({
          status: { status: 'available', data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null } },
        });
        expect(selectHasUpdate(state)).toBe(true);
      });

      it('should return true for ready status', () => {
        const state = makeState({
          status: { status: 'ready', data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null } },
        });
        expect(selectHasUpdate(state)).toBe(true);
      });

      it('should return false for idle status', () => {
        expect(selectHasUpdate(makeState({ status: { status: 'idle' } }))).toBe(false);
      });

      it('should return false for not_available status', () => {
        expect(selectHasUpdate(makeState({ status: { status: 'not_available' } }))).toBe(false);
      });

      it('should return false for error status', () => {
        expect(selectHasUpdate(makeState({ status: { status: 'error', data: 'err' } }))).toBe(false);
      });
    });

    describe('selectUpdateInfo', () => {
      it('should return info when available', () => {
        const info = { version: '1.0.1', current_version: '1.0.0', date: '2024-01-01', body: 'notes' };
        const state = makeState({ status: { status: 'available', data: info } });
        expect(selectUpdateInfo(state)).toEqual(info);
      });

      it('should return info when ready', () => {
        const info = { version: '1.0.1', current_version: '1.0.0', date: null, body: null };
        const state = makeState({ status: { status: 'ready', data: info } });
        expect(selectUpdateInfo(state)).toEqual(info);
      });

      it('should return null for idle status', () => {
        expect(selectUpdateInfo(makeState({ status: { status: 'idle' } }))).toBeNull();
      });

      it('should return null for downloading status', () => {
        const state = makeState({
          status: { status: 'downloading', data: { downloaded: 0, total: 100, percent: 0 } },
        });
        expect(selectUpdateInfo(state)).toBeNull();
      });

      it('should return null for error status', () => {
        expect(selectUpdateInfo(makeState({ status: { status: 'error', data: 'err' } }))).toBeNull();
      });
    });

    describe('selectProgress', () => {
      it('should return progress when downloading', () => {
        const progress = { downloaded: 500, total: 1000, percent: 50 };
        const state = makeState({ status: { status: 'downloading', data: progress } });
        expect(selectProgress(state)).toEqual(progress);
      });

      it('should return null for non-downloading statuses', () => {
        expect(selectProgress(makeState({ status: { status: 'idle' } }))).toBeNull();
        expect(selectProgress(makeState({
          status: { status: 'available', data: { version: '1.0.1', current_version: '1.0.0', date: null, body: null } },
        }))).toBeNull();
      });
    });

    describe('selectError', () => {
      it('should return error message when error status', () => {
        const state = makeState({ status: { status: 'error', data: 'Network error' } });
        expect(selectError(state)).toBe('Network error');
      });

      it('should return null for non-error statuses', () => {
        expect(selectError(makeState({ status: { status: 'idle' } }))).toBeNull();
        expect(selectError(makeState({ status: { status: 'checking' } }))).toBeNull();
      });
    });
  });
});
