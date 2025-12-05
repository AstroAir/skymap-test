'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  useSettingsStore,
  useSatelliteStore,
  useMountStore,
  useEquipmentStore,
  BUILTIN_CAMERA_PRESETS,
  BUILTIN_TELESCOPE_PRESETS,
  type GridType,
  type BinningType,
} from '@/lib/stores';
import type { StellariumSettings as StellariumSettingsType, SkyCultureLanguage } from '@/lib/core/types';
import {
  Settings,
  Save,
  X,
  RotateCcw,
  Globe,
  Eye,
  Grid3X3,
  Satellite,
  MapPin,
  Palette,
  ChevronDown,
  MapPinOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Camera,
  Telescope,
  Focus,
  LayoutGrid,
  Calculator,
  RotateCw,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StellariumSurveySelector } from '../core/stellarium-survey-selector';
import { ObjectInfoSourcesConfig } from '../objects/object-info-sources-config';
import { cn } from '@/lib/utils';

// ============================================================================
// Settings Configuration
// ============================================================================

const DISPLAY_SETTINGS = [
  { key: 'constellationsLinesVisible' as const, labelKey: 'settings.constellationLines' },
  { key: 'dsosVisible' as const, labelKey: 'settings.deepSkyObjects' },
  { key: 'atmosphereVisible' as const, labelKey: 'settings.atmosphere' },
  { key: 'landscapesVisible' as const, labelKey: 'settings.landscape' },
] as const;

const GRID_SETTINGS = [
  { key: 'azimuthalLinesVisible' as const, labelKey: 'settings.azimuthalGrid' },
  { key: 'equatorialLinesVisible' as const, labelKey: 'settings.equatorialGrid' },
  { key: 'meridianLinesVisible' as const, labelKey: 'settings.meridianLine' },
  { key: 'eclipticLinesVisible' as const, labelKey: 'settings.eclipticLine' },
] as const;

// ============================================================================
// Section Component
// ============================================================================

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SettingsSection({ title, icon, children, defaultOpen = true }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2 w-full overflow-hidden">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">{icon}</span>
            <span className="font-medium text-sm truncate">{title}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            isOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-1 overflow-hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// Toggle Item Component
// ============================================================================

interface ToggleItemProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
  icon?: string;
}

function ToggleItem({ id, label, checked, onCheckedChange, icon }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <Label htmlFor={id} className="text-sm cursor-pointer flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

// ============================================================================
// Location Permission Status Component
// ============================================================================

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown' | 'checking';

function LocationPermissionStatus() {
  const t = useTranslations();
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const setProfileInfo = useMountStore((state) => state.setProfileInfo);
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      setPermissionState('checking');
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(result.state as PermissionState);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state as PermissionState);
          });
        } else {
          // Fallback: try to determine from geolocation API
          setPermissionState('unknown');
        }
      } catch {
        setPermissionState('unknown');
      }
    };
    
    checkPermission();
  }, []);
  
  // Request location
  const handleRequestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      return;
    }
    
    setIsRequesting(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState('granted');
        setIsRequesting(false);
        
        // Update profile with new location
        setProfileInfo({
          ...profileInfo,
          AstrometrySettings: {
            ...profileInfo.AstrometrySettings,
            Latitude: position.coords.latitude,
            Longitude: position.coords.longitude,
            Elevation: position.coords.altitude || profileInfo.AstrometrySettings.Elevation || 0,
          },
        });
      },
      (error) => {
        setIsRequesting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        } else {
          setPermissionState('unknown');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [profileInfo, setProfileInfo]);
  
  const getStatusIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'prompt':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />;
      default:
        return <MapPinOff className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusText = () => {
    switch (permissionState) {
      case 'granted':
        return t('settings.locationGranted');
      case 'denied':
        return t('settings.locationDenied');
      case 'prompt':
        return t('settings.locationPrompt');
      case 'checking':
        return t('settings.locationChecking');
      default:
        return t('settings.locationUnknown');
    }
  };
  
  const getStatusColor = () => {
    switch (permissionState) {
      case 'granted':
        return 'bg-green-500/10 border-green-500/30';
      case 'denied':
        return 'bg-red-500/10 border-red-500/30';
      case 'prompt':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-muted/50 border-border';
    }
  };
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      getStatusColor()
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {getStatusIcon()}
        <div className="min-w-0">
          <span className="text-sm font-medium">{t('settings.locationPermission')}</span>
          <p className="text-xs text-muted-foreground truncate">{getStatusText()}</p>
        </div>
      </div>
      
      {(permissionState === 'prompt' || permissionState === 'unknown' || permissionState === 'granted') && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 ml-2"
          onClick={handleRequestLocation}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span className="ml-1.5 hidden sm:inline">
            {permissionState === 'granted' ? t('settings.refreshLocation') : t('settings.getLocation')}
          </span>
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Grid Type Options
// ============================================================================

const GRID_TYPE_OPTIONS: { value: GridType; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '○' },
  { value: 'crosshair', label: 'Crosshair', icon: '┼' },
  { value: 'thirds', label: 'Thirds', icon: '▦' },
  { value: 'golden', label: 'Golden', icon: '◫' },
  { value: 'diagonal', label: 'Diagonal', icon: '╳' },
];

