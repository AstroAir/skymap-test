'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSettingsStore, useSatelliteStore, useMountStore } from '@/lib/starmap/stores';
import type { StellariumSettings as StellariumSettingsType, SkyCultureLanguage } from '@/lib/starmap/types';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { StellariumSurveySelector } from './StellariumSurveySelector';
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
// Main Component
// ============================================================================

export function UnifiedSettings() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  
  // Stellarium settings
  const storeSettings = useSettingsStore((state) => state.stellarium);
  const setStellariumSettings = useSettingsStore((state) => state.setStellariumSettings);
  const [localSettings, setLocalSettings] = useState<StellariumSettingsType>(storeSettings);
  
  // Satellite settings
  const showSatellites = useSatelliteStore((state) => state.showSatellites);
  const showSatelliteLabels = useSatelliteStore((state) => state.showLabels);
  const setShowSatellites = useSatelliteStore((state) => state.setShowSatellites);
  const setShowSatelliteLabels = useSatelliteStore((state) => state.setShowLabels);
  
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
  }, []);

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
                "h-10 w-10 backdrop-blur-sm",
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
      
      <DrawerContent className="w-[320px] sm:w-[400px] md:w-[450px] h-full flex flex-col">
        <DrawerHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settings.displaySettings')}
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
        
        <ScrollArea className="flex-1 w-full">
          <div className="p-4 space-y-4 overflow-hidden">
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
                {/* Location Permission Status */}
                <LocationPermissionStatus />
                
                {/* Location Data */}
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
          </div>
        </ScrollArea>

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
