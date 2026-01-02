import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UpdateStatus,
  UpdateInfo,
  UpdateProgress,
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  downloadAndInstallUpdate,
  getCurrentVersion,
  clearPendingUpdate,
  onUpdateProgress,
  isUpdateAvailable,
  isUpdateReady,
  isUpdateDownloading,
  isUpdateError,
} from './updater-api';

export interface UseUpdaterOptions {
  autoCheck?: boolean;
  checkInterval?: number;
  onUpdateAvailable?: (info: UpdateInfo) => void;
  onUpdateReady?: (info: UpdateInfo) => void;
  onError?: (error: string) => void;
}

export interface UseUpdaterReturn {
  status: UpdateStatus;
  currentVersion: string | null;
  isChecking: boolean;
  isDownloading: boolean;
  isReady: boolean;
  hasUpdate: boolean;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  checkForUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  dismissUpdate: () => void;
}

export function useUpdater(options: UseUpdaterOptions = {}): UseUpdaterReturn {
  const {
    autoCheck = false,
    checkInterval = 3600000,
    onUpdateAvailable,
    onUpdateReady,
    onError,
  } = options;

  const [status, setStatus] = useState<UpdateStatus>({ status: 'idle' });
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isChecking = status.status === 'checking';
  const isDownloading = status.status === 'downloading';
  const isReady = status.status === 'ready';
  const hasUpdate = status.status === 'available' || status.status === 'ready';

  const updateInfo: UpdateInfo | null =
    isUpdateAvailable(status) || isUpdateReady(status) ? status.data : null;

  const progress: UpdateProgress | null =
    isUpdateDownloading(status) ? status.data : null;

  const error: string | null = isUpdateError(status) ? status.data : null;

  useEffect(() => {
    getCurrentVersion()
      .then(setCurrentVersion)
      .catch(console.error);

    const setupListener = async () => {
      unlistenRef.current = await onUpdateProgress((newStatus) => {
        setStatus(newStatus);
      });
    };

    setupListener();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (isUpdateAvailable(status) && onUpdateAvailable) {
      onUpdateAvailable(status.data);
    }
    if (isUpdateReady(status) && onUpdateReady) {
      onUpdateReady(status.data);
    }
    if (isUpdateError(status) && onError) {
      onError(status.data);
    }
  }, [status, onUpdateAvailable, onUpdateReady, onError]);

  const handleCheckForUpdate = useCallback(async () => {
    setStatus({ status: 'checking' });
    const result = await checkForUpdate();
    setStatus(result);
  }, []);

  useEffect(() => {
    if (!autoCheck) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const doCheck = async () => {
      if (!mounted) return;
      setStatus({ status: 'checking' });
      const result = await checkForUpdate();
      if (mounted) {
        setStatus(result);
      }
    };

    timeoutId = setTimeout(doCheck, 0);

    checkIntervalRef.current = setInterval(() => {
      if (mounted) doCheck();
    }, checkInterval);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [autoCheck, checkInterval]);

  const handleDownloadUpdate = useCallback(async () => {
    if (!hasUpdate) return;
    setStatus({ status: 'downloading', data: { downloaded: 0, total: null, percent: 0 } });
    const result = await downloadUpdate();
    setStatus(result);
  }, [hasUpdate]);

  const handleInstallUpdate = useCallback(async () => {
    if (!isReady) return;
    try {
      await installUpdate();
    } catch (err) {
      setStatus({
        status: 'error',
        data: err instanceof Error ? err.message : String(err),
      });
    }
  }, [isReady]);

  const handleDownloadAndInstall = useCallback(async () => {
    if (!hasUpdate) return;
    setStatus({ status: 'downloading', data: { downloaded: 0, total: null, percent: 0 } });
    try {
      await downloadAndInstallUpdate();
    } catch (err) {
      setStatus({
        status: 'error',
        data: err instanceof Error ? err.message : String(err),
      });
    }
  }, [hasUpdate]);

  const dismissUpdate = useCallback(() => {
    clearPendingUpdate();
    setStatus({ status: 'idle' });
  }, []);

  return {
    status,
    currentVersion,
    isChecking,
    isDownloading,
    isReady,
    hasUpdate,
    updateInfo,
    progress,
    error,
    checkForUpdate: handleCheckForUpdate,
    downloadUpdate: handleDownloadUpdate,
    installUpdate: handleInstallUpdate,
    downloadAndInstall: handleDownloadAndInstall,
    dismissUpdate,
  };
}

export function useAutoUpdater(options: Omit<UseUpdaterOptions, 'autoCheck'> = {}) {
  return useUpdater({ ...options, autoCheck: true });
}