const BINNING_OPTIONS: BinningType[] = ['1x1', '2x2', '3x3', '4x4'];

const FILTER_OPTIONS = [
  { id: 'L', name: 'Luminance' },
  { id: 'R', name: 'Red' },
  { id: 'G', name: 'Green' },
  { id: 'B', name: 'Blue' },
  { id: 'Ha', name: 'H-Alpha' },
  { id: 'OIII', name: 'OIII' },
  { id: 'SII', name: 'SII' },
  { id: 'NoFilter', name: 'No Filter' },
];

const FRAME_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff',
];

// ============================================================================
// Equipment Settings Component
// ============================================================================

function EquipmentSettingsSection() {
  const t = useTranslations();
  const [addCameraOpen, setAddCameraOpen] = useState(false);
  const [addTelescopeOpen, setAddTelescopeOpen] = useState(false);
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraSensorWidth, setNewCameraSensorWidth] = useState('');
  const [newCameraSensorHeight, setNewCameraSensorHeight] = useState('');
  const [newCameraPixelSize, setNewCameraPixelSize] = useState('');
  const [newTelescopeName, setNewTelescopeName] = useState('');
  const [newTelescopeFocalLength, setNewTelescopeFocalLength] = useState('');
  const [newTelescopeAperture, setNewTelescopeAperture] = useState('');
  
  const {
    sensorWidth,
    sensorHeight,
    focalLength,
    pixelSize,
    aperture,
    rotationAngle,
    activeCameraId,
    activeTelescopeId,
    customCameras,
    customTelescopes,
    setSensorWidth,
    setSensorHeight,
    setFocalLength,
    setPixelSize,
    setAperture,
    setRotationAngle,
    applyCamera,
    applyTelescope,
    addCustomCamera,
    addCustomTelescope,
    removeCustomCamera,
    removeCustomTelescope,
    getFOVWidth,
    getFOVHeight,
    getImageScale,
    getFRatio,
  } = useEquipmentStore();

  const allCameras = useMemo(() => [...BUILTIN_CAMERA_PRESETS, ...customCameras], [customCameras]);
  const allTelescopes = useMemo(() => [...BUILTIN_TELESCOPE_PRESETS, ...customTelescopes], [customTelescopes]);

  const fovWidth = getFOVWidth();
  const fovHeight = getFOVHeight();
  const imageScale = getImageScale();
  const fRatio = getFRatio();

  const handleAddCamera = useCallback(() => {
    if (!newCameraName || !newCameraSensorWidth || !newCameraSensorHeight) return;
    addCustomCamera({
      name: newCameraName,
      sensorWidth: parseFloat(newCameraSensorWidth),
      sensorHeight: parseFloat(newCameraSensorHeight),
      pixelSize: parseFloat(newCameraPixelSize) || 3.76,
    });
    setNewCameraName('');
    setNewCameraSensorWidth('');
    setNewCameraSensorHeight('');
    setNewCameraPixelSize('');
    setAddCameraOpen(false);
  }, [newCameraName, newCameraSensorWidth, newCameraSensorHeight, newCameraPixelSize, addCustomCamera]);

  const handleAddTelescope = useCallback(() => {
    if (!newTelescopeName || !newTelescopeFocalLength) return;
    addCustomTelescope({
      name: newTelescopeName,
      focalLength: parseFloat(newTelescopeFocalLength),
      aperture: parseFloat(newTelescopeAperture) || 80,
      type: 'Custom',
    });
    setNewTelescopeName('');
    setNewTelescopeFocalLength('');
    setNewTelescopeAperture('');
    setAddTelescopeOpen(false);
  }, [newTelescopeName, newTelescopeFocalLength, newTelescopeAperture, addCustomTelescope]);

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" />
          {t('equipment.camera')}
        </Label>
        <div className="flex gap-2">
          <Select
            value={activeCameraId || 'custom'}
            onValueChange={(value) => {
              if (value === 'custom') return;
              const camera = allCameras.find((c) => c.id === value);
              if (camera) applyCamera(camera);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t('equipment.selectCamera')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">
                <span className="text-muted-foreground">{t('equipment.manualInput')}</span>
              </SelectItem>
              <SelectGroup>
                <SelectLabel>{t('equipment.builtInPresets')}</SelectLabel>
                {BUILTIN_CAMERA_PRESETS.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{camera.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {camera.sensorWidth}×{camera.sensorHeight}mm
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
              {customCameras.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{t('equipment.customPresets')}</SelectLabel>
                  {customCameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{camera.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {camera.sensorWidth}×{camera.sensorHeight}mm
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <Dialog open={addCameraOpen} onOpenChange={setAddCameraOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('equipment.addCamera')}</DialogTitle>
                <DialogDescription>{t('equipment.addCameraDescription')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label>{t('equipment.name')}</Label>
                  <Input
                    value={newCameraName}
                    onChange={(e) => setNewCameraName(e.target.value)}
                    placeholder="e.g. ASI294MC Pro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{t('fov.sensorWidth')} (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newCameraSensorWidth}
                      onChange={(e) => setNewCameraSensorWidth(e.target.value)}
                      placeholder="23.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('fov.sensorHeight')} (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newCameraSensorHeight}
                      onChange={(e) => setNewCameraSensorHeight(e.target.value)}
                      placeholder="15.6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('fov.pixelSize')} (μm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCameraPixelSize}
                    onChange={(e) => setNewCameraPixelSize(e.target.value)}
                    placeholder="3.76"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddCameraOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddCamera} disabled={!newCameraName || !newCameraSensorWidth || !newCameraSensorHeight}>
                  {t('common.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Camera Manual Input */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.sensorWidth')}</Label>
            <Input
              type="number"
              step="0.1"
              value={sensorWidth}
              onChange={(e) => setSensorWidth(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.sensorHeight')}</Label>
            <Input
              type="number"
              step="0.1"
              value={sensorHeight}
              onChange={(e) => setSensorHeight(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.pixelSize')}</Label>
            <Input
              type="number"
              step="0.01"
              value={pixelSize}
              onChange={(e) => setPixelSize(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Custom cameras list */}
        {customCameras.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('equipment.customPresets')}</Label>
            <div className="flex flex-wrap gap-1">
              {customCameras.map((camera) => (
                <Badge
                  key={camera.id}
                  variant={activeCameraId === camera.id ? 'default' : 'secondary'}
                  className="cursor-pointer gap-1 pr-1"
                  onClick={() => applyCamera(camera)}
                >
                  {camera.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomCamera(camera.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Telescope Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Telescope className="h-4 w-4" />
          {t('equipment.telescope')}
        </Label>
        <div className="flex gap-2">
          <Select
            value={activeTelescopeId || 'custom'}
            onValueChange={(value) => {
              if (value === 'custom') return;
              const telescope = allTelescopes.find((t) => t.id === value);
              if (telescope) applyTelescope(telescope);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t('equipment.selectTelescope')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">
                <span className="text-muted-foreground">{t('equipment.manualInput')}</span>
              </SelectItem>
              <SelectGroup>
                <SelectLabel>{t('equipment.builtInPresets')}</SelectLabel>
                {BUILTIN_TELESCOPE_PRESETS.map((telescope) => (
                  <SelectItem key={telescope.id} value={telescope.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{telescope.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {telescope.focalLength}mm f/{(telescope.focalLength / telescope.aperture).toFixed(1)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
              {customTelescopes.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{t('equipment.customPresets')}</SelectLabel>
                  {customTelescopes.map((telescope) => (
                    <SelectItem key={telescope.id} value={telescope.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{telescope.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {telescope.focalLength}mm
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <Dialog open={addTelescopeOpen} onOpenChange={setAddTelescopeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('equipment.addTelescope')}</DialogTitle>
                <DialogDescription>{t('equipment.addTelescopeDescription')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label>{t('equipment.name')}</Label>
                  <Input
                    value={newTelescopeName}
                    onChange={(e) => setNewTelescopeName(e.target.value)}
                    placeholder="e.g. Newton 200/1000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{t('fov.focalLength')} (mm)</Label>
                    <Input
                      type="number"
                      value={newTelescopeFocalLength}
                      onChange={(e) => setNewTelescopeFocalLength(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('equipment.aperture')} (mm)</Label>
                    <Input
                      type="number"
                      value={newTelescopeAperture}
                      onChange={(e) => setNewTelescopeAperture(e.target.value)}
                      placeholder="200"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddTelescopeOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddTelescope} disabled={!newTelescopeName || !newTelescopeFocalLength}>
                  {t('common.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Telescope Manual Input */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('fov.focalLength')} (mm)</Label>
            <Input
              type="number"
              value={focalLength}
              onChange={(e) => setFocalLength(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('equipment.aperture')} (mm)</Label>
            <Input
              type="number"
              value={aperture}
              onChange={(e) => setAperture(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Custom telescopes list */}
        {customTelescopes.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('equipment.customPresets')}</Label>
            <div className="flex flex-wrap gap-1">
              {customTelescopes.map((telescope) => (
                <Badge
                  key={telescope.id}
                  variant={activeTelescopeId === telescope.id ? 'default' : 'secondary'}
                  className="cursor-pointer gap-1 pr-1"
                  onClick={() => applyTelescope(telescope)}
                >
                  {telescope.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomTelescope(telescope.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Rotation Angle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">
            <RotateCw className="h-4 w-4" />
            {t('fov.rotation')}
          </Label>
          <span className="text-xs text-muted-foreground font-mono">{rotationAngle.toFixed(1)}°</span>
        </div>
        <div className="flex gap-2">
          <Slider
            value={[rotationAngle]}
            onValueChange={([v]) => setRotationAngle(v)}
            min={-180}
            max={180}
            step={0.5}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => setRotationAngle(0)}
          >
            {t('common.reset')}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Calculated FOV Info */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Focus className="h-4 w-4" />
          {t('fov.calculatedFOV')}
        </Label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.fieldWidth')}</span>
            <span className="font-mono">{fovWidth.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.fieldHeight')}</span>
            <span className="font-mono">{fovHeight.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('fov.imageScale')}</span>
            <span className="font-mono">{imageScale.toFixed(2)}&quot;/px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('exposure.fRatio')}</span>
            <span className="font-mono">f/{fRatio.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FOV Display Settings Component
// ============================================================================

function FOVDisplaySettingsSection() {
  const t = useTranslations();
  const {
    fovDisplay,
    mosaic,
    setFOVDisplay,
    setFOVEnabled,
    setGridType,
    setMosaic,
    setMosaicEnabled,
    setMosaicGrid,
    setMosaicOverlap,
  } = useEquipmentStore();

  return (
    <div className="space-y-4">
      {/* Enable FOV Overlay */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
        <Label htmlFor="fov-enabled" className="text-sm cursor-pointer flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          {t('fov.showFovOverlay')}
        </Label>
        <Switch
          id="fov-enabled"
          checked={fovDisplay.enabled}
          onCheckedChange={setFOVEnabled}
        />
      </div>

      {/* Grid Type */}
      <div className="space-y-2">
        <Label className="text-sm">{t('fov.compositionGrid')}</Label>
        <div className="grid grid-cols-5 gap-1">
          {GRID_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={fovDisplay.gridType === option.value ? 'default' : 'outline'}
              size="sm"
              className="h-10 flex-col gap-0.5 text-xs"
              onClick={() => setGridType(option.value)}
            >
              <span className="text-base font-mono">{option.icon}</span>
              <span className="text-[10px]">{option.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Mosaic Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">
            <Grid3X3 className="h-4 w-4" />
            {t('fov.enableMosaic')}
          </Label>
          <Switch
            checked={mosaic.enabled}
            onCheckedChange={setMosaicEnabled}
          />
        </div>
        
        {mosaic.enabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fov.columns')}</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(mosaic.rows, Math.max(1, mosaic.cols - 1))}
                    disabled={mosaic.cols <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={mosaic.cols}
                    onChange={(e) => setMosaicGrid(mosaic.rows, Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 w-12 text-center"
                    min={1}
                    max={10}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(mosaic.rows, Math.min(10, mosaic.cols + 1))}
                    disabled={mosaic.cols >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('fov.rows')}</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(Math.max(1, mosaic.rows - 1), mosaic.cols)}
                    disabled={mosaic.rows <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={mosaic.rows}
                    onChange={(e) => setMosaicGrid(Math.max(1, parseInt(e.target.value) || 1), mosaic.cols)}
                    className="h-7 w-12 text-center"
                    min={1}
                    max={10}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setMosaicGrid(Math.min(10, mosaic.rows + 1), mosaic.cols)}
                    disabled={mosaic.rows >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('fov.overlap')}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {mosaic.overlap}{mosaic.overlapUnit === 'percent' ? '%' : 'px'}
                  </Badge>
                  <Select
                    value={mosaic.overlapUnit}
                    onValueChange={(v: 'percent' | 'pixels') => setMosaic({ ...mosaic, overlapUnit: v })}
                  >
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="pixels">px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Slider
                value={[mosaic.overlap]}
                onValueChange={([v]) => setMosaicOverlap(v)}
                min={0}
                max={mosaic.overlapUnit === 'percent' ? 50 : 500}
                step={mosaic.overlapUnit === 'percent' ? 5 : 50}
              />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('fov.displayOptions')}</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('fov.showCoordinateGrid')}</span>
            <Switch
              checked={fovDisplay.showCoordinateGrid}
              onCheckedChange={(checked) => setFOVDisplay({ showCoordinateGrid: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('fov.showDSOLabels')}</span>
            <Switch
              checked={fovDisplay.showDSOLabels}
              onCheckedChange={(checked) => setFOVDisplay({ showDSOLabels: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Overlay Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('fov.overlayOpacity')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{fovDisplay.overlayOpacity}%</span>
        </div>
        <Slider
          value={[fovDisplay.overlayOpacity]}
          onValueChange={([v]) => setFOVDisplay({ overlayOpacity: v })}
          min={10}
          max={100}
          step={5}
        />
      </div>

      {/* Frame Color */}
      <div className="space-y-2">
        <Label className="text-sm">{t('fov.frameColor')}</Label>
        <div className="flex gap-1">
          {FRAME_COLORS.map((color) => (
            <Button
              key={color}
              variant="outline"
              size="icon"
              className={cn(
                "w-7 h-7 p-0 rounded-full",
                fovDisplay.frameColor === color && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setFOVDisplay({ frameColor: color })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Exposure Defaults Settings Component
// ============================================================================

function ExposureDefaultsSection() {
  const t = useTranslations();
  const { exposureDefaults, setExposureDefaults } = useEquipmentStore();

  return (
    <div className="space-y-4">
      {/* Exposure Time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultExposure')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{exposureDefaults.exposureTime}s</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {[30, 60, 120, 180, 300, 600].map((time) => (
            <Button
              key={time}
              variant={exposureDefaults.exposureTime === time ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExposureDefaults({ exposureTime: time })}
            >
              {time}s
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Gain & Offset */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t('exposure.gain')}</Label>
          <Input
            type="number"
            value={exposureDefaults.gain}
            onChange={(e) => setExposureDefaults({ gain: parseInt(e.target.value) || 0 })}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('exposure.offset')}</Label>
          <Input
            type="number"
            value={exposureDefaults.offset}
            onChange={(e) => setExposureDefaults({ offset: parseInt(e.target.value) || 0 })}
            className="h-8"
          />
        </div>
      </div>

      {/* Binning */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.binning')}</Label>
        <div className="flex gap-1">
          {BINNING_OPTIONS.map((b) => (
            <Button
              key={b}
              variant={exposureDefaults.binning === b ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setExposureDefaults({ binning: b })}
            >
              {b}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-2">
        <Label className="text-sm">{t('exposure.filter')}</Label>
        <Select
          value={exposureDefaults.filter}
          onValueChange={(v) => setExposureDefaults({ filter: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Frame Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultFrameCount')}</Label>
          <span className="text-xs text-muted-foreground font-mono">{exposureDefaults.frameCount}</span>
        </div>
        <Slider
          value={[exposureDefaults.frameCount]}
          onValueChange={([v]) => setExposureDefaults({ frameCount: v })}
          min={1}
          max={200}
          step={1}
        />
      </div>

      {/* Dither */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
        <div className="space-y-0.5">
          <Label htmlFor="dither-enabled" className="text-sm cursor-pointer">{t('exposure.dither')}</Label>
          <p className="text-[10px] text-muted-foreground">{t('exposure.ditherDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="dither-enabled"
            checked={exposureDefaults.ditherEnabled}
            onCheckedChange={(checked) => setExposureDefaults({ ditherEnabled: checked })}
          />
          {exposureDefaults.ditherEnabled && (
            <Input
              type="number"
              value={exposureDefaults.ditherEvery}
              onChange={(e) => setExposureDefaults({ ditherEvery: Math.max(1, parseInt(e.target.value) || 1) })}
              className="h-7 w-12 text-center text-xs"
              min={1}
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Bortle Scale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('exposure.defaultBortle')}</Label>
          <Badge variant="outline" className="font-mono">{exposureDefaults.bortle}</Badge>
        </div>
        <Slider
          value={[exposureDefaults.bortle]}
          onValueChange={([v]) => setExposureDefaults({ bortle: v })}
          min={1}
          max={9}
          step={1}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedSettings() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('display');
  
  // Stellarium settings
  const storeSettings = useSettingsStore((state) => state.stellarium);
  const setStellariumSettings = useSettingsStore((state) => state.setStellariumSettings);
  const [localSettings, setLocalSettings] = useState<StellariumSettingsType>(storeSettings);
  
  // Satellite settings
  const showSatellites = useSatelliteStore((state) => state.showSatellites);
  const showSatelliteLabels = useSatelliteStore((state) => state.showLabels);
  const setShowSatellites = useSatelliteStore((state) => state.setShowSatellites);
  const setShowSatelliteLabels = useSatelliteStore((state) => state.setShowLabels);
  
  // Equipment settings
  const resetEquipment = useEquipmentStore((state) => state.resetToDefaults);
  
  // Location info
  const profileInfo = useMountStore((state) => state.profileInfo);
  
  // Calculate hasChanges
  const hasChanges = useMemo(() => {
    return JSON.stringify(localSettings) !== JSON.stringify(storeSettings);
  }, [localSettings, storeSettings]);

  // Handle dialog open state change
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setLocalSettings(storeSettings);
    }
    setOpen(isOpen);
  }, [storeSettings]);

  // Toggle a setting locally
  const toggleLocalSetting = useCallback((key: keyof StellariumSettingsType) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Update survey settings locally
  const handleSurveyChange = useCallback((surveyId: string, surveyUrl?: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      surveyId,
      surveyUrl,
    }));
  }, []);

  const handleSurveyToggle = useCallback((enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      surveyEnabled: enabled,
    }));
  }, []);

  // Save all settings
  const handleSave = useCallback(() => {
    setStellariumSettings(localSettings);
    setOpen(false);
  }, [localSettings, setStellariumSettings]);

  // Cancel and reset
  const handleCancel = useCallback(() => {
    setLocalSettings(storeSettings);
    setOpen(false);
  }, [storeSettings]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setLocalSettings({
      constellationsLinesVisible: true,
      azimuthalLinesVisible: false,
      equatorialLinesVisible: false,
      meridianLinesVisible: false,
      eclipticLinesVisible: false,
      atmosphereVisible: false,
      landscapesVisible: false,
      dsosVisible: true,
      surveyEnabled: true,
      surveyId: 'dss',
      surveyUrl: undefined,
      skyCultureLanguage: 'native',
    });
    resetEquipment();
  }, [resetEquipment]);

  // Update sky culture language
  const handleSkyCultureLanguageChange = useCallback((value: SkyCultureLanguage) => {
    setLocalSettings((prev) => ({
      ...prev,
      skyCultureLanguage: value,
    }));
  }, []);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 backdrop-blur-sm touch-target toolbar-btn",
                open ? "bg-primary/30 text-primary" : "bg-black/60 text-white hover:bg-black/80"
              )}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{t('settings.displaySettings')}</p>
        </TooltipContent>
      </Tooltip>
      
      <DrawerContent className="w-[90vw] max-w-[340px] sm:max-w-[420px] md:max-w-[480px] h-full flex flex-col drawer-content">
        <DrawerHeader className="border-b shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settings.allSettings')}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('common.reset')}
            </Button>
          </div>
        </DrawerHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="display" className="text-xs px-1">
              <Eye className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t('settings.displayTab')}</span>
              <span className="sm:hidden">{t('settings.displayTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-xs px-1">
              <Camera className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t('settings.equipmentTab')}</span>
              <span className="sm:hidden">{t('settings.equipmentTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="fov" className="text-xs px-1">
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t('settings.fovTab')}</span>
              <span className="sm:hidden">{t('settings.fovTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="exposure" className="text-xs px-1">
              <Calculator className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t('settings.exposureTab')}</span>
              <span className="sm:hidden">{t('settings.exposureTabShort')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Display Settings Tab */}
          <TabsContent value="display" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Display Settings */}
                <SettingsSection
                  title={t('settings.displaySettings')}
                  icon={<Eye className="h-4 w-4" />}
                >
                  {DISPLAY_SETTINGS.map(({ key, labelKey }) => (
                    <ToggleItem
                      key={key}
                      id={key}
                      label={t(labelKey)}
                      checked={localSettings[key] as boolean}
                      onCheckedChange={() => toggleLocalSetting(key)}
                    />
                  ))}
                </SettingsSection>

                <Separator />

                {/* Grid Settings */}
                <SettingsSection
                  title={t('settings.gridLines')}
                  icon={<Grid3X3 className="h-4 w-4" />}
                  defaultOpen={true}
                >
                  {GRID_SETTINGS.map(({ key, labelKey }) => (
                    <ToggleItem
                      key={key}
                      id={key}
                      label={t(labelKey)}
                      checked={localSettings[key] as boolean}
                      onCheckedChange={() => toggleLocalSetting(key)}
                    />
                  ))}
                </SettingsSection>

                <Separator />

                {/* Satellite Settings */}
                <SettingsSection
                  title={t('satellites.satelliteTracker')}
                  icon={<Satellite className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <ToggleItem
                    id="show-satellites"
                    label={t('satellites.showOnMap')}
                    checked={showSatellites}
                    onCheckedChange={() => setShowSatellites(!showSatellites)}
                  />
                  <ToggleItem
                    id="show-satellite-labels"
                    label={t('satellites.showLabels')}
                    checked={showSatelliteLabels}
                    onCheckedChange={() => setShowSatelliteLabels(!showSatelliteLabels)}
                  />
                </SettingsSection>

                <Separator />

                {/* Sky Culture Language */}
                <SettingsSection
                  title={t('settings.skyCultureLanguage')}
                  icon={<Globe className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <Select
                    value={localSettings.skyCultureLanguage}
                    onValueChange={handleSkyCultureLanguageChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('settings.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="native">{t('settings.languageNative')}</SelectItem>
                      <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
                      <SelectItem value="zh">{t('settings.languageChinese')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground px-1">
                    {t('settings.skyCultureLanguageDescription')}
                  </p>
                </SettingsSection>

                <Separator />

                {/* Sky Survey Settings */}
                <SettingsSection
                  title={t('settings.skySurveys')}
                  icon={<Palette className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <StellariumSurveySelector
                    surveyEnabled={localSettings.surveyEnabled}
                    surveyId={localSettings.surveyId}
                    surveyUrl={localSettings.surveyUrl}
                    onSurveyChange={handleSurveyChange}
                    onSurveyToggle={handleSurveyToggle}
                  />
                </SettingsSection>

                <Separator />

                {/* Location Info */}
                <SettingsSection
                  title={t('settings.location')}
                  icon={<MapPin className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    <LocationPermissionStatus />
                    <div className="space-y-2 px-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('settings.latitude')}</span>
                        <span className="font-mono">{profileInfo.AstrometrySettings.Latitude?.toFixed(4) || '0'}°</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('settings.longitude')}</span>
                        <span className="font-mono">{profileInfo.AstrometrySettings.Longitude?.toFixed(4) || '0'}°</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('settings.elevation')}</span>
                        <span className="font-mono">{profileInfo.AstrometrySettings.Elevation || '0'} m</span>
                      </div>
                    </div>
                  </div>
                </SettingsSection>

                <Separator />

                {/* Information Sources */}
                <SettingsSection
                  title={t('sourceConfig.title')}
                  icon={<Database className="h-4 w-4" />}
                  defaultOpen={false}
                >
                  <ObjectInfoSourcesConfig />
                </SettingsSection>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Equipment Settings Tab */}
          <TabsContent value="equipment" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <EquipmentSettingsSection />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* FOV Settings Tab */}
          <TabsContent value="fov" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <FOVDisplaySettingsSection />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Exposure Settings Tab */}
          <TabsContent value="exposure" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <ExposureDefaultsSection />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DrawerFooter className="border-t shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

