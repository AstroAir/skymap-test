'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Trash2,
  Cloud,
  CloudOff,
  Check,
  Loader2,
  HardDrive,
  Package,
  RefreshCw,
  Telescope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

import { useOfflineStore, formatBytes, STELLARIUM_LAYERS, offlineCacheManager, type HiPSCacheStatus, type StorageInfo } from '@/lib/offline';
import { SKY_SURVEYS } from '@/lib/core/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { useCache } from '@/lib/tauri/hooks';
import { isTauri } from '@/lib/storage/platform';

// Convert SKY_SURVEYS to HiPSSurvey format for cache operations
function convertToHiPSSurvey(survey: typeof SKY_SURVEYS[0]) {
  return {
    id: survey.id,
    name: survey.name,
    url: survey.url,
    description: survey.description,
    category: survey.category,
    maxOrder: 11,
    tileFormat: 'jpeg',
    frame: 'equatorial',
  };
}

export function OfflineCacheManager() {
  const t = useTranslations();
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'layers' | 'surveys'>('layers');
  
  // HiPS survey cache state
  const [surveyStatuses, setSurveyStatuses] = useState<Record<string, HiPSCacheStatus>>({});
  const [downloadingSurveys, setDownloadingSurveys] = useState<string[]>([]);
  
  // Storage info state
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [repairingLayers, setRepairingLayers] = useState<string[]>([]);
  
  // Tauri cache hook for desktop-specific cache management
  const tauriCache = useCache();
  
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

  // Fetch storage info - use Tauri stats when available
  const refreshStorageInfo = useCallback(async () => {
    // If Tauri is available, also refresh Tauri cache
    if (tauriCache.isAvailable) {
      await tauriCache.refresh();
    }
    const info = await offlineCacheManager.getStorageInfo();
    setStorageInfo(info);
  }, [tauriCache]);

  // Refresh storage info on mount and after operations
  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo, layerStatuses]);

  // Repair incomplete layer cache
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
            ? `${result.repaired} files recovered` 
            : 'Cache is complete',
        });
      } else {
        toast.error(t('cache.repairFailed'), {
          description: `${result.failed} files could not be recovered`,
        });
      }
      
      await refreshStatuses();
      await refreshStorageInfo();
    } catch (error) {
      toast.dismiss(`repair-${layerId}`);
      toast.error(t('cache.repairFailed'));
      console.error('Error repairing layer:', error);
    } finally {
      setRepairingLayers(prev => prev.filter(id => id !== layerId));
    }
  }, [repairingLayers, t, refreshStatuses, refreshStorageInfo]);

  // Fetch survey cache statuses
  const refreshSurveyStatuses = useCallback(async () => {
    const statuses: Record<string, HiPSCacheStatus> = {};
    for (const survey of SKY_SURVEYS) {
      const hipsSurvey = convertToHiPSSurvey(survey);
      const status = await offlineCacheManager.getHiPSCacheStatus(hipsSurvey);
      statuses[survey.id] = status;
    }
    setSurveyStatuses(statuses);
  }, []);

  // Refresh survey statuses on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'surveys') {
      refreshSurveyStatuses();
    }
  }, [activeTab, refreshSurveyStatuses]);

  // Download survey tiles
  const handleDownloadSurvey = useCallback(async (surveyId: string) => {
    const survey = SKY_SURVEYS.find(s => s.id === surveyId);
    if (!survey || downloadingSurveys.includes(surveyId)) return;

    setDownloadingSurveys(prev => [...prev, surveyId]);
    
    try {
      const hipsSurvey = convertToHiPSSurvey(survey);
      toast.loading(t('survey.downloadingTiles'), { id: `survey-${surveyId}` });
      
      const success = await offlineCacheManager.downloadHiPSSurvey(
        hipsSurvey,
        3,
        (progress) => {
          const percent = Math.round((progress.downloadedFiles / progress.totalFiles) * 100);
          toast.loading(`${t('survey.downloadingTiles')} ${percent}%`, { id: `survey-${surveyId}` });
        }
      );
      
      toast.dismiss(`survey-${surveyId}`);
      
      if (success) {
        toast.success(t('survey.downloadComplete'));
        await refreshSurveyStatuses();
      } else {
        toast.error(t('survey.downloadFailed'));
      }
    } catch (error) {
      toast.dismiss(`survey-${surveyId}`);
      toast.error(t('survey.downloadFailed'));
      console.error('Error downloading survey:', error);
    } finally {
      setDownloadingSurveys(prev => prev.filter(id => id !== surveyId));
    }
  }, [downloadingSurveys, t, refreshSurveyStatuses]);

  // Clear survey cache
  const handleClearSurveyCache = useCallback(async (surveyId: string) => {
    const success = await offlineCacheManager.clearHiPSCache(surveyId);
    if (success) {
      toast.success(t('survey.cacheCleared'));
      await refreshSurveyStatuses();
    }
  }, [t, refreshSurveyStatuses]);

  // Clear all survey caches
  const handleClearAllSurveyCaches = useCallback(async () => {
    const success = await offlineCacheManager.clearAllHiPSCaches();
    if (success) {
      toast.success(t('survey.cacheCleared'));
      await refreshSurveyStatuses();
    }
  }, [t, refreshSurveyStatuses]);

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
          {/* Storage Info */}
          {storageInfo && storageInfo.quota > 0 && (
            <div className="space-y-1 p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('cache.storageUsed')}</span>
                <span className="text-foreground font-mono">
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <Progress value={storageInfo.usagePercent} className="h-1.5" />
              <div className="text-xs text-muted-foreground">
                {formatBytes(storageInfo.available)} {t('cache.available')}
              </div>
            </div>
          )}
          
          {/* Tauri Desktop Cache Stats */}
          {isTauri() && tauriCache.stats && (
            <div className="space-y-1 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {t('cache.desktopCache')}
                </span>
                <Badge variant="outline" className="text-[10px] h-4">Desktop</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tauriCache.stats.total_tiles} tiles</span>
                <span className="text-foreground font-mono">
                  {formatBytes(tauriCache.stats.total_size_bytes)}
                </span>
              </div>
              {tauriCache.regions.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {tauriCache.regions.length} cached regions
                </div>
              )}
            </div>
          )}

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

          {/* Tabbed content for layers and surveys */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'layers' | 'surveys')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="layers" className="text-xs">
                <Package className="h-3.5 w-3.5 mr-1" />
                {t('cache.manageIndividualLayers')}
              </TabsTrigger>
              <TabsTrigger value="surveys" className="text-xs">
                <Telescope className="h-3.5 w-3.5 mr-1" />
                {t('settings.skySurveys')}
              </TabsTrigger>
            </TabsList>
            
            {/* Data Layers Tab */}
            <TabsContent value="layers" className="mt-2">
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
                                    <p>{t('cache.incomplete')}: {status?.cachedFiles}/{status?.totalFiles} files</p>
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
            </TabsContent>
            
            {/* Sky Surveys Tab */}
            <TabsContent value="surveys" className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {Object.values(surveyStatuses).filter(s => s.cached).length}/{SKY_SURVEYS.length} surveys cached
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={refreshSurveyStatuses}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  {Object.values(surveyStatuses).some(s => s.cached) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('survey.clearCache')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove all cached survey tiles.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearAllSurveyCaches}>
                            {t('shotList.clearAll')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-[220px]">
                <div className="space-y-2 pr-2">
                  {SKY_SURVEYS.map((survey) => {
                    const status = surveyStatuses[survey.id];
                    const isDownloading = downloadingSurveys.includes(survey.id);
                    const isCached = status?.cached ?? false;
                    const progress = status 
                      ? (status.cachedTiles / Math.max(status.totalTiles, 1)) * 100 
                      : 0;

                    return (
                      <div
                        key={survey.id}
                        className={cn(
                          'p-2 rounded-lg border transition-colors',
                          isCached
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-border bg-muted/30'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{survey.name}</span>
                              {isCached && (
                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {survey.description}
                            </p>
                            {status && status.cachedTiles > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {status.cachedTiles} tiles (~{formatBytes(status.cachedBytes)})
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : isCached ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleClearSurveyCache(survey.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDownloadSurvey(survey.id)}
                                    disabled={!isOnline}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('survey.downloadForOffline')}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        
                        {isDownloading && (
                          <Progress value={progress} className="h-1 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

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


