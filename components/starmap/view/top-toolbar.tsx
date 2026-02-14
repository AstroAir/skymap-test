'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, Menu, RotateCcw, PanelLeftClose, PanelLeft, LogOut, Compass, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { ToolbarButton, ToolbarGroup } from '@/components/common/toolbar-button';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { NightModeToggle } from '@/components/common/night-mode-toggle';
import { SensorControlToggle } from '@/components/common/sensor-control-toggle';
import { AppControlMenu } from '@/components/common/app-control-menu';

import { StellariumClock } from '../time/stellarium-clock';
import { StellariumSettings } from '../settings/stellarium-settings';
import { UnifiedSettings } from '../management/unified-settings';
import { OfflineCacheManager } from '../management/offline-cache-manager';
import { TonightRecommendations } from '../planning/tonight-recommendations';
import { SkyAtlasPanel } from '../planning/sky-atlas-panel';
import { AstroEventsCalendar } from '../planning/astro-events-calendar';
import { AstroCalculatorDialog } from '../planning/astro-calculator-dialog';
import { SessionPlanner } from '../planning/session-planner';
import { SatelliteTracker } from '../overlays/satellite-tracker';
import { OcularSimulator } from '../overlays/ocular-simulator';
import { PlateSolverUnified } from '../plate-solving/plate-solver-unified';
import { EquipmentManager } from '../management/equipment-manager';
import { KeyboardShortcutsDialog } from '../dialogs/keyboard-shortcuts-dialog';
import { AboutDialog } from '../dialogs/about-dialog';
import { QuickActionsPanel } from '../controls/quick-actions-panel';
import { NavigationHistory } from '../controls/navigation-history';
import { ViewBookmarks } from '../controls/view-bookmarks';
import { ObjectTypeLegend } from '../objects/object-type-legend';

import { isTauri, quitApp, toggleMaximizeWindow } from '@/lib/tauri/app-control-api';
import type { TopToolbarProps } from '@/types/starmap/view';

export const TopToolbar = memo(function TopToolbar({
  stel,
  isSearchOpen,
  showSessionPanel,
  viewCenterRaDec,
  currentFov,
  onToggleSearch,
  onToggleSessionPanel,
  onResetView,
  onCloseStarmapClick,
  onSetFov,
  onNavigate,
  onGoToCoordinates,
}: TopToolbarProps) {
  const t = useTranslations();

  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none safe-area-top animate-fade-in">
      {/* Drag region layer - covers entire top bar area, double-click to maximize */}
      <div
        data-tauri-drag-region
        className="absolute inset-0 h-12 pointer-events-auto"
        style={{ zIndex: 0 }}
        onDoubleClick={() => {
          if (isTauri()) {
            toggleMaximizeWindow();
          }
        }}
      />

      <div className="relative p-2 sm:p-3 flex items-center justify-between" style={{ zIndex: 1 }}>
        {/* Left: Menu, Search, Discovery & Navigation */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Mobile Menu */}
          <MobileMenuDrawer stel={stel} />

          {/* Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-tour-id="search-button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 backdrop-blur-md border border-border/50 touch-target toolbar-btn",
                  isSearchOpen
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-card/60 text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
                onClick={onToggleSearch}
              >
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t('starmap.searchObjects')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Discovery Group - "What to observe" */}
          <div className="hidden md:flex items-center gap-1.5">
            <ToolbarGroup gap="none" className="p-0.5" data-tour-id="tonight-button">
              <TonightRecommendations />
              <SkyAtlasPanel />
            </ToolbarGroup>

            {/* Navigation Group - "Where to look" */}
            <ToolbarGroup gap="none" className="p-0.5">
              <QuickActionsPanel
                onZoomToFov={onSetFov}
                onResetView={onResetView}
              />
              <NavigationHistory onNavigate={onNavigate} />
              <ViewBookmarks
                currentRa={viewCenterRaDec.ra}
                currentDec={viewCenterRaDec.dec}
                currentFov={currentFov}
                onNavigate={onNavigate}
              />
            </ToolbarGroup>
          </div>
        </div>

        {/* Center: Time Display */}
        <div className="pointer-events-auto hidden sm:block animate-fade-in">
          {stel && <StellariumClock />}
        </div>

        {/* Right: Planning → Instruments → Config → Display → Preferences → View/Help → Window */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Desktop Toolbar Groups */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Observation Planning Group */}
            <ToolbarGroup gap="none" className="p-0.5">
              <SessionPlanner />
              <AstroEventsCalendar />
              <AstroCalculatorDialog />
            </ToolbarGroup>

            {/* Instruments & Analysis Group */}
            <ToolbarGroup gap="none" className="p-0.5">
              <PlateSolverUnified onGoToCoordinates={onGoToCoordinates} />
              <OcularSimulator />
              <SatelliteTracker />
            </ToolbarGroup>

            {/* Configuration Group */}
            <ToolbarGroup gap="none" className="p-0.5" data-tour-id="settings-button">
              <UnifiedSettings />
              <EquipmentManager />
            </ToolbarGroup>

            {/* Display Mode Group */}
            <ToolbarGroup gap="none" className="p-0.5">
              <NightModeToggle className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent rounded-md" />
              <SensorControlToggle className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent rounded-md" />
              <ObjectTypeLegend variant="popover" />
            </ToolbarGroup>

            {/* UI Preferences Group */}
            <ToolbarGroup gap="none" className="p-0.5">
              <ThemeToggle variant="icon" className="h-9 w-9" />
              <LanguageSwitcher className="h-9 w-9 text-foreground/80 hover:text-foreground hover:bg-accent rounded-md" />
            </ToolbarGroup>
          </div>

          {/* View & Help Group (always visible) */}
          <ToolbarGroup gap="none" className="p-0.5">
            <ToolbarButton
              icon={showSessionPanel ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              label={showSessionPanel ? t('starmap.hideSessionInfo') : t('starmap.showSessionInfo')}
              iconOnly
              isActive={showSessionPanel}
              onClick={onToggleSessionPanel}
            />
            <ToolbarButton
              icon={<RotateCcw className="h-4 w-4" />}
              label={t('starmap.resetView')}
              iconOnly
              onClick={onResetView}
            />
            <KeyboardShortcutsDialog />
            <AboutDialog />
          </ToolbarGroup>

          {/* Window Controls Group */}
          <ToolbarGroup gap="none" className="p-0.5">
            <ToolbarButton
              icon={<LogOut className="h-4 w-4" />}
              label={t('starmap.closeStarmap')}
              iconOnly
              className="hover:text-destructive hover:bg-destructive/10"
              onClick={onCloseStarmapClick}
            />
            <div className="hidden md:flex">
              <AppControlMenu variant="inline" />
            </div>
          </ToolbarGroup>
        </div>
      </div>
    </div>
  );
});
TopToolbar.displayName = 'TopToolbar';

