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
  Globe,
  HardDrive,
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
import { MapProviderSettings, MapHealthMonitor } from '../../map';
import { cn } from '@/lib/utils';
import { DEFAULT_STELLARIUM_SETTINGS } from './settings-constants';
import { DisplaySettings } from './display-settings';
import { EquipmentSettings } from './equipment-settings';
import { FOVSettings } from './fov-settings';
import { ExposureSettings } from './exposure-settings';
import { LocationSettings } from './location-settings';
import { ConnectionSettings } from './connection-settings';
import { DataManager } from '../data-manager';
import { SetupWizardButton } from '../../setup-wizard';

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
    return JSON.stringify(localSettings) !== JSON.stringify(storeSettings);
  }, [localSettings, storeSettings]);

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
    setOpen(false);
  }, [storeSettings]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setLocalSettings(DEFAULT_STELLARIUM_SETTINGS as StellariumSettingsType);
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
          <TabsList className="grid w-full grid-cols-6 shrink-0 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
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
            <TabsTrigger value="map" className="text-xs px-1">
              <Globe className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t('settings.mapTab') || 'Map'}</span>
              <span className="sm:hidden">{t('settings.mapTabShort') || 'Map'}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs px-1">
              <HardDrive className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">{t('settings.dataTab') || 'Data'}</span>
              <span className="sm:hidden">{t('settings.dataTabShort') || 'Data'}</span>
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
                <EquipmentSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* FOV Settings Tab */}
          <TabsContent value="fov" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <FOVSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Exposure Settings Tab */}
          <TabsContent value="exposure" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <ExposureSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Map Settings Tab */}
          <TabsContent value="map" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <MapHealthMonitor className="mb-4" />
                <MapProviderSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">{t('dataManager.title') || 'Data Management'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('dataManager.description') || 'Export, import, or clear your saved data including targets, markers, and settings.'}
                  </p>
                </div>
                <DataManager 
                  trigger={
                    <Button variant="outline" className="w-full">
                      <HardDrive className="h-4 w-4 mr-2" />
                      {t('dataManager.openManager') || 'Open Data Manager'}
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
