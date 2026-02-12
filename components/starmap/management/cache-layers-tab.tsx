'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useOfflineStore, formatBytes, STELLARIUM_LAYERS, offlineCacheManager } from '@/lib/offline';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cache-layers-tab');

interface CacheLayersTabProps {
  onStorageChanged: () => void;
}

export function CacheLayersTab({ onStorageChanged }: CacheLayersTabProps) {
  const t = useTranslations();
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [repairingLayers, setRepairingLayers] = useState<string[]>([]);

  const {
    isOnline,
    layerStatuses,
    isDownloading,
    currentDownloads,
    refreshStatuses,
    downloadLayer,
    downloadSelectedLayers,
    clearLayer,
  } = useOfflineStore();

  const toggleLayerSelection = (layerId: string) => {
    setSelectedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const handleDownloadSelected = async () => {
    if (selectedLayers.size > 0) {
      await downloadSelectedLayers(Array.from(selectedLayers));
      setSelectedLayers(new Set());
    }
  };

  const handleRepairLayer = useCallback(async (layerId: string) => {
    if (repairingLayers.includes(layerId)) return;

    setRepairingLayers(prev => [...prev, layerId]);
    toast.loading(t('cache.repairing'), { id: `repair-${layerId}` });

    try {
      const result = await offlineCacheManager.verifyAndRepairLayer(layerId);
      toast.dismiss(`repair-${layerId}`);

      if (result.verified) {
        toast.success(t('cache.repairComplete'), {
          description: result.repaired > 0
            ? t('cache.filesRecovered', { count: result.repaired })
            : t('cache.cacheComplete'),
        });
      } else {
        toast.error(t('cache.repairFailed'), {
          description: t('cache.filesNotRecovered', { count: result.failed }),
        });
      }

      await refreshStatuses();
      onStorageChanged();
    } catch (error) {
      toast.dismiss(`repair-${layerId}`);
      toast.error(t('cache.repairFailed'));
      logger.error('Error repairing layer', error);
    } finally {
      setRepairingLayers(prev => prev.filter(id => id !== layerId));
    }
  }, [repairingLayers, t, refreshStatuses, onStorageChanged]);

  return (
    <>
      <ScrollArea className="h-[240px]">
        <div className="space-y-2 pr-2">
          {STELLARIUM_LAYERS.map((layer) => {
            const status = layerStatuses.find((s) => s.layerId === layer.id);
            const download = currentDownloads[layer.id];
            const isCached = status?.cached ?? false;
            const isComplete = status?.isComplete ?? false;
            const isRepairing = repairingLayers.includes(layer.id);
            const hasPartialCache = status && status.cachedFiles > 0 && !isComplete;
            const isSelected = selectedLayers.has(layer.id);
            const progress = download
              ? (download.downloadedFiles / download.totalFiles) * 100
              : isCached
              ? 100
              : status
              ? (status.cachedFiles / status.totalFiles) * 100
              : 0;

            return (
              <div
                key={layer.id}
                className={cn(
                  'p-2 rounded-lg border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : hasPartialCache
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleLayerSelection(layer.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{layer.name}</span>
                      {isComplete ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : hasPartialCache ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('cache.incompleteDetails', { cached: status?.cachedFiles ?? 0, total: status?.totalFiles ?? 0 })}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {layer.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {status && status.cachedFiles > 0
                        ? `${formatBytes(status.cachedBytes)} / ${formatBytes(layer.size)}`
                        : formatBytes(layer.size)
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {download ? (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {progress.toFixed(0)}%
                      </Badge>
                    ) : isRepairing ? (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {t('cache.repairing')}
                      </Badge>
                    ) : hasPartialCache ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-yellow-500 hover:text-yellow-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRepairLayer(layer.id);
                              }}
                              disabled={!isOnline}
                            >
                              <Wrench className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('cache.repair')}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearLayer(layer.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : isComplete ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearLayer(layer.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadLayer(layer.id, false);
                        }}
                        disabled={!isOnline || isDownloading}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {(download || hasPartialCache) && (
                  <Progress value={progress} className="h-1 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {selectedLayers.size > 0 && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {t('cache.selected', { count: selectedLayers.size })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLayers(new Set())}
            >
              {t('common.clear')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadSelected}
              disabled={!isOnline || isDownloading}
            >
              <Download className="h-3 w-3 mr-1" />
              {t('common.download')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
