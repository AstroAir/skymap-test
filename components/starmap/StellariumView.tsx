'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useFramingStore, useMountStore } from '@/lib/starmap/stores';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/lib/starmap/utils';
import { Search, X, Crosshair, RotateCcw, Menu, ZoomIn, ZoomOut, Camera, Copy, MapPin, RotateCw, PanelLeftClose, PanelLeft, Plus, Settings, Target, Navigation, Grid3X3, HardDrive } from 'lucide-react';
import type { SelectedObjectData } from '@/lib/starmap/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuCheckboxItem,
} from '@/components/ui/context-menu';
import { useTargetListStore } from '@/lib/starmap/stores/target-list-store';
import { useSettingsStore } from '@/lib/starmap/stores/settings-store';

import { StellariumCanvas, type StellariumCanvasRef } from './StellariumCanvas';
import { StellariumSearch, type StellariumSearchRef } from './StellariumSearch';
import { StellariumSettings } from './StellariumSettings';
import { StellariumCredits } from './StellariumCredits';
import { StellariumClock } from './StellariumClock';
import { StellariumMount } from './StellariumMount';
import { ZoomControls } from './ZoomControls';
import { FOVSimulator, type GridType } from './FOVSimulator';
import { FOVOverlay } from './FOVOverlay';
import { InfoPanel } from './InfoPanel';
import { ExposureCalculator } from './ExposureCalculator';
import { ShotList } from './ShotList';
import { OfflineCacheManager } from './OfflineCacheManager';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

// Context menu click coordinates type
interface ClickCoords {
  ra: number;
  dec: number;
  raStr: string;
  decStr: string;
}

