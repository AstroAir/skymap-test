'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Trash2,
  Cloud,
  CloudOff,
  Check,
  Loader2,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useOfflineStore, formatBytes, STELLARIUM_LAYERS } from '@/lib/offline';
import { cn } from '@/lib/utils';

export function OfflineCacheManager() {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  
  const {
    isOnline,
    isInitialized,
    layerStatuses,
    isDownloading,
    currentDownloads,
    autoDownloadOnWifi,
    initialize,
    refreshStatuses,
    downloadLayer,
    downloadAllLayers,
    downloadSelectedLayers,
    cancelAllDownloads,
    clearLayer,
    clearAllCache,
    setAutoDownloadOnWifi,
  } = useOfflineStore();

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Toggle layer selection
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

  // Download selected layers
  const handleDownloadSelected = async () => {
    if (selectedLayers.size > 0) {
      await downloadSelectedLayers(Array.from(selectedLayers));
      setSelectedLayers(new Set());
    }
  };

  // Calculate total stats
  const totalSize = STELLARIUM_LAYERS.reduce((acc, l) => acc + l.size, 0);
  const cachedSize = layerStatuses.reduce((acc, s) => acc + s.cachedBytes, 0);
  const cachedLayers = layerStatuses.filter((s) => s.cached).length;
  const totalLayers = STELLARIUM_LAYERS.length;
  const overallProgress = totalSize > 0 ? (cachedSize / totalSize) * 100 : 0;

  return (
    <TooltipProvider>
      <Card className="bg-card/95 backdrop-blur-sm border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{t('cache.offlineCache')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="outline" className="text-green-500 border-green-500/50">
                  <Cloud className="h-3 w-3 mr-1" />
                  {t('common.online')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                  <CloudOff className="h-3 w-3 mr-1" />
                  {t('common.offline')}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => refreshStatuses()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            {cachedLayers}/{totalLayers} layers cached ({formatBytes(cachedSize)})
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Overall progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('cache.cacheStatus')}</span>
              <span className="text-foreground">{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => downloadAllLayers()}
                  disabled={isDownloading || !isOnline}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-1" />
                  )}
                  {t('cache.downloadAll')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download all layers for offline use ({formatBytes(totalSize)})</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={cachedSize === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('cache.clearAllCache')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all cached data ({formatBytes(cachedSize)}). 
                    You will need to re-download for offline use.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearAllCache()}>
                    {t('shotList.clearAll')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Auto-download setting */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-download" className="text-xs text-muted-foreground">
              {t('cache.autoDownloadOnWifi')}
            </Label>
            <Switch
              id="auto-download"
              checked={autoDownloadOnWifi}
              onCheckedChange={setAutoDownloadOnWifi}
            />
          </div>

          {/* Expandable layer list */}
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              <span>{t('cache.manageIndividualLayers')}</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <ScrollArea className="h-[280px] mt-2">
                <div className="space-y-2 pr-2">
                  {STELLARIUM_LAYERS.map((layer) => {
                    const status = layerStatuses.find((s) => s.layerId === layer.id);
                    const download = currentDownloads[layer.id];
                    const isCached = status?.cached ?? false;
                    const isSelected = selectedLayers.has(layer.id);
                    const progress = download
                      ? (download.downloadedFiles / download.totalFiles) * 100
                      : isCached
                      ? 100
                      : 0;

                    return (
                      <div
                        key={layer.id}
                        className={cn(
                          'p-2 rounded-lg border transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
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
                              {isCached && (
                                <Check className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {layer.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatBytes(layer.size)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {download ? (
                              <Badge variant="secondary" className="text-xs">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                {progress.toFixed(0)}%
                              </Badge>
                            ) : isCached ? (
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
                        
                        {download && (
                          <Progress value={progress} className="h-1 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Selection actions */}
              {selectedLayers.size > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {selectedLayers.size} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLayers(new Set())}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleDownloadSelected}
                      disabled={!isOnline || isDownloading}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Cancel button when downloading */}
          {isDownloading && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => cancelAllDownloads()}
            >
              {t('cache.cancelDownloads')}
            </Button>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
