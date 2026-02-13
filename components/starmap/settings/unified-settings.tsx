'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings,
  RotateCcw,
  Eye,
  Camera,
  Sliders,
  HardDrive,
  Info,
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
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
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
  useSettingsStore,
  useEquipmentStore,
} from '@/lib/stores';
import { useThemeStore } from '@/lib/stores/theme-store';
import { MapProviderSettings, MapHealthMonitor } from '../map';
import { cn } from '@/lib/utils';
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
import { NotificationSettings } from './notification-settings';
import { SearchBehaviorSettings } from './search-settings';
import { KeyboardSettings } from './keyboard-settings';
import { AboutSettings } from './about-settings';
import { DataManager } from '../management/data-manager';
import { OnboardingRestartButton } from '../onboarding/welcome-dialog';
import { EventSourcesSettings } from './event-sources-settings';
import { SettingsExportImport } from './settings-export-import';
import { UpdateSettings } from '../management/updater/update-settings';
import { isTauri } from '@/lib/tauri/app-control-api';

export function UnifiedSettings() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('display');
  
  const resetSettings = useSettingsStore((state) => state.resetToDefaults);
  const resetEquipment = useEquipmentStore((state) => state.resetToDefaults);
  const resetTheme = useThemeStore((state) => state.resetCustomization);

  const handleResetAll = useCallback(() => {
    resetSettings();
    resetEquipment();
    resetTheme();
  }, [resetSettings, resetEquipment, resetTheme]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t('common.reset')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('common.reset')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.resetAllDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>
                    {t('common.reset')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DrawerHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
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
            <TabsTrigger value="preferences" className="text-[10px] sm:text-xs px-0.5 sm:px-1 py-1.5 flex-col sm:flex-row gap-0.5 sm:gap-1 h-auto">
              <Sliders className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline truncate">{t('settingsNew.tabs.general')}</span>
              <span className="sm:hidden truncate">{t('settingsNew.tabs.generalShort')}</span>
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

          {/* Display Settings Tab — includes stellarium display, connection, location */}
          <TabsContent value="display" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <DisplaySettings />
              <Separator className="mx-4" />
              <div className="px-4 pb-4">
                <ConnectionSettings />
                <Separator className="my-4" />
                <LocationSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Equipment Tab — includes equipment, FOV, exposure */}
          <TabsContent value="equipment" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <EquipmentSettings />
                <Separator />
                <FOVSettings />
                <Separator />
                <ExposureSettings />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Preferences Tab — includes general, appearance, performance, accessibility, notifications, search, keyboard */}
          <TabsContent value="preferences" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <GeneralSettings />
                <Separator />
                <AppearanceSettings />
                <Separator />
                <PerformanceSettings />
                <Separator />
                <NotificationSettings />
                <Separator />
                <SearchBehaviorSettings />
                <Separator />
                <AccessibilitySettings />
                <Separator />
                <KeyboardSettings />
                <Separator />
                <EventSourcesSettings />
                {isTauri() && (
                  <>
                    <Separator />
                    <UpdateSettings />
                  </>
                )}
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
                <SettingsExportImport />
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">{t('setupWizard.steps.welcome.title')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.welcome.subtitle')}
                  </p>
                </div>
                <OnboardingRestartButton variant="outline" className="w-full" />
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
      </DrawerContent>
    </Drawer>
  );
}
