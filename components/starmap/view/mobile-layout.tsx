'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Ellipsis, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ToolbarSeparator } from '@/components/common/toolbar-button';
import { ZoomControls } from '../controls/zoom-controls';
import { FOVSimulator } from '../overlays/fov-simulator';
import { ExposureCalculator } from '../planning/exposure-calculator';
import { ShotList } from '../planning/shot-list';
import { ObservationLog } from '../planning/observation-log';
import { TonightRecommendations } from '../planning/tonight-recommendations';
import { SessionPlanner } from '../planning/session-planner';
import { AstroEventsCalendar } from '../planning/astro-events-calendar';
import { AstroCalculatorDialog } from '../planning/astro-calculator-dialog';
import { MarkerManager } from '../management/marker-manager';
import { LocationManager } from '../management/location-manager';
import { OfflineCacheManager } from '../management/offline-cache-manager';
import { StellariumMount } from '../mount/stellarium-mount';
import { PlateSolverUnified } from '../plate-solving/plate-solver-unified';
import { SkyAtlasPanel } from '../planning/sky-atlas-panel';
import { EquipmentManager } from '../management/equipment-manager';
import { OcularSimulator } from '../overlays/ocular-simulator';
import { DailyKnowledgeButton } from '../knowledge/daily-knowledge-button';

import { buildSelectionData } from '@/lib/core/selection-utils';
import {
  DEFAULT_MOBILE_PRIORITIZED_TOOLS,
  MOBILE_COMPACT_TOOL_LIMIT,
  type MobileToolId,
  getMobileToolsForSurface,
  sortByMobileToolPriority,
} from '@/lib/constants/mobile-tools';
import { useEquipmentFOVProps } from '@/lib/hooks/use-equipment-fov-props';
import { useEquipmentStore, useOnboardingBridgeStore, useSettingsStore } from '@/lib/stores';
import type { MobileLayoutProps } from '@/types/starmap/view';

const BOTTOM_BAR_TOOL_IDS = getMobileToolsForSurface('bottom-bar').map((tool) => tool.id);
const BOTTOM_BAR_TOOL_ID_SET = new Set<MobileToolId>(BOTTOM_BAR_TOOL_IDS);

const isBottomBarToolId = (toolId: string): toolId is MobileToolId => (
  BOTTOM_BAR_TOOL_ID_SET.has(toolId as MobileToolId)
);

