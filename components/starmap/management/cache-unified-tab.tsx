'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Trash2,
  Loader2,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { formatBytes } from '@/lib/offline';
import { unifiedCacheApi } from '@/lib/tauri';
import { isTauri } from '@/lib/storage/platform';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-unified-tab');

interface CacheUnifiedTabProps {
  isActive: boolean;
}

export function CacheUnifiedTab({ isActive }: CacheUnifiedTabProps) {
  const t = useTranslations();
  const [unifiedCacheStats, setUnifiedCacheStats] = useState<{ total_entries: number; total_size: number; hit_rate: number } | null>(null);
  const [unifiedCacheKeys, setUnifiedCacheKeys] = useState<string[]>([]);
  const [loadingUnified, setLoadingUnified] = useState(false);

  const refreshUnifiedCache = useCallback(async () => {
    if (!isTauri() || !unifiedCacheApi.isAvailable()) return;

    setLoadingUnified(true);
    try {
      const [stats, keys] = await Promise.all([
        unifiedCacheApi.getStats(),
        unifiedCacheApi.listKeys()
      ]);
      setUnifiedCacheStats(stats);
      setUnifiedCacheKeys(keys);
    } catch (error) {
      logger.error('Failed to load unified cache', error);
      toast.error(t('cache.loadFailed'));
    } finally {
      setLoadingUnified(false);
    }
  }, [t]);

  const handleClearUnifiedCache = useCallback(async () => {
    if (!isTauri() || !unifiedCacheApi.isAvailable()) return;

    try {
      const deletedCount = await unifiedCacheApi.clearCache();
      toast.success(t('cache.cleared'), {
        description: t('cache.entriesRemoved', { count: deletedCount })
      });
      await refreshUnifiedCache();
    } catch (error) {
      toast.error(t('cache.clearFailed'));
      logger.error('Failed to clear unified cache', error);
    }
  }, [t, refreshUnifiedCache]);

  const handleCleanupUnifiedCache = useCallback(async () => {
    if (!isTauri() || !unifiedCacheApi.isAvailable()) return;

    try {
      const deletedCount = await unifiedCacheApi.cleanup();
      toast.success(t('cache.cleanupComplete'), {
        description: t('cache.expiredEntriesRemoved', { count: deletedCount })
      });
      await refreshUnifiedCache();
    } catch (error) {
      toast.error(t('cache.cleanupFailed'));
      logger.error('Failed to cleanup unified cache', error);
    }
  }, [t, refreshUnifiedCache]);

  useEffect(() => {
    if (isActive && isTauri() && unifiedCacheApi.isAvailable()) {
      refreshUnifiedCache();
    }
  }, [isActive, refreshUnifiedCache]);

  return (
    <div className="space-y-3">
      {loadingUnified ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">{t('cache.loadingUnifiedCache')}</span>
        </div>
      ) : unifiedCacheStats ? (
        <>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-medium">{unifiedCacheStats.total_entries}</div>
              <div className="text-xs text-muted-foreground">{t('cache.entries')}</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-medium">{formatBytes(unifiedCacheStats.total_size)}</div>
              <div className="text-xs text-muted-foreground">{t('cache.size')}</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-medium">{(unifiedCacheStats.hit_rate * 100).toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{t('cache.hitRate')}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanupUnifiedCache}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {t('cache.cleanup')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  disabled={unifiedCacheStats.total_entries === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('cache.clearAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('cache.clearUnifiedCache')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('cache.clearUnifiedCacheDescription', {
                      count: unifiedCacheStats.total_entries,
                      size: formatBytes(unifiedCacheStats.total_size),
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearUnifiedCache}>
                    {t('cache.clearAll')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {unifiedCacheKeys.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                {t('cache.cachedItems')} ({unifiedCacheKeys.length})
              </h4>
              <ScrollArea className="h-[160px]">
                <div className="space-y-1 pr-2">
                  {unifiedCacheKeys.slice(0, 20).map((key) => (
                    <div
                      key={key}
                      className="text-xs p-2 bg-muted/30 rounded truncate"
                      title={key}
                    >
                      {key}
                    </div>
                  ))}
                  {unifiedCacheKeys.length > 20 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      {t('cache.moreItems', { count: unifiedCacheKeys.length - 20 })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t('cache.unifiedCacheEmpty')}
          </p>
        </div>
      )}
    </div>
  );
}
