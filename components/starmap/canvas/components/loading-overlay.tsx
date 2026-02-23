'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/common/spinner';
import type { LoadingState } from '@/types/stellarium-canvas';

const SLOW_LOADING_THRESHOLD = 15;

interface LoadingOverlayProps {
  loadingState: LoadingState;
  onRetry: () => void;
}

/**
 * Loading overlay component for Stellarium canvas
 * Shows loading spinner, status message, and retry button on error
 */
export function LoadingOverlay({ loadingState, onRetry }: LoadingOverlayProps) {
  const t = useTranslations('canvas');
  const { isLoading, loadingStatus, errorMessage, startTime } = loadingState;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading || !startTime) {
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
      setElapsed(0);
    };
  }, [isLoading, startTime]);

  // Don't render if not loading and no error
  if (!isLoading && !errorMessage) {
    return null;
  }

  const isSlow = isLoading && !errorMessage && elapsed >= SLOW_LOADING_THRESHOLD;

  return (
    <div
      data-testid="stellarium-loading-overlay"
      role={errorMessage ? 'alert' : 'status'}
      aria-live="polite"
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-4 text-center"
    >
      {isLoading && !errorMessage && (
        <Spinner className="h-8 w-8 text-primary mb-4" />
      )}
      <p className="text-muted-foreground text-sm mb-2">{loadingStatus}</p>
      {isLoading && !errorMessage && elapsed >= 10 && (
        <p className="text-muted-foreground/60 text-xs mb-1 tabular-nums">
          {t('elapsedTime', { seconds: elapsed })}
        </p>
      )}
      {isSlow && (
        <div className="mt-2 flex flex-col items-center gap-2">
          <p className="text-yellow-500/80 text-xs">{t('loadingSlowHint')}</p>
          <button
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            onClick={onRetry}
          >
            {t('retry')}
          </button>
        </div>
      )}
      {errorMessage && (
        <>
          <p className="text-destructive text-xs mb-3">{errorMessage}</p>
          <button
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            onClick={onRetry}
          >
            {t('retry')}
          </button>
        </>
      )}
    </div>
  );
}
