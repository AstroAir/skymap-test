'use client';

import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/common/spinner';
import type { LoadingState } from '@/types/stellarium-canvas';

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
  const { isLoading, loadingStatus, errorMessage } = loadingState;

  // Don't render if not loading and no error
  if (!isLoading && !errorMessage) {
    return null;
  }

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
