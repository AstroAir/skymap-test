'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  List,
  Plus,
  Trash2,
  Play,
  Check,
  ChevronUp,
  ChevronDown,
  Target,
  Clock,
  Camera,
  X,
  Eye,
  AlertTriangle,
  TrendingUp,
  Moon,
  BarChart3,
  Star,
  Archive,
  Square,
  Heart,
  Layers,
  Download,
  Upload,
  FileText,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

import { useTargetListStore, useMountStore, useEquipmentStore, useStellariumStore, type TargetItem } from '@/lib/stores';
import { tauriApi } from '@/lib/tauri';
import { isTauri } from '@/lib/storage/platform';
import { toast } from 'sonner';
import type { ExportFormat, TargetExportItem } from '@/lib/tauri/types';
import { TranslatedName } from '../objects/translated-name';
import {
  planMultipleTargets,
  calculateImagingFeasibility,
  formatTimeShort,
  formatDuration,
  type ImagingFeasibility,
} from '@/lib/astronomy/astro-utils';
import { getStatusColor, getPriorityColor, getFeasibilityBadgeColor } from '@/lib/core/constants/planning-styles';
import type { ShotListProps } from '@/types/starmap/planning';
import { createLogger } from '@/lib/logger';

const logger = createLogger('shot-list');


