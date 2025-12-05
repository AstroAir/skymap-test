'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
// Status Badge Component
// ============================================================================

function StatusBadge({ 
  status, 
  responseTime 
}: { 
  status: ImageSourceConfig['status']; 
  responseTime?: number;
}) {
  const t = useTranslations();
  
  const statusConfig = {
    unknown: { icon: AlertCircle, color: 'text-muted-foreground bg-muted', label: t('sourceConfig.statusUnknown') },
    checking: { icon: Loader2, color: 'text-blue-400 bg-blue-500/20', label: t('sourceConfig.statusChecking') },
    online: { icon: CheckCircle2, color: 'text-green-400 bg-green-500/20', label: t('sourceConfig.statusOnline') },
    offline: { icon: XCircle, color: 'text-red-400 bg-red-500/20', label: t('sourceConfig.statusOffline') },
    error: { icon: AlertCircle, color: 'text-orange-400 bg-orange-500/20', label: t('sourceConfig.statusError') },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
            <Icon className={cn('h-3 w-3', status === 'checking' && 'animate-spin')} />
            {responseTime !== undefined && status === 'online' && (
              <span className="font-mono">{responseTime}ms</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
          {responseTime !== undefined && (
            <p className="text-xs text-muted-foreground">
              {t('sourceConfig.responseTime')}: {responseTime}ms
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Image Source Item Component
// ============================================================================

function ImageSourceItem({
  source,
  onToggle,
  onCheck,
  onRemove,
  onEdit,
}: {
  source: ImageSourceConfig;
  onToggle: () => void;
  onCheck: () => void;
  onRemove?: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations();
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      source.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'
    )}>
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      
      <Switch
        checked={source.enabled}
        onCheckedChange={onToggle}
        aria-label={t('sourceConfig.toggleSource')}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{source.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {source.type}
          </Badge>
          {source.builtIn && (
            <Badge variant="secondary" className="text-[10px]">
              {t('sourceConfig.builtIn')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {source.description}
        </p>
      </div>
      
      <StatusBadge status={source.status} responseTime={source.responseTime} />
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCheck}
          disabled={source.status === 'checking'}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', source.status === 'checking' && 'animate-spin')} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        
        {!source.builtIn && onRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sourceConfig.deleteSource')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('sourceConfig.deleteSourceDescription', { name: source.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Data Source Item Component
// ============================================================================

function DataSourceItem({
  source,
  onToggle,
  onCheck,
  onRemove,
  onEdit,
}: {
  source: DataSourceConfig;
  onToggle: () => void;
  onCheck: () => void;
  onRemove?: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations();
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      source.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'
    )}>
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      
      <Switch
        checked={source.enabled}
        onCheckedChange={onToggle}
        aria-label={t('sourceConfig.toggleSource')}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{source.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {source.type}
          </Badge>
          {source.builtIn && (
            <Badge variant="secondary" className="text-[10px]">
              {t('sourceConfig.builtIn')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {source.description}
        </p>
      </div>
      
      <StatusBadge status={source.status} responseTime={source.responseTime} />
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCheck}
          disabled={source.status === 'checking'}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', source.status === 'checking' && 'animate-spin')} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        
        {!source.builtIn && onRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sourceConfig.deleteSource')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('sourceConfig.deleteSourceDescription', { name: source.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Add Custom Source Dialog
// ============================================================================

function AddCustomSourceDialog({
  type,
  onAdd,
}: {
  type: 'image' | 'data';
  onAdd: (source: Partial<ImageSourceConfig | DataSourceConfig>) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [urlTemplate, setUrlTemplate] = useState('');
  const [credit, setCredit] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = () => {
    if (!name || !baseUrl) return;
    
    if (type === 'image') {
      onAdd({
        name,
        type: 'custom',
        enabled: true,
        priority: 100,
        baseUrl,
        urlTemplate: urlTemplate || '?ra={ra}&dec={dec}&size={size}',
        credit: credit || name,
        description: description || `Custom image source: ${name}`,
      } as Partial<ImageSourceConfig>);
    } else {
      onAdd({
        name,
        type: 'custom',
        enabled: true,
        priority: 100,
        baseUrl,
        apiEndpoint: urlTemplate || '/api',
        timeout: 5000,
        description: description || `Custom data source: ${name}`,
      } as Partial<DataSourceConfig>);
    }
    
    setOpen(false);
    setName('');
    setBaseUrl('');
    setUrlTemplate('');
    setCredit('');
    setDescription('');
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {t('sourceConfig.addCustom')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'image' 
              ? t('sourceConfig.addImageSource') 
              : t('sourceConfig.addDataSource')
            }
          </DialogTitle>
          <DialogDescription>
            {t('sourceConfig.addCustomDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('sourceConfig.sourceName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('sourceConfig.sourceNamePlaceholder')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="baseUrl">{t('sourceConfig.baseUrl')}</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="urlTemplate">
              {type === 'image' 
                ? t('sourceConfig.urlTemplate') 
                : t('sourceConfig.apiEndpoint')
              }
            </Label>
            <Input
              id="urlTemplate"
              value={urlTemplate}
              onChange={(e) => setUrlTemplate(e.target.value)}
              placeholder={type === 'image' 
                ? "/image?ra={ra}&dec={dec}&size={size}&format={format}"
                : "/api/query"
              }
            />
            {type === 'image' && (
              <p className="text-xs text-muted-foreground">
                {t('sourceConfig.urlTemplateHint')}
              </p>
            )}
          </div>
          
          {type === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="credit">{t('sourceConfig.credit')}</Label>
              <Input
                id="credit"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder={t('sourceConfig.creditPlaceholder')}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('sourceConfig.sourceDescription')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('sourceConfig.descriptionPlaceholder')}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !baseUrl}>
            {t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
    updateSettings,
    resetToDefaults,
  } = useObjectInfoConfigStore();
  
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
  
  const onlineImageCount = imageSources.filter(s => s.status === 'online').length;
  const onlineDataCount = dataSources.filter(s => s.status === 'online').length;
  
  return (
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
              <ImageSourceItem
                key={source.id}
                source={source}
                onToggle={() => setImageSourceEnabled(source.id, !source.enabled)}
                onCheck={() => handleCheckImageSource(source)}
                onRemove={source.builtIn ? undefined : () => removeImageSource(source.id)}
                onEdit={() => {/* TODO: Edit dialog */}}
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
              <DataSourceItem
                key={source.id}
                source={source}
                onToggle={() => setDataSourceEnabled(source.id, !source.enabled)}
                onCheck={() => handleCheckDataSource(source)}
                onRemove={source.builtIn ? undefined : () => removeDataSource(source.id)}
                onEdit={() => {/* TODO: Edit dialog */}}
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
    </div>
  );
}