export function StellariumView() {
  const t = useTranslations();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectedObjectData | null>(null);
  const [currentFov, setCurrentFov] = useState(60);
  const [fovSimEnabled, setFovSimEnabled] = useState(false);
  const [sensorWidth, setSensorWidth] = useState(23.5);
  const [sensorHeight, setSensorHeight] = useState(15.6);
  const [focalLength, setFocalLength] = useState(400);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [mosaic, setMosaic] = useState({ enabled: false, rows: 2, cols: 2, overlap: 20 });
  const [gridType, setGridType] = useState<GridType>('crosshair');
  const [showSessionPanel, setShowSessionPanel] = useState(true);
  const [contextMenuCoords, setContextMenuCoords] = useState<ClickCoords | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>();
  const [containerBounds, setContainerBounds] = useState<{ width: number; height: number } | undefined>();
  
  const canvasRef = useRef<StellariumCanvasRef>(null);
  const searchRef = useRef<StellariumSearchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const stel = useStellariumStore((state) => state.stel);
  const setViewDirection = useStellariumStore((state) => state.setViewDirection);
  const mountConnected = useMountStore((state) => state.mountInfo.Connected);
  const setShowFramingModal = useFramingStore((state) => state.setShowFramingModal);
  const setCoordinates = useFramingStore((state) => state.setCoordinates);
  const setSelectedItem = useFramingStore((state) => state.setSelectedItem);
  
  // Target list store
  const addTarget = useTargetListStore((state) => state.addTarget);
  
  // Settings store
  const stellariumSettings = useSettingsStore((state) => state.stellarium);
  const toggleStellariumSetting = useSettingsStore((state) => state.toggleStellariumSetting);

  // Track container bounds on resize
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerBounds({ width: rect.width, height: rect.height });
      }
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Track last mouse position for info panel placement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Store position relative to container
        (containerRef.current as HTMLDivElement & { lastMousePos?: { x: number; y: number } }).lastMousePos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle selection change from canvas
  const handleSelectionChange = useCallback((selection: SelectedObjectData | null) => {
    if (selection) {
      setIsSearchOpen(false);
      // Get last mouse position when selection is made
      if (containerRef.current) {
        const lastPos = (containerRef.current as HTMLDivElement & { lastMousePos?: { x: number; y: number } }).lastMousePos;
        if (lastPos) {
          setClickPosition(lastPos);
        }
      }
    }
    setSelectedObject(selection);
  }, []);

  // Handle FOV change
  const handleFovChange = useCallback((fov: number) => {
    setCurrentFov(fov);
  }, []);

  // Handle framing coordinates
  const handleSetFramingCoordinates = useCallback((data: {
    ra: number;
    dec: number;
    raString: string;
    decString: string;
    name: string;
  }) => {
    setCoordinates({
      ra: data.ra,
      dec: data.dec,
      raString: data.raString,
      decString: data.decString,
    });
    setSelectedItem({
      Name: data.name,
      RA: data.ra,
      Dec: data.dec,
    });
    setShowFramingModal(true);
  }, [setCoordinates, setSelectedItem, setShowFramingModal]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    canvasRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    canvasRef.current?.zoomOut();
  }, []);

  const handleFovSliderChange = useCallback((fov: number) => {
    canvasRef.current?.setFov(fov);
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    canvasRef.current?.setFov(60);
    setRotationAngle(0);
  }, []);

  // Handle context menu open - capture click coordinates
  const handleContextMenuCapture = useCallback((e: React.MouseEvent) => {
    const coords = canvasRef.current?.getClickCoordinates(e.clientX, e.clientY);
    setContextMenuCoords(coords || null);
  }, []);

  // Add current location to target list
  const handleAddToTargetList = useCallback(() => {
    if (contextMenuCoords) {
      addTarget({
        name: `Target @ ${contextMenuCoords.raStr}`,
        ra: contextMenuCoords.ra,
        dec: contextMenuCoords.dec,
        raString: contextMenuCoords.raStr,
        decString: contextMenuCoords.decStr,
        sensorWidth,
        sensorHeight,
        focalLength,
        rotationAngle,
        mosaic: mosaic.enabled ? mosaic : undefined,
        priority: 'medium',
      });
    } else if (selectedObject) {
      addTarget({
        name: selectedObject.names[0] || 'Unknown',
        ra: selectedObject.raDeg,
        dec: selectedObject.decDeg,
        raString: selectedObject.ra,
        decString: selectedObject.dec,
        sensorWidth,
        sensorHeight,
        focalLength,
        rotationAngle,
        mosaic: mosaic.enabled ? mosaic : undefined,
        priority: 'medium',
      });
    }
  }, [contextMenuCoords, selectedObject, addTarget, sensorWidth, sensorHeight, focalLength, rotationAngle, mosaic]);

  // Navigate to click coordinates
  const handleNavigateToCoords = useCallback(() => {
    if (contextMenuCoords && setViewDirection) {
      setViewDirection(contextMenuCoords.ra, contextMenuCoords.dec);
    }
  }, [contextMenuCoords, setViewDirection]);

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
        {/* Context Menu wrapping canvas trigger div */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="absolute inset-0">
              <StellariumCanvas
                ref={canvasRef}
                onSelectionChange={handleSelectionChange}
                onFovChange={handleFovChange}
                onContextMenu={handleContextMenuCapture}
              />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64 bg-card border-border">
            {/* Click Position Info */}
            {contextMenuCoords && (
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">{t('coordinates.clickPosition')}</div>
                  <div className="font-mono">RA: {contextMenuCoords.raStr}</div>
                  <div className="font-mono">Dec: {contextMenuCoords.decStr}</div>
                </div>
                <ContextMenuSeparator className="bg-border" />
              </>
            )}

            {/* Selected Object Actions */}
            {selectedObject && (
              <>
                <div className="px-2 py-1.5 text-xs">
                  <div className="font-medium text-primary truncate">{selectedObject.names[0]}</div>
                </div>
                <ContextMenuItem 
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedObject.ra} ${selectedObject.dec}`);
                  }} 
                  className="text-foreground"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t('coordinates.copyObjectCoordinates')}
                  <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                </ContextMenuItem>
                {mountConnected && (
                  <ContextMenuItem 
                    onClick={() => handleSetFramingCoordinates({
                      ra: selectedObject.raDeg,
                      dec: selectedObject.decDeg,
                      raString: selectedObject.ra,
                      decString: selectedObject.dec,
                      name: selectedObject.names[0] || '',
                    })}
                    className="text-foreground"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {t('actions.slewToObject')}
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator className="bg-border" />
              </>
            )}

            {/* Add to Target List */}
            <ContextMenuItem 
              onClick={handleAddToTargetList}
              disabled={!contextMenuCoords && !selectedObject}
              className="text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.addToTargetList')}
            </ContextMenuItem>

            {/* Center View on Click */}
            {contextMenuCoords && (
              <ContextMenuItem 
                onClick={handleNavigateToCoords}
                className="text-foreground"
              >
                <Target className="h-4 w-4 mr-2" />
                {t('actions.centerViewHere')}
              </ContextMenuItem>
            )}

            <ContextMenuSeparator className="bg-border" />

            {/* Zoom Controls */}
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-foreground">
                <ZoomIn className="h-4 w-4 mr-2" />
                {t('zoom.zoom')}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                <ContextMenuItem onClick={handleZoomIn} className="text-foreground">
                  <ZoomIn className="h-4 w-4 mr-2" />
                  {t('zoom.zoomIn')}
                  <ContextMenuShortcut>+</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={handleZoomOut} className="text-foreground">
                  <ZoomOut className="h-4 w-4 mr-2" />
                  {t('zoom.zoomOut')}
                  <ContextMenuShortcut>-</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-border" />
                <ContextMenuItem onClick={() => canvasRef.current?.setFov(1)} className="text-foreground">
                  1° FOV
                </ContextMenuItem>
                <ContextMenuItem onClick={() => canvasRef.current?.setFov(5)} className="text-foreground">
                  5° FOV
                </ContextMenuItem>
                <ContextMenuItem onClick={() => canvasRef.current?.setFov(15)} className="text-foreground">
                  15° FOV
                </ContextMenuItem>
                <ContextMenuItem onClick={() => canvasRef.current?.setFov(30)} className="text-foreground">
                  30° FOV
                </ContextMenuItem>
                <ContextMenuItem onClick={() => canvasRef.current?.setFov(60)} className="text-foreground">
                  60° FOV ({t('zoom.default')})
                </ContextMenuItem>
                <ContextMenuItem onClick={() => canvasRef.current?.setFov(90)} className="text-foreground">
                  90° FOV
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            {/* FOV Overlay */}
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-foreground">
                <Camera className="h-4 w-4 mr-2" />
                {t('fov.fovOverlay')}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                <ContextMenuCheckboxItem
                  checked={fovSimEnabled}
                  onCheckedChange={setFovSimEnabled}
                  className="text-foreground"
                >
                  {t('fov.showFovOverlay')}
                </ContextMenuCheckboxItem>
                {fovSimEnabled && (
                  <>
                    <ContextMenuSeparator className="bg-border" />
                    <ContextMenuItem 
                      onClick={() => setRotationAngle(0)} 
                      className="text-foreground"
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      {t('fov.resetRotation')}
                    </ContextMenuItem>
                    <ContextMenuCheckboxItem
                      checked={mosaic.enabled}
                      onCheckedChange={(checked) => setMosaic({ ...mosaic, enabled: checked })}
                      className="text-foreground"
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      {t('fov.enableMosaic')}
                    </ContextMenuCheckboxItem>
                  </>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator className="bg-border" />

            {/* Display Settings */}
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-foreground">
                <Settings className="h-4 w-4 mr-2" />
                {t('settings.display')}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border w-48">
                <ContextMenuCheckboxItem
                  checked={stellariumSettings.constellationsLinesVisible}
                  onCheckedChange={() => toggleStellariumSetting('constellationsLinesVisible')}
                  className="text-foreground"
                >
                  {t('settings.constellationLines')}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  checked={stellariumSettings.equatorialLinesVisible}
                  onCheckedChange={() => toggleStellariumSetting('equatorialLinesVisible')}
                  className="text-foreground"
                >
                  {t('settings.equatorialGrid')}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  checked={stellariumSettings.azimuthalLinesVisible}
                  onCheckedChange={() => toggleStellariumSetting('azimuthalLinesVisible')}
                  className="text-foreground"
                >
                  {t('settings.azimuthalGrid')}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  checked={stellariumSettings.dsosVisible}
                  onCheckedChange={() => toggleStellariumSetting('dsosVisible')}
                  className="text-foreground"
                >
                  {t('settings.deepSkyObjects')}
                </ContextMenuCheckboxItem>
                <ContextMenuSeparator className="bg-border" />
                <ContextMenuCheckboxItem
                  checked={stellariumSettings.surveyEnabled}
                  onCheckedChange={() => toggleStellariumSetting('surveyEnabled')}
                  className="text-foreground"
                >
                  {t('settings.skySurveys')}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  checked={stellariumSettings.atmosphereVisible}
                  onCheckedChange={() => toggleStellariumSetting('atmosphereVisible')}
                  className="text-foreground"
                >
                  {t('settings.atmosphere')}
                </ContextMenuCheckboxItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator className="bg-border" />

            {/* Coordinates */}
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {t('coordinates.coordinates')}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                {contextMenuCoords && (
                  <ContextMenuItem 
                    onClick={() => {
                      navigator.clipboard.writeText(`${contextMenuCoords.raStr} ${contextMenuCoords.decStr}`);
                    }}
                    className="text-foreground"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t('coordinates.copyClickPosition')}
                  </ContextMenuItem>
                )}
                <ContextMenuItem 
                  onClick={() => {
                    const getCurrentViewDirection = useStellariumStore.getState().getCurrentViewDirection;
                    if (getCurrentViewDirection) {
                      const dir = getCurrentViewDirection();
                      const ra = rad2deg(dir.ra);
                      const dec = rad2deg(dir.dec);
                      const raStr = degreesToHMS(((ra % 360) + 360) % 360);
                      const decStr = degreesToDMS(dec);
                      navigator.clipboard.writeText(`${raStr} ${decStr}`);
                    }
                  }} 
                  className="text-foreground"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  {t('coordinates.copyViewCenter')}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator className="bg-border" />

            {/* Search */}
            <ContextMenuItem 
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchRef.current?.focusSearchInput(), 100);
              }} 
              className="text-foreground"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('starmap.searchObjects')}
              <ContextMenuShortcut>Ctrl+F</ContextMenuShortcut>
            </ContextMenuItem>

            {/* Reset View */}
            <ContextMenuItem onClick={handleResetView} className="text-foreground">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('starmap.resetView')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* FOV Overlay */}
        <FOVOverlay
          enabled={fovSimEnabled}
          sensorWidth={sensorWidth}
          sensorHeight={sensorHeight}
          focalLength={focalLength}
          currentFov={currentFov}
          rotationAngle={rotationAngle}
          onRotationChange={setRotationAngle}
          mosaic={mosaic}
          gridType={gridType}
        />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none">
          {/* Left: Menu & Search */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-card border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground">{t('starmap.title')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <StellariumSettings />
                  <OfflineCacheManager />
                  <StellariumCredits />
                  {stel && <StellariumClock />}
                </div>
              </SheetContent>
            </Sheet>

            {/* Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 backdrop-blur-sm ${isSearchOpen ? 'bg-primary/30 text-primary' : 'bg-black/60 text-white hover:bg-black/80'}`}
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    if (!isSearchOpen) {
                      setSelectedObject(null);
                      setTimeout(() => searchRef.current?.focusSearchInput(), 100);
                    }
                  }}
                >
                  {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('starmap.searchObjects')}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Time Display */}
          <div className="pointer-events-auto hidden sm:block">
            {stel && <StellariumClock />}
          </div>

          {/* Right: Settings */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="hidden md:flex items-center gap-2">
              <StellariumSettings />
              
              {/* Offline Cache Manager */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
                  >
                    <HardDrive className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-card border-border overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-foreground">{t('cache.offlineStorage')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <OfflineCacheManager />
                  </div>
                </SheetContent>
              </Sheet>
              
              <LanguageSwitcher className="h-10 w-10 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80" />
              
              <StellariumCredits />
            </div>
            
            {/* Reset View */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
                  onClick={handleResetView}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('starmap.resetView')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Toggle Session Panel */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 backdrop-blur-sm ${showSessionPanel ? 'bg-primary/30 text-primary' : 'bg-black/60 text-white hover:bg-black/80'}`}
                  onClick={() => setShowSessionPanel(!showSessionPanel)}
                >
                  {showSessionPanel ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{showSessionPanel ? t('starmap.hideSessionInfo') : t('starmap.showSessionInfo')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search Panel */}
        {isSearchOpen && (
          <Card className="absolute top-16 left-3 w-80 max-w-[calc(100vw-24px)] bg-card/95 backdrop-blur-sm border-border z-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-foreground">{t('starmap.searchObjects')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StellariumSearch
                ref={searchRef}
                onSelect={() => setIsSearchOpen(false)}
              />
            </CardContent>
          </Card>
        )}


        {/* Right Side Controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
          {/* Zoom Controls */}
          <ZoomControls
            fov={currentFov}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFovChange={handleFovSliderChange}
          />

          {/* FOV Simulator */}
          <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-border">
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
            <ExposureCalculator focalLength={focalLength} />
            <ShotList
              currentSelection={selectedObject ? {
                name: selectedObject.names[0] || 'Unknown',
                ra: selectedObject.raDeg,
                dec: selectedObject.decDeg,
                raString: selectedObject.ra,
                decString: selectedObject.dec,
              } : null}
              fovSettings={{
                sensorWidth,
                sensorHeight,
                focalLength,
                rotationAngle,
                mosaic,
              }}
            />
          </div>

          {/* Mount Controls */}
          {stel && <StellariumMount />}
        </div>

        {/* Info Panel - only show when object is selected */}
        {selectedObject && !isSearchOpen && (
          <div className="pointer-events-auto z-40">
            <InfoPanel
              selectedObject={selectedObject}
              onClose={() => setSelectedObject(null)}
              onSetFramingCoordinates={handleSetFramingCoordinates}
              clickPosition={clickPosition}
              containerBounds={containerBounds}
            />
          </div>
        )}

        {/* Bottom Center: Crosshair Info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              FOV: <span className="text-foreground font-mono">{currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°</span>
            </p>
          </div>
        </div>

        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-12 h-12">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-white/50 rounded-full" />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