export const MobileLayout = memo(function MobileLayout({
  currentFov,
  selectedObject,
  contextMenuCoords,
  onZoomIn,
  onZoomOut,
  onFovSliderChange,
  onLocationChange,
  onGoToCoordinates,
}: MobileLayoutProps) {
  const t = useTranslations();
  const { currentSelection, observationSelection } = buildSelectionData(selectedObject);

  // Equipment FOV props — shared hook avoids duplicating 12+ selectors
  const {
    fovSimEnabled, setFovSimEnabled,
    sensorWidth, setSensorWidth,
    sensorHeight, setSensorHeight,
    focalLength, setFocalLength,
    mosaic, setMosaic,
    gridType, setGridType,
  } = useEquipmentFOVProps();

  // Additional equipment props for ExposureCalculator
  const aperture = useEquipmentStore((s) => s.aperture);
  const pixelSize = useEquipmentStore((s) => s.pixelSize);
  const compactBottomBar = useSettingsStore((s) => s.mobileFeaturePreferences.compactBottomBar);
  const oneHandMode = useSettingsStore((s) => s.mobileFeaturePreferences.oneHandMode);
  const prioritizedTools = useSettingsStore(
    (s) => s.mobileFeaturePreferences.prioritizedTools ?? DEFAULT_MOBILE_PRIORITIZED_TOOLS,
  );
  const openMobileDrawerRequestId = useOnboardingBridgeStore((state) => state.openMobileDrawerRequestId);
  const mobileDrawerSection = useOnboardingBridgeStore((state) => state.mobileDrawerSection);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const handledOpenRequestRef = useRef(0);
  const toolsBarRef = useRef<HTMLDivElement | null>(null);
  const drawerToolGridRef = useRef<HTMLDivElement | null>(null);

  const allTools = useMemo(() => {
    return sortByMobileToolPriority([
      { id: 'markers', element: <MarkerManager initialCoords={contextMenuCoords} /> },
      {
        id: 'location',
        element: (
          <LocationManager
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/80 hover:text-foreground hover:bg-accent h-9 w-9 touch-target"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            }
            onLocationChange={onLocationChange}
          />
        ),
      },
      {
        id: 'fov',
        element: (
          <FOVSimulator
            enabled={fovSimEnabled}
            onEnabledChange={setFovSimEnabled}
            sensorWidth={sensorWidth}
            sensorHeight={sensorHeight}
            focalLength={focalLength}
            onSensorWidthChange={setSensorWidth}
            onSensorHeightChange={setSensorHeight}
            onFocalLengthChange={setFocalLength}
            mosaic={mosaic}
            onMosaicChange={setMosaic}
            gridType={gridType}
            onGridTypeChange={setGridType}
          />
        ),
      },
      { id: 'exposure', element: <ExposureCalculator focalLength={focalLength} aperture={aperture} pixelSize={pixelSize} /> },
      { id: 'daily-knowledge', element: <DailyKnowledgeButton /> },
      { id: 'tonight', element: <TonightRecommendations /> },
      { id: 'session-planner', element: <SessionPlanner /> },
      { id: 'astro-events', element: <AstroEventsCalendar /> },
      { id: 'astro-calculator', element: <AstroCalculatorDialog /> },
      { id: 'shotlist', element: <ShotList currentSelection={currentSelection} /> },
      { id: 'observation-log', element: <ObservationLog currentSelection={observationSelection} /> },
      { id: 'mount', element: <StellariumMount compact /> },
      { id: 'plate-solver', element: <PlateSolverUnified onGoToCoordinates={onGoToCoordinates} /> },
      { id: 'ocular', element: <OcularSimulator onApplyFov={onFovSliderChange} currentFov={currentFov} /> },
      { id: 'sky-atlas', element: <SkyAtlasPanel /> },
      { id: 'equipment-manager', element: <EquipmentManager /> },
      { id: 'offline-cache', element: <OfflineCacheManager /> },
    ], prioritizedTools);
  }, [
    aperture,
    contextMenuCoords,
    currentFov,
    currentSelection,
    focalLength,
    fovSimEnabled,
    gridType,
    mosaic,
    observationSelection,
    onGoToCoordinates,
    onFovSliderChange,
    onLocationChange,
    prioritizedTools,
    pixelSize,
    sensorHeight,
    sensorWidth,
    setFovSimEnabled,
    setFocalLength,
    setGridType,
    setMosaic,
    setSensorHeight,
    setSensorWidth,
  ]);

  const compactPriorityIds = useMemo(() => {
    const validPriorities = prioritizedTools.filter(isBottomBarToolId);
    if (validPriorities.length > 0) {
      return validPriorities;
    }
    return DEFAULT_MOBILE_PRIORITIZED_TOOLS.filter((toolId) => BOTTOM_BAR_TOOL_ID_SET.has(toolId));
  }, [prioritizedTools]);

  const compactVisibleTools = useMemo(() => {
    const prioritySet = new Set(compactPriorityIds);
    return allTools
      .filter((tool) => prioritySet.has(tool.id as MobileToolId))
      .slice(0, MOBILE_COMPACT_TOOL_LIMIT);
  }, [allTools, compactPriorityIds]);

  const compactVisibleToolIds = useMemo(
    () => new Set(compactVisibleTools.map((tool) => tool.id)),
    [compactVisibleTools],
  );

  const compactOverflowTools = useMemo(
    () => allTools.filter((tool) => !compactVisibleToolIds.has(tool.id)),
    [allTools, compactVisibleToolIds],
  );

  const bottomBarTools = compactBottomBar ? compactVisibleTools : allTools;
  const controlsBottomOffset = 'calc(3.25rem + env(safe-area-inset-bottom, 0px))';
  const zoomBottomOffset = oneHandMode
    ? 'calc(7.5rem + env(safe-area-inset-bottom, 0px))'
    : controlsBottomOffset;

  useEffect(() => {
    if (
      openMobileDrawerRequestId > 0 &&
      openMobileDrawerRequestId !== handledOpenRequestRef.current &&
      mobileDrawerSection
    ) {
      handledOpenRequestRef.current = openMobileDrawerRequestId;
      const openFromCompactOverflow = compactBottomBar && compactOverflowTools.some(
        (tool) => tool.id === mobileDrawerSection,
      );
      const timer = window.setTimeout(() => {
        if (openFromCompactOverflow) {
          setIsMoreDrawerOpen(true);
          window.setTimeout(() => {
            const target = drawerToolGridRef.current?.querySelector(
              `[data-tour-id="${mobileDrawerSection}"]`,
            ) as HTMLElement | null;
            target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }, 150);
          return;
        }

        const container = toolsBarRef.current;
        const target = container?.querySelector(
          `[data-tour-id="${mobileDrawerSection}"]`,
        ) as HTMLElement | null;
        target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 120);

      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [compactBottomBar, compactOverflowTools, mobileDrawerSection, openMobileDrawerRequestId]);

  return (
    <>
      {/* Mobile Controls - Bottom Right Corner */}
      <div
        className="sm:hidden absolute right-2 flex flex-col items-center gap-1 pointer-events-auto animate-slide-in-right"
        style={{ bottom: zoomBottomOffset }}
      >
        {/* Compact Zoom */}
        <div className="bg-card/80 backdrop-blur-md rounded-lg border border-border/50" data-tour-id="zoom">
          <ZoomControls
            fov={currentFov}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFovChange={onFovSliderChange}
          />
        </div>
      </div>

      {/* Mobile Bottom Tools Bar */}
      <div
        ref={toolsBarRef}
        className={cn(
          'mobile-bottom-bar sm:hidden absolute flex items-center gap-0.5 bg-card/90 backdrop-blur-md rounded-lg border border-border/50 p-1 pointer-events-auto overflow-x-auto scrollbar-hide animate-slide-in-left',
          oneHandMode ? 'left-12 right-2 one-hand-bottom-bar' : 'left-2 right-16',
        )}
        style={{ bottom: controlsBottomOffset }}
      >
        <div className="flex items-center gap-0.5 shrink-0">
          {bottomBarTools.map((tool) => (
            <div key={tool.id} data-tour-id={tool.id}>{tool.element}</div>
          ))}
        </div>

        {compactBottomBar && compactOverflowTools.length > 0 && (
          <>
            <ToolbarSeparator />
            <Drawer open={isMoreDrawerOpen} onOpenChange={setIsMoreDrawerOpen} repositionInputs={false}>
              <DrawerTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-tour-id="mobile-more-tools"
                  className="h-9 w-9 touch-target"
                  aria-label={t('mobileToolbar.more')}
                >
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="sm:hidden max-h-[70vh] bg-card border-border">
                <DrawerHeader>
                  <DrawerTitle>{t('settingsNew.mobile.moreToolsTitle')}</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="pb-6 px-4">
                  <div
                    ref={drawerToolGridRef}
                    data-mobile-more-tools="true"
                    className="grid grid-cols-4 gap-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
                  >
                    {compactOverflowTools.map((tool) => (
                      <div
                        key={tool.id}
                        data-tour-id={tool.id}
                        className="flex items-center justify-center"
                      >
                        {tool.element}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DrawerContent>
            </Drawer>
          </>
        )}
      </div>
    </>
  );
});
MobileLayout.displayName = 'MobileLayout';