export function ShotList({
  onNavigateToTarget,
  currentSelection,
}: ShotListProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [showPlanAnalysis, setShowPlanAnalysis] = useState(false);
  
  // Store state
  const targets = useTargetListStore((state) => state.targets);
  const activeTargetId = useTargetListStore((state) => state.activeTargetId);
  const selectedIds = useTargetListStore((state) => state.selectedIds);
  const groupBy = useTargetListStore((state) => state.groupBy);
  const showArchived = useTargetListStore((state) => state.showArchived);
  
  // Store actions
  const addTarget = useTargetListStore((state) => state.addTarget);
  const removeTarget = useTargetListStore((state) => state.removeTarget);
  const updateTarget = useTargetListStore((state) => state.updateTarget);
  const setActiveTarget = useTargetListStore((state) => state.setActiveTarget);
  const reorderTargets = useTargetListStore((state) => state.reorderTargets);
  const clearCompleted = useTargetListStore((state) => state.clearCompleted);
  const clearAll = useTargetListStore((state) => state.clearAll);
  const toggleSelection = useTargetListStore((state) => state.toggleSelection);
  const selectAll = useTargetListStore((state) => state.selectAll);
  const clearSelection = useTargetListStore((state) => state.clearSelection);
  const setGroupBy = useTargetListStore((state) => state.setGroupBy);
  const setShowArchived = useTargetListStore((state) => state.setShowArchived);
  const removeTargetsBatch = useTargetListStore((state) => state.removeTargetsBatch);
  const setStatusBatch = useTargetListStore((state) => state.setStatusBatch);
  const setPriorityBatch = useTargetListStore((state) => state.setPriorityBatch);
  const addTargetsBatch = useTargetListStore((state) => state.addTargetsBatch);
  const getFilteredTargets = useTargetListStore((state) => state.getFilteredTargets);
  
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  // Equipment store for FOV settings
  const sensorWidth = useEquipmentStore((state) => state.sensorWidth);
  const sensorHeight = useEquipmentStore((state) => state.sensorHeight);
  const focalLength = useEquipmentStore((state) => state.focalLength);
  const rotationAngle = useEquipmentStore((state) => state.rotationAngle);
  const mosaic = useEquipmentStore((state) => state.mosaic);
  
  const latitude = profileInfo.AstrometrySettings.Latitude || 0;
  const longitude = profileInfo.AstrometrySettings.Longitude || 0;

  // Calculate multi-target plan with feasibility
  const targetPlan = useMemo(() => {
    if (targets.length === 0) return null;
    
    const targetData = targets.map(t => ({
      id: t.id,
      name: t.name,
      ra: t.ra,
      dec: t.dec,
    }));
    
    return planMultipleTargets(targetData, latitude, longitude);
  }, [targets, latitude, longitude]);

  // Get feasibility for individual targets
  const targetFeasibility = useMemo(() => {
    const feasibilityMap = new Map<string, ImagingFeasibility>();
    
    targets.forEach(target => {
      const feasibility = calculateImagingFeasibility(
        target.ra, target.dec, latitude, longitude
      );
      feasibilityMap.set(target.id, feasibility);
    });
    
    return feasibilityMap;
  }, [targets, latitude, longitude]);

  // Filtered targets
  const filteredTargets = useMemo(() => getFilteredTargets(), [getFilteredTargets]);

  const handleAddCurrentTarget = useCallback(() => {
    if (!currentSelection) return;
    
    addTarget({
      name: currentSelection.name,
      ra: currentSelection.ra,
      dec: currentSelection.dec,
      raString: currentSelection.raString,
      decString: currentSelection.decString,
      sensorWidth,
      sensorHeight,
      focalLength,
      rotationAngle,
      mosaic: mosaic.enabled ? {
        enabled: mosaic.enabled,
        rows: mosaic.rows,
        cols: mosaic.cols,
        overlap: mosaic.overlap,
      } : undefined,
      priority: 'medium',
    });
  }, [currentSelection, sensorWidth, sensorHeight, focalLength, rotationAngle, mosaic, addTarget]);

  const handleNavigate = useCallback((target: TargetItem) => {
    setActiveTarget(target.id);
    if (setViewDirection) {
      setViewDirection(target.ra, target.dec);
    }
    onNavigateToTarget?.(target.ra, target.dec);
  }, [setActiveTarget, setViewDirection, onNavigateToTarget]);

  const handleMoveUp = useCallback((index: number) => {
    if (index > 0) {
      reorderTargets(index, index - 1);
    }
  }, [reorderTargets]);

  const handleMoveDown = useCallback((index: number, total: number) => {
    if (index < total - 1) {
      reorderTargets(index, index + 1);
    }
  }, [reorderTargets]);

  const handleStatusChange = useCallback((id: string, status: TargetItem['status']) => {
    updateTarget(id, { status });
  }, [updateTarget]);


  // Batch actions
  const handleBatchDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    removeTargetsBatch(ids);
  }, [selectedIds, removeTargetsBatch]);

  const handleBatchStatus = useCallback((status: TargetItem['status']) => {
    const ids = Array.from(selectedIds);
    setStatusBatch(ids, status);
    clearSelection();
  }, [selectedIds, setStatusBatch, clearSelection]);

  const handleBatchPriority = useCallback((priority: TargetItem['priority']) => {
    const ids = Array.from(selectedIds);
    setPriorityBatch(ids, priority);
    clearSelection();
  }, [selectedIds, setPriorityBatch, clearSelection]);

  // Import/Export handlers
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!isTauri()) {
      toast.error(t('shotList.desktopOnly'));
      return;
    }
    
    if (targets.length === 0) {
      toast.error(t('shotList.noTargetsToExport'));
      return;
    }

    try {
      const exportTargets: TargetExportItem[] = targets.map(target => ({
        name: target.name,
        ra: target.ra,
        dec: target.dec,
        ra_string: target.raString,
        dec_string: target.decString,
        priority: target.priority,
        tags: target.tags.join(', '),
        notes: target.notes,
      }));

      const result = await tauriApi.targetIo.exportTargets(exportTargets, format);
      toast.success(t('shotList.exportSuccess'), {
        description: result,
      });
    } catch (error) {
      logger.error('Export failed', error);
      toast.error(t('shotList.exportFailed'), {
        description: String(error),
      });
    }
  }, [targets, t]);

  const handleImport = useCallback(async () => {
    if (!isTauri()) {
      toast.error(t('shotList.desktopOnly'));
      return;
    }

    try {
      const result = await tauriApi.targetIo.importTargets();
      
      if (result.targets.length > 0) {
        // Convert imported targets to our format and add them
        const batchTargets = result.targets.map(t => ({
          name: t.name,
          ra: t.ra,
          dec: t.dec,
          raString: t.ra_string,
          decString: t.dec_string,
        }));
        
        addTargetsBatch(batchTargets, { priority: 'medium' });
        
        toast.success(t('shotList.importSuccess'), {
          description: `${result.imported} targets imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}`,
        });
      } else {
        toast.info(t('shotList.noTargetsImported'));
      }
      
      if (result.errors.length > 0) {
        logger.warn('Import warnings', { errors: result.errors });
      }
    } catch (error) {
      logger.error('Import failed', error);
      toast.error(t('shotList.importFailed'), {
        description: String(error),
      });
    }
  }, [t, addTargetsBatch]);


  const getFeasibilityIcon = (rec: ImagingFeasibility['recommendation']) => {
    switch (rec) {
      case 'excellent':
      case 'good':
        return <TrendingUp className="h-3 w-3" />;
      case 'fair':
      case 'poor':
      case 'not_recommended':
        return <AlertTriangle className="h-3 w-3" />;
    }
  };


  const plannedCount = filteredTargets.filter((t) => t.status === 'planned').length;
  const completedCount = filteredTargets.filter((t) => t.status === 'completed').length;
  const selectedCount = selectedIds.size;

  return (
    <TooltipProvider>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <Tooltip>
          <TooltipTrigger asChild>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent relative touch-target toolbar-btn"
              >
                <List className="h-5 w-5" />
                {targets.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground animate-bounce-in">
                    {targets.length}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t('shotList.shotList')} ({targets.length})</p>
          </TooltipContent>
        </Tooltip>

        <DrawerContent className="w-[85vw] max-w-[320px] sm:max-w-[400px] md:max-w-[450px] h-full bg-card border-border drawer-content">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t('shotList.shotList')}
            </DrawerTitle>
          </DrawerHeader>

          <div className="mt-4 space-y-4">
            {/* Stats & Toolbar */}
            <div className="space-y-2">
              {/* Stats Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {plannedCount} {t('shotList.planned')}
                  </Badge>
                  <Badge variant="outline" className="border-green-600 text-green-400">
                    {completedCount} {t('shotList.done')}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {targets.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowPlanAnalysis(!showPlanAnalysis)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      {t('shotList.analysis')}
                    </Button>
                  )}
                  
                  {/* View Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Layers className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>{t('shotList.groupBy')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={groupBy === 'none'}
                        onCheckedChange={() => setGroupBy('none')}
                      >
                        {t('shotList.noGrouping')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={groupBy === 'priority'}
                        onCheckedChange={() => setGroupBy('priority')}
                      >
                        {t('shotList.byPriority')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={groupBy === 'status'}
                        onCheckedChange={() => setGroupBy('status')}
                      >
                        {t('shotList.byStatus')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={groupBy === 'tag'}
                        onCheckedChange={() => setGroupBy('tag')}
                      >
                        {t('shotList.byTag')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={showArchived}
                        onCheckedChange={setShowArchived}
                      >
                        <Archive className="h-3 w-3 mr-2" />
                        {t('shotList.showArchived')}
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Import/Export Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>{t('shotList.importExport')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleImport} disabled={!isTauri()}>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('shotList.import')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        {t('shotList.exportAs')}
                      </DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => handleExport('csv')} 
                        disabled={targets.length === 0 || !isTauri()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport('json')} 
                        disabled={targets.length === 0 || !isTauri()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport('stellarium')} 
                        disabled={targets.length === 0 || !isTauri()}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Stellarium
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExport('mosaic')} 
                        disabled={targets.length === 0 || !isTauri()}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Mosaic Planner
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Multi-select toolbar */}
              {selectedCount > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={clearSelection}
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('search.clearSelection')}
                    </Button>
                    <span className="text-muted-foreground">
                      {t('search.selectedCount', { count: selectedCount })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Batch Status */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Play className="h-3 w-3 mr-1" />
                          {t('shotList.setStatus')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBatchStatus('planned')}>
                          {t('shotList.planned')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBatchStatus('in_progress')}>
                          {t('shotList.inProgress')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBatchStatus('completed')}>
                          {t('shotList.completed')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Batch Priority */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {t('shotList.setPriority')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBatchPriority('high')}>
                          {t('shotList.highPriority')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBatchPriority('medium')}>
                          {t('shotList.mediumPriority')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBatchPriority('low')}>
                          {t('shotList.lowPriority')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Batch Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
                      onClick={handleBatchDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Select All / Clear when not in selection mode */}
              {targets.length > 0 && selectedCount === 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={selectAll}
                  >
                    <Square className="h-3 w-3 mr-1" />
                    {t('search.selectAll')}
                  </Button>
                </div>
              )}
            </div>

            {/* Plan Analysis Panel */}
            {showPlanAnalysis && targetPlan && (
              <div className="p-2 rounded-lg bg-muted/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('shotList.totalImaging')}</span>
                  <span className="text-foreground">{formatDuration(targetPlan.totalImagingTime)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('shotList.nightCoverage')}</span>
                  <span className={targetPlan.nightCoverage > 100 ? 'text-yellow-400' : 'text-green-400'}>
                    {targetPlan.nightCoverage.toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(100, targetPlan.nightCoverage)} className="h-1" />
                {targetPlan.nightCoverage > 100 && (
                  <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{t('shotList.tooManyTargets')}</span>
                  </div>
                )}
                {targetPlan.recommendations.length > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {targetPlan.recommendations[0]}
                  </div>
                )}
              </div>
            )}

            {/* Add current target */}
            {currentSelection && (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleAddCurrentTarget}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add: {currentSelection.name}
              </Button>
            )}

            <Separator className="bg-border" />

            {/* Target list */}
            <ScrollArea className="h-[calc(100vh-280px)]">
              {targets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('shotList.noTargetsInList')}</p>
                  <p className="text-xs mt-1">{t('shotList.selectAndAdd')}</p>
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {filteredTargets.map((target, index) => {
                    const isSelected = selectedIds.has(target.id);
                    
                    return (
                      <div
                        key={target.id}
                        className={`p-2 rounded-lg border transition-colors ${
                          activeTargetId === target.id
                            ? 'bg-primary/20 border-primary'
                            : isSelected
                            ? 'bg-accent/30 border-accent'
                            : 'bg-muted/50 border-border hover:border-muted-foreground'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start gap-2">
                          {/* Checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(target.id)}
                            className="mt-0.5 h-4 w-4"
                          />
                        
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-foreground font-medium truncate flex-1">
                                <TranslatedName name={target.name} />
                              </p>
                              {target.isFavorite && (
                                <Heart className="h-3 w-3 text-red-400 fill-red-400" />
                              )}
                              {target.isArchived && (
                                <Archive className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {target.raString} / {target.decString}
                            </p>
                            {/* Tags */}
                            {target.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {target.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="secondary" className="h-4 text-[9px] px-1">
                                    {tag}
                                  </Badge>
                                ))}
                                {target.tags.length > 3 && (
                                  <Badge variant="secondary" className="h-4 text-[9px] px-1">
                                    +{target.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={`${getStatusColor(target.status)} text-white text-[10px] h-5`}>
                            {target.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* FOV info */}
                        {target.focalLength && (
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Camera className="h-3 w-3" />
                            <span>{target.focalLength}mm</span>
                            {target.mosaic?.enabled && (
                              <span>• {target.mosaic.cols}×{target.mosaic.rows}</span>
                            )}
                          </div>
                        )}

                        {/* Exposure plan */}
                        {target.exposurePlan && (
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {target.exposurePlan.subFrames}× {target.exposurePlan.singleExposure}s
                              ({target.exposurePlan.totalExposure}m)
                            </span>
                          </div>
                        )}

                        {/* Feasibility indicator */}
                        {(() => {
                          const feasibility = targetFeasibility.get(target.id);
                          const planTarget = targetPlan?.targets.find(t => t.id === target.id);
                          if (!feasibility) return null;
                          
                          return (
                            <div className="mt-1.5 space-y-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getFeasibilityBadgeColor(feasibility.recommendation)} text-white text-[10px] h-5`}>
                                      {getFeasibilityIcon(feasibility.recommendation)}
                                      <span className="ml-1 capitalize">{feasibility.recommendation.replace('_', ' ')}</span>
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{feasibility.score}/100</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-48">
                                  <div className="text-xs space-y-1">
                                    <div>Moon: {feasibility.moonScore} | Alt: {feasibility.altitudeScore}</div>
                                    <div>Duration: {feasibility.durationScore} | Twilight: {feasibility.twilightScore}</div>
                                    {feasibility.warnings.length > 0 && (
                                      <div className="text-yellow-400">{feasibility.warnings[0]}</div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              
                              {/* Dark window times */}
                              {planTarget?.windowStart && planTarget?.windowEnd && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Moon className="h-3 w-3" />
                                  <span>
                                    {formatTimeShort(planTarget.windowStart)} - {formatTimeShort(planTarget.windowEnd)}
                                    ({formatDuration(planTarget.duration)})
                                  </span>
                                </div>
                              )}
                              
                              {/* Conflicts warning */}
                              {planTarget?.conflicts && planTarget.conflicts.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Overlaps with {planTarget.conflicts.length} target(s)</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Actions */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleMoveDown(index, filteredTargets.length)}
                              disabled={index === filteredTargets.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 cursor-pointer ${getPriorityColor(target.priority)}`}
                              onClick={() => {
                                const priorities: TargetItem['priority'][] = ['low', 'medium', 'high'];
                                const currentIdx = priorities.indexOf(target.priority);
                                const nextPriority = priorities[(currentIdx + 1) % 3];
                                updateTarget(target.id, { priority: nextPriority });
                              }}
                            >
                              {target.priority}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-primary hover:text-primary/80"
                                  onClick={() => handleNavigate(target)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('actions.goToTarget')}</TooltipContent>
                            </Tooltip>

                            {target.status === 'planned' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-amber-400 hover:text-amber-300"
                                    onClick={() => handleStatusChange(target.id, 'in_progress')}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('actions.startImaging')}</TooltipContent>
                              </Tooltip>
                            )}

                            {target.status === 'in_progress' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-400 hover:text-green-300"
                                    onClick={() => handleStatusChange(target.id, 'completed')}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('actions.markComplete')}</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-400 hover:text-red-300"
                                  onClick={() => removeTarget(target.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('common.remove')}</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer actions */}
            {targets.length > 0 && (
              <>
                <Separator className="bg-border" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border text-muted-foreground hover:bg-accent"
                    onClick={clearCompleted}
                    disabled={completedCount === 0}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('shotList.clearDone')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600 text-red-400 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('shotList.clearAll')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">{t('shotList.clearAllTargets')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          This will remove all {targets.length} targets from your shot list.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-accent">
                          {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={clearAll}
                        >
                          {t('shotList.clearAll')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  );
}


