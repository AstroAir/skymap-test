'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  Save,
  X,
  RotateCcw,
  Eye,
  Camera,
  LayoutGrid,
  Calculator,
  HardDrive,
  Palette,
  Gauge,
  Accessibility,
  Info,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  useSettingsStore,
  useEquipmentStore,
} from '@/lib/stores';
import type { StellariumSettings as StellariumSettingsType, SkyCultureLanguage } from '@/lib/core/types';
import { MapProviderSettings, MapHealthMonitor } from '../map';
import { cn } from '@/lib/utils';
import { DEFAULT_STELLARIUM_SETTINGS } from './settings-constants';
import { DisplaySettings } from './display-settings';
import { EquipmentSettings } from './equipment-settings';
import { FOVSettings } from './fov-settings';
import { ExposureSettings } from './exposure-settings';
import { LocationSettings } from './location-settings';
import { ConnectionSettings } from './connection-settings';
import { AppearanceSettings } from './appearance-settings';
import { GeneralSettings } from './general-settings';
import { PerformanceSettings } from './performance-settings';
import { AccessibilitySettings } from './accessibility-settings';
import { AboutSettings } from './about-settings';
import { DataManager } from '../management/data-manager';
import { SetupWizardButton } from '../setup-wizard';

const DEFAULT_CONNECTION = { ip: 'localhost', port: '1888' };
const DEFAULT_BACKEND_PROTOCOL: 'http' | 'https' = 'http';

export function UnifiedSettings() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('display');
  
  // Stellarium settings
  const storeSettings = useSettingsStore((state) => state.stellarium);
  const setStellariumSettings = useSettingsStore((state) => state.setStellariumSettings);
  const [localSettings, setLocalSettings] = useState<StellariumSettingsType>(storeSettings);
  
  // Connection settings
  const connection = useSettingsStore((state) => state.connection);
  const setConnection = useSettingsStore((state) => state.setConnection);
  const backendProtocol = useSettingsStore((state) => state.backendProtocol);
  const setBackendProtocol = useSettingsStore((state) => state.setBackendProtocol);
  const [localConnection, setLocalConnection] = useState(connection);
  const [localProtocol, setLocalProtocol] = useState(backendProtocol);
  
  // Equipment settings
  const resetEquipment = useEquipmentStore((state) => state.resetToDefaults);
  
  // Calculate hasChanges
  const hasChanges = useMemo(() => {
    const stellariumChanged = JSON.stringify(localSettings) !== JSON.stringify(storeSettings);
    const connectionChanged =
      localConnection.ip !== connection.ip ||
      localConnection.port !== connection.port;
    const protocolChanged = localProtocol !== backendProtocol;

    return stellariumChanged || connectionChanged || protocolChanged;
  }, [
    localSettings,
    storeSettings,
    localConnection,
    connection,
    localProtocol,
    backendProtocol,
  ]);

  // Handle dialog open state change
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setLocalSettings(storeSettings);
      setLocalConnection(connection);
      setLocalProtocol(backendProtocol);
    }
    setOpen(isOpen);
  }, [storeSettings, connection, backendProtocol]);

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
    setConnection(localConnection);
    setBackendProtocol(localProtocol);
    setOpen(false);
  }, [localSettings, setStellariumSettings, localConnection, setConnection, localProtocol, setBackendProtocol]);

  // Cancel and reset
  const handleCancel = useCallback(() => {
    setLocalSettings(storeSettings);
    setLocalConnection(connection);
    setLocalProtocol(backendProtocol);
    setOpen(false);
  }, [storeSettings, connection, backendProtocol]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setLocalSettings(DEFAULT_STELLARIUM_SETTINGS as StellariumSettingsType);
    setLocalConnection(DEFAULT_CONNECTION);
    setLocalProtocol(DEFAULT_BACKEND_PROTOCOL);
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
                "h-9 w-9 backdrop-blur-md border border-border/50 touch-target toolbar-btn",
                open
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-card/80 text-foreground/80 hover:text-foreground hover:bg-accent"
              )}
            >
              <Settings className="h-4 w-4" />
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
          {/* Primary Tabs Row */}
          <TabsList className="grid w-full grid-cols-5 shrink-0 mx-2 sm:mx-4 mt-2 h-auto" style={{ width: 'calc(100% - 1rem)' }}>
            <TabsTrigger value="display" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settings.displayTab')}</span>
              <span className="sm:hidden truncate">{t('settings.displayTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settings.equipmentTab')}</span>
              <span className="sm:hidden truncate">{t('settings.equipmentTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="fov" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <LayoutGrid className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settings.fovTab')}</span>
              <span className="sm:hidden truncate">{t('settings.fovTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="exposure" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Calculator className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settings.exposureTab')}</span>
              <span className="sm:hidden truncate">{t('settings.exposureTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Sliders className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settingsNew.tabs.general')}</span>
              <span className="sm:hidden truncate">{t('settingsNew.tabs.generalShort')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Secondary Tabs Row */}
          <TabsList className="grid w-full grid-cols-5 shrink-0 mx-2 sm:mx-4 mt-1 h-auto" style={{ width: 'calc(100% - 1rem)' }}>
            <TabsTrigger value="appearance" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settingsNew.tabs.appearance')}</span>
              <span className="sm:hidden truncate">{t('settingsNew.tabs.appearanceShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settingsNew.tabs.performance')}</span>
              <span className="sm:hidden truncate">{t('settingsNew.tabs.performanceShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Accessibility className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settingsNew.tabs.accessibility')}</span>
              <span className="sm:hidden truncate">{t('settingsNew.tabs.accessibilityShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <HardDrive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settings.dataTab')}</span>
              <span className="sm:hidden truncate">{t('settings.dataTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settingsNew.tabs.about')}</span>
              <span className="sm:hidden truncate">{t('settingsNew.tabs.aboutShort')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Display Settings Tab */}
          <TabsContent value="display" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <DisplaySettings
                localSettings={localSettings}
                onToggleSetting={toggleLocalSetting}
                onSurveyChange={handleSurveyChange}
                onSurveyToggle={handleSurveyToggle}
                onSkyCultureLanguageChange={handleSkyCultureLanguageChange}
              />
              <Separator className="mx-4" />
              <div className="px-4 pb-4">
                <ConnectionSettings
                  localConnection={localConnection}
                  localProtocol={localProtocol}
                  onConnectionChange={setLocalConnection}
                  onProtocolChange={setLocalProtocol}
                />
                <Separator className="my-4" />
                <LocationSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Equipment Settings Tab */}
          <TabsContent value="equipment" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <EquipmentSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* FOV Settings Tab */}
          <TabsContent value="fov" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <FOVSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Exposure Settings Tab */}
          <TabsContent value="exposure" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <ExposureSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <GeneralSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <AppearanceSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Performance Settings Tab */}
          <TabsContent value="performance" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <PerformanceSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Accessibility Settings Tab */}
          <TabsContent value="accessibility" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('settings.autoSaveHint')}</p>
                </div>
                <AccessibilitySettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <MapHealthMonitor className="mb-4" />
                <MapProviderSettings />
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">{t('dataManager.title')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('dataManager.description')}
                  </p>
                </div>
                <DataManager 
                  trigger={
                    <Button variant="outline" className="w-full">
                      <HardDrive className="h-4 w-4 mr-2" />
                      {t('dataManager.openManager')}
                    </Button>
                  } 
                />
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">{t('setupWizard.steps.welcome.title')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.welcome.subtitle')}
                  </p>
                </div>
                <SetupWizardButton variant="outline" className="w-full" />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <AboutSettings />
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
