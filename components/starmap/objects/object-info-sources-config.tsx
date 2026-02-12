'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  RefreshCw,
  Image as ImageIcon,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TooltipProvider,
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

import { SourceItem } from './source-config/source-item';
import { EditSourceDialog } from './source-config/edit-source-dialog';
import { AddCustomSourceDialog } from './source-config/add-custom-source-dialog';
import {
  useObjectInfoConfigStore,
  checkAllSourcesHealth,
  checkImageSourceHealth,
  checkDataSourceHealth,
  startHealthChecks,
  stopHealthChecks,
  type ImageSourceConfig,
  type DataSourceConfig,
} from '@/lib/services/object-info-config';
import { cn } from '@/lib/utils';

// ============================================================================
// Main Config Component
// ============================================================================

export function ObjectInfoSourcesConfig() {
  const t = useTranslations();
  const [imageSourcesOpen, setImageSourcesOpen] = useState(true);
  const [dataSourcesOpen, setDataSourcesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const {
    imageSources,
    dataSources,
    settings,
    setImageSourceEnabled,
    setDataSourceEnabled,
    addImageSource,
    removeImageSource,
    addDataSource,
    removeDataSource,
    setImageSourceStatus,
    setDataSourceStatus,
    updateImageSource,
    updateDataSource,
    updateSettings,
    resetToDefaults,
  } = useObjectInfoConfigStore();
  
  // Edit dialog state
  const [editingImageSource, setEditingImageSource] = useState<ImageSourceConfig | null>(null);
  const [editingDataSource, setEditingDataSource] = useState<DataSourceConfig | null>(null);
  
  // Start health checks on mount
  useEffect(() => {
    startHealthChecks();
    return () => stopHealthChecks();
  }, []);
  
  const handleCheckAll = useCallback(async () => {
    setIsChecking(true);
    await checkAllSourcesHealth();
    setIsChecking(false);
  }, []);
  
  const handleCheckImageSource = useCallback(async (source: ImageSourceConfig) => {
    setImageSourceStatus(source.id, 'checking');
    const result = await checkImageSourceHealth(source);
    setImageSourceStatus(
      source.id,
      result.online ? 'online' : 'offline',
      result.responseTime
    );
  }, [setImageSourceStatus]);
  
  const handleCheckDataSource = useCallback(async (source: DataSourceConfig) => {
    setDataSourceStatus(source.id, 'checking');
    const result = await checkDataSourceHealth(source);
    setDataSourceStatus(
      source.id,
      result.online ? 'online' : 'offline',
      result.responseTime
    );
  }, [setDataSourceStatus]);
  
  // Only count online status for enabled sources
  const onlineImageCount = imageSources.filter(s => s.enabled && s.status === 'online').length;
  const onlineDataCount = dataSources.filter(s => s.enabled && s.status === 'online').length;
  
  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('sourceConfig.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('sourceConfig.configDescription')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckAll}
            disabled={isChecking}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isChecking && 'animate-spin')} />
            {t('sourceConfig.checkAll')}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                {t('common.reset')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sourceConfig.resetToDefaults')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('sourceConfig.resetDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={resetToDefaults}>{t('common.reset')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {t('sourceConfig.imageSources')}: 
            <span className={cn('ml-1 font-medium', onlineImageCount > 0 ? 'text-green-400' : 'text-muted-foreground')}>
              {onlineImageCount}/{imageSources.filter(s => s.enabled).length}
            </span>
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {t('sourceConfig.dataSourcesLabel')}: 
            <span className={cn('ml-1 font-medium', onlineDataCount > 0 ? 'text-green-400' : 'text-muted-foreground')}>
              {onlineDataCount}/{dataSources.filter(s => s.enabled).length}
            </span>
          </span>
        </div>
      </div>
      
      {/* Image Sources */}
      <Collapsible open={imageSourcesOpen} onOpenChange={setImageSourcesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="font-medium">{t('sourceConfig.imageSources')}</span>
            <Badge variant="secondary" className="text-xs">
              {imageSources.filter(s => s.enabled).length}
            </Badge>
          </div>
          {imageSourcesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-2">
          {imageSources
            .sort((a, b) => a.priority - b.priority)
            .map((source) => (
              <SourceItem
                key={source.id}
                source={source}
                onToggle={() => setImageSourceEnabled(source.id, !source.enabled)}
                onCheck={() => handleCheckImageSource(source)}
                onRemove={source.builtIn ? undefined : () => removeImageSource(source.id)}
                onEdit={() => setEditingImageSource(source)}
              />
            ))}
          
          <div className="pt-2">
            <AddCustomSourceDialog
              type="image"
              onAdd={(source) => addImageSource(source as Omit<ImageSourceConfig, 'id' | 'builtIn' | 'status'>)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Data Sources */}
      <Collapsible open={dataSourcesOpen} onOpenChange={setDataSourcesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="font-medium">{t('sourceConfig.dataSourcesLabel')}</span>
            <Badge variant="secondary" className="text-xs">
              {dataSources.filter(s => s.enabled).length}
            </Badge>
          </div>
          {dataSourcesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-2">
          {dataSources
            .sort((a, b) => a.priority - b.priority)
            .map((source) => (
              <SourceItem
                key={source.id}
                source={source}
                onToggle={() => setDataSourceEnabled(source.id, !source.enabled)}
                onCheck={() => handleCheckDataSource(source)}
                onRemove={source.builtIn ? undefined : () => removeDataSource(source.id)}
                onEdit={() => setEditingDataSource(source)}
              />
            ))}
          
          <div className="pt-2">
            <AddCustomSourceDialog
              type="data"
              onAdd={(source) => addDataSource(source as Omit<DataSourceConfig, 'id' | 'builtIn' | 'status'>)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Global Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">{t('sourceConfig.globalSettings')}</span>
          </div>
          {settingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-4 p-4 rounded-lg border">
          {/* Auto Skip Offline */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('sourceConfig.autoSkipOffline')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('sourceConfig.autoSkipOfflineDescription')}
              </p>
            </div>
            <Switch
              checked={settings.autoSkipOffline}
              onCheckedChange={(checked) => updateSettings({ autoSkipOffline: checked })}
            />
          </div>
          
          <Separator />
          
          {/* Image Timeout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('sourceConfig.imageTimeout')}</Label>
              <span className="text-sm text-muted-foreground">
                {(settings.imageTimeout / 1000).toFixed(0)}s
              </span>
            </div>
            <Slider
              value={[settings.imageTimeout]}
              onValueChange={([value]) => updateSettings({ imageTimeout: value })}
              min={3000}
              max={30000}
              step={1000}
            />
          </div>
          
          {/* API Timeout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('sourceConfig.apiTimeout')}</Label>
              <span className="text-sm text-muted-foreground">
                {(settings.apiTimeout / 1000).toFixed(0)}s
              </span>
            </div>
            <Slider
              value={[settings.apiTimeout]}
              onValueChange={([value]) => updateSettings({ apiTimeout: value })}
              min={1000}
              max={15000}
              step={1000}
            />
          </div>
          
          <Separator />
          
          {/* Default Image Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('sourceConfig.defaultImageSize')}</Label>
              <span className="text-sm text-muted-foreground">
                {settings.defaultImageSize}&apos;
              </span>
            </div>
            <Slider
              value={[settings.defaultImageSize]}
              onValueChange={([value]) => updateSettings({ defaultImageSize: value })}
              min={5}
              max={60}
              step={5}
            />
          </div>
          
          {/* Preferred Image Format */}
          <div className="space-y-2">
            <Label>{t('sourceConfig.preferredFormat')}</Label>
            <Select
              value={settings.preferredImageFormat}
              onValueChange={(value) => updateSettings({ preferredImageFormat: value as 'jpg' | 'png' | 'gif' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Health Check Interval */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('sourceConfig.healthCheckInterval')}</Label>
              <span className="text-sm text-muted-foreground">
                {settings.healthCheckInterval === 0 
                  ? t('sourceConfig.disabled')
                  : `${(settings.healthCheckInterval / 60000).toFixed(0)} min`
                }
              </span>
            </div>
            <Slider
              value={[settings.healthCheckInterval]}
              onValueChange={([value]) => updateSettings({ healthCheckInterval: value })}
              min={0}
              max={600000}
              step={60000}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Edit Source Dialogs */}
      {editingImageSource && (
        <EditSourceDialog
          key={editingImageSource.id}
          source={editingImageSource}
          type="image"
          open={!!editingImageSource}
          onOpenChange={(open) => !open && setEditingImageSource(null)}
          onSave={(updates) => {
            updateImageSource(editingImageSource.id, updates as Partial<ImageSourceConfig>);
            setEditingImageSource(null);
          }}
        />
      )}
      
      {editingDataSource && (
        <EditSourceDialog
          key={editingDataSource.id}
          source={editingDataSource}
          type="data"
          open={!!editingDataSource}
          onOpenChange={(open) => !open && setEditingDataSource(null)}
          onSave={(updates) => {
            updateDataSource(editingDataSource.id, updates as Partial<DataSourceConfig>);
            setEditingDataSource(null);
          }}
        />
      )}
    </div>
    </TooltipProvider>
  );
}