// Mobile Menu Drawer Sub-component - memoized
const MobileMenuDrawer = memo(function MobileMenuDrawer({ stel }: { stel: boolean }) {
  const t = useTranslations();

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 bg-card/60 backdrop-blur-md border border-border/50 text-foreground/80 hover:text-foreground hover:bg-accent md:hidden touch-target toolbar-btn"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-[85vw] max-w-80 h-full bg-card border-border p-0 flex flex-col drawer-content">
        <DrawerHeader className="p-4 border-b border-border shrink-0">
          <DrawerTitle className="text-foreground flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            {t('starmap.title')}
          </DrawerTitle>
        </DrawerHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Time Display */}
            {stel && (
              <div className="p-3 rounded-lg bg-muted/50">
                <StellariumClock />
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center">
                <NightModeToggle />
                <span className="text-[10px] text-muted-foreground mt-1">{t('settings.nightMode')}</span>
              </div>
              <div className="flex flex-col items-center">
                <SensorControlToggle />
                <span className="text-[10px] text-muted-foreground mt-1">{t('settings.sensorControl')}</span>
              </div>
              <div className="flex flex-col items-center">
                <ThemeToggle />
                <span className="text-[10px] text-muted-foreground mt-1">{t('common.darkMode')}</span>
              </div>
              <div className="flex flex-col items-center">
                <LanguageSwitcher className="h-10 w-10" />
                <span className="text-[10px] text-muted-foreground mt-1">{t('common.language')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center">
                <TonightRecommendations />
                <span className="text-[10px] text-muted-foreground mt-1">{t('tonight.title')}</span>
              </div>
              <div className="flex flex-col items-center">
                <SkyAtlasPanel />
                <span className="text-[10px] text-muted-foreground mt-1">{t('skyAtlas.title')}</span>
              </div>
              <div className="flex flex-col items-center">
                <AstroEventsCalendar />
                <span className="text-[10px] text-muted-foreground mt-1">{t('events.calendar')}</span>
              </div>
              <div className="flex flex-col items-center">
                <SatelliteTracker />
                <span className="text-[10px] text-muted-foreground mt-1">{t('satellites.tracker')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center">
                <EquipmentManager />
                <span className="text-[10px] text-muted-foreground mt-1">{t('equipment.title')}</span>
              </div>
              <div className="flex flex-col items-center">
                <AboutDialog />
                <span className="text-[10px] text-muted-foreground mt-1">{t('about.title')}</span>
              </div>
              {isTauri() && (
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive hover:bg-destructive/10"
                    onClick={() => quitApp()}
                  >
                    <Power className="h-5 w-5" />
                  </Button>
                  <span className="text-[10px] text-destructive mt-1">{t('appControl.quit')}</span>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Display Settings */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t('settings.displaySettings')}</h3>
              <StellariumSettings />
            </div>
            
            <Separator />
            
            {/* Offline Storage */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t('cache.offlineStorage')}</h3>
              <OfflineCacheManager />
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
});
MobileMenuDrawer.displayName = 'MobileMenuDrawer';
