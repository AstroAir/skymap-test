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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Compass } from 'lucide-react';
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
import { TonightRecommendations } from './TonightRecommendations';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

// Context menu click coordinates type
interface ClickCoords {
  ra: number;
  dec: number;
  raStr: string;
  decStr: string;
}

// Sub-component: View Center Display
function ViewCenterDisplay() {
  const t = useTranslations();
  const getCurrentViewDirection = useStellariumStore((state) => state.getCurrentViewDirection);
  const [viewCenter, setViewCenter] = useState<{ ra: string; dec: string; alt: string; az: string } | null>(null);

  useEffect(() => {
    const updateViewCenter = () => {
      if (getCurrentViewDirection) {
        try {
          const dir = getCurrentViewDirection();
          const raDeg = rad2deg(dir.ra);
          const decDeg = rad2deg(dir.dec);
          const altDeg = rad2deg(dir.alt);
          const azDeg = rad2deg(dir.az);
          
          setViewCenter({
            ra: degreesToHMS(((raDeg % 360) + 360) % 360),
            dec: degreesToDMS(decDeg),
            alt: `${altDeg.toFixed(1)}°`,
            az: `${(((azDeg % 360) + 360) % 360).toFixed(1)}°`,
          });
        } catch {
          // Ignore errors during initialization
        }
      }
    };

    updateViewCenter();
    const interval = setInterval(updateViewCenter, 500);
    return () => clearInterval(interval);
  }, [getCurrentViewDirection]);

  if (!viewCenter) return null;

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <span>
        {t('coordinates.ra')}: <span className="text-foreground font-mono">{viewCenter.ra}</span>
      </span>
      <span>
        {t('coordinates.dec')}: <span className="text-foreground font-mono">{viewCenter.dec}</span>
      </span>
      <span className="hidden sm:inline">
        {t('coordinates.alt')}: <span className="text-foreground font-mono">{viewCenter.alt}</span>
      </span>
      <span className="hidden sm:inline">
        {t('coordinates.az')}: <span className="text-foreground font-mono">{viewCenter.az}</span>
      </span>
    </div>
  );
}

// Sub-component: Location & Time Display
function LocationTimeDisplay() {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const stel = useStellariumStore((state) => state.stel);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lst, setLst] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      // Current UTC time
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      // Calculate LST if we have observer info
      if (stel?.core?.observer) {
        try {
          const observer = stel.core.observer;
          // Get sidereal time from Stellarium if available
          if (observer.utc !== undefined) {
            const jd = observer.utc;
            const T = (jd - 2451545.0) / 36525.0;
            const lon = profileInfo.AstrometrySettings.Longitude || 0;
            // Greenwich Mean Sidereal Time
            let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
            gmst = ((gmst % 360) + 360) % 360;
            // Local Sidereal Time
            let lstDeg = gmst + lon;
            lstDeg = ((lstDeg % 360) + 360) % 360;
            const lstHours = lstDeg / 15;
            const h = Math.floor(lstHours);
            const m = Math.floor((lstHours - h) * 60);
            const s = Math.floor(((lstHours - h) * 60 - m) * 60);
            setLst(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          }
        } catch {
          // Ignore LST calculation errors
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [stel, profileInfo]);

  const lat = profileInfo.AstrometrySettings.Latitude || 0;
  const lon = profileInfo.AstrometrySettings.Longitude || 0;

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <span className="hidden md:inline">
        {t('session.location')}: <span className="text-foreground font-mono">{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
      </span>
      {lst && (
        <span className="hidden sm:inline">
          {t('session.lst')}: <span className="text-foreground font-mono">{lst}</span>
        </span>
      )}
      <span>
        <span className="text-foreground font-mono">{currentTime}</span>
      </span>
    </div>
  );
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
  
  // Context menu state - controlled positioning (stores absolute screen position)
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Go to coordinates dialog state
  const [goToDialogOpen, setGoToDialogOpen] = useState(false);
  const [goToRa, setGoToRa] = useState('');
  const [goToDec, setGoToDec] = useState('');
  const [coordError, setCoordError] = useState('');
  
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

  // Handle context menu open - capture click coordinates and position
  const handleContextMenuCapture = useCallback((e: React.MouseEvent, coords: { ra: number; dec: number; raStr: string; decStr: string } | null) => {
    e.preventDefault();
    setContextMenuCoords(coords);
    
    // Store absolute screen position (clientX/clientY are already absolute)
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY,
    });
    
    // Always close and reopen to force position update
    setContextMenuOpen(false);
    // Use requestAnimationFrame to ensure state updates before reopening
    requestAnimationFrame(() => {
      setContextMenuOpen(true);
    });
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
    setContextMenuOpen(false);
  }, [contextMenuCoords, setViewDirection]);

  // Parse coordinate string (supports degrees or HMS/DMS format)
  const parseCoordinate = useCallback((value: string, isDec: boolean): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Try parsing as decimal degrees first
    const decimal = parseFloat(trimmed);
    if (!isNaN(decimal)) {
      if (isDec && (decimal < -90 || decimal > 90)) return null;
      if (!isDec && (decimal < 0 || decimal > 360)) return null;
      return decimal;
    }
    
    // Try parsing HMS format for RA (e.g., "00h42m44s" or "00:42:44")
    if (!isDec) {
      const hmsMatch = trimmed.match(/^(\d+)[h:]\s*(\d+)[m:]\s*([\d.]+)s?$/i);
      if (hmsMatch) {
        const h = parseFloat(hmsMatch[1]);
        const m = parseFloat(hmsMatch[2]);
        const s = parseFloat(hmsMatch[3]);
        if (h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
          return (h + m / 60 + s / 3600) * 15; // Convert to degrees
        }
      }
    }
    
    // Try parsing DMS format for Dec (e.g., "+41°16'09\"" or "+41:16:09")
    if (isDec) {
      const dmsMatch = trimmed.match(/^([+-]?)(\d+)[°:]\s*(\d+)[':](\s*([\d.]+)["']?)?$/i);
      if (dmsMatch) {
        const sign = dmsMatch[1] === '-' ? -1 : 1;
        const d = parseFloat(dmsMatch[2]);
        const m = parseFloat(dmsMatch[3]);
        const s = dmsMatch[5] ? parseFloat(dmsMatch[5]) : 0;
        if (d >= 0 && d <= 90 && m >= 0 && m < 60 && s >= 0 && s < 60) {
          const result = sign * (d + m / 60 + s / 3600);
          if (result >= -90 && result <= 90) return result;
        }
      }
    }
    
    return null;
  }, []);

  // Handle go to coordinates
  const handleGoToCoordinates = useCallback(() => {
    const ra = parseCoordinate(goToRa, false);
    const dec = parseCoordinate(goToDec, true);
    
    if (ra === null || dec === null) {
      setCoordError(t('coordinates.invalidCoordinates'));
      return;
    }
    
    if (setViewDirection) {
      setViewDirection(ra, dec);
    }
    
    setGoToDialogOpen(false);
    setGoToRa('');
    setGoToDec('');
    setCoordError('');
  }, [goToRa, goToDec, parseCoordinate, setViewDirection, t]);

  // Open go to coordinates dialog
  const openGoToDialog = useCallback(() => {
    setContextMenuOpen(false);
    setGoToDialogOpen(true);
  }, []);

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
        {/* Canvas with context menu handling */}
        <div className="absolute inset-0">
          <StellariumCanvas
            ref={canvasRef}
            onSelectionChange={handleSelectionChange}
            onFovChange={handleFovChange}
            onContextMenu={handleContextMenuCapture}
          />
        </div>

        {/* Custom positioned context menu using DropdownMenu */}
        <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
          {/* Invisible trigger positioned at click location */}
          <DropdownMenuTrigger asChild>
            <div 
              className="fixed w-0 h-0 pointer-events-none"
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
              }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-64 bg-card border-border"
            align="start"
          >
            {/* Click Position Info */}
            {contextMenuCoords && (
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">{t('coordinates.clickPosition')}</div>
                  <div className="font-mono">RA: {contextMenuCoords.raStr}</div>
                  <div className="font-mono">Dec: {contextMenuCoords.decStr}</div>
                </div>
                <DropdownMenuSeparator className="bg-border" />
              </>
            )}

            {/* Selected Object Actions */}
            {selectedObject && (
              <>
                <div className="px-2 py-1.5 text-xs">
                  <div className="font-medium text-primary truncate">{selectedObject.names[0]}</div>
                </div>
                <DropdownMenuItem 
                  onClick={() => {
                    navigator.clipboard.writeText(`${selectedObject.ra} ${selectedObject.dec}`);
                    setContextMenuOpen(false);
                  }} 
                  className="text-foreground"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t('coordinates.copyObjectCoordinates')}
                  <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
                </DropdownMenuItem>
                {mountConnected && (
                  <DropdownMenuItem 
                    onClick={() => {
                      handleSetFramingCoordinates({
                        ra: selectedObject.raDeg,
                        dec: selectedObject.decDeg,
                        raString: selectedObject.ra,
                        decString: selectedObject.dec,
                        name: selectedObject.names[0] || '',
                      });
                      setContextMenuOpen(false);
                    }}
                    className="text-foreground"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {t('actions.slewToObject')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border" />
              </>
            )}

            {/* Add to Target List */}
            <DropdownMenuItem 
              onClick={() => {
                handleAddToTargetList();
                setContextMenuOpen(false);
              }}
              disabled={!contextMenuCoords && !selectedObject}
              className="text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('actions.addToTargetList')}
            </DropdownMenuItem>

            {/* Center View on Click */}
            {contextMenuCoords && (
              <DropdownMenuItem 
                onClick={handleNavigateToCoords}
                className="text-foreground"
              >
                <Target className="h-4 w-4 mr-2" />
                {t('actions.centerViewHere')}
              </DropdownMenuItem>
            )}

            {/* Go to Coordinates */}
            <DropdownMenuItem 
              onClick={openGoToDialog}
              className="text-foreground"
            >
              <Compass className="h-4 w-4 mr-2" />
              {t('coordinates.goToCoordinates')}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            {/* Zoom Controls */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-foreground">
                <ZoomIn className="h-4 w-4 mr-2" />
                {t('zoom.zoom')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-card border-border">
                <DropdownMenuItem onClick={() => { handleZoomIn(); setContextMenuOpen(false); }} className="text-foreground">
                  <ZoomIn className="h-4 w-4 mr-2" />
                  {t('zoom.zoomIn')}
                  <DropdownMenuShortcut>+</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { handleZoomOut(); setContextMenuOpen(false); }} className="text-foreground">
                  <ZoomOut className="h-4 w-4 mr-2" />
                  {t('zoom.zoomOut')}
                  <DropdownMenuShortcut>-</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => { canvasRef.current?.setFov(1); setContextMenuOpen(false); }} className="text-foreground">
                  1° FOV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { canvasRef.current?.setFov(5); setContextMenuOpen(false); }} className="text-foreground">
                  5° FOV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { canvasRef.current?.setFov(15); setContextMenuOpen(false); }} className="text-foreground">
                  15° FOV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { canvasRef.current?.setFov(30); setContextMenuOpen(false); }} className="text-foreground">
                  30° FOV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { canvasRef.current?.setFov(60); setContextMenuOpen(false); }} className="text-foreground">
                  60° FOV ({t('zoom.default')})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { canvasRef.current?.setFov(90); setContextMenuOpen(false); }} className="text-foreground">
                  90° FOV
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* FOV Overlay */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-foreground">
                <Camera className="h-4 w-4 mr-2" />
                {t('fov.fovOverlay')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-card border-border">
                <DropdownMenuCheckboxItem
                  checked={fovSimEnabled}
                  onCheckedChange={setFovSimEnabled}
                  className="text-foreground"
                >
                  {t('fov.showFovOverlay')}
                </DropdownMenuCheckboxItem>
                {fovSimEnabled && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem 
                      onClick={() => { setRotationAngle(0); setContextMenuOpen(false); }} 
                      className="text-foreground"
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      {t('fov.resetRotation')}
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem
                      checked={mosaic.enabled}
                      onCheckedChange={(checked: boolean) => setMosaic({ ...mosaic, enabled: checked })}
                      className="text-foreground"
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      {t('fov.enableMosaic')}
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="bg-border" />

            {/* Display Settings */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-foreground">
                <Settings className="h-4 w-4 mr-2" />
                {t('settings.display')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-card border-border w-48">
                <DropdownMenuCheckboxItem
                  checked={stellariumSettings.constellationsLinesVisible}
                  onCheckedChange={() => toggleStellariumSetting('constellationsLinesVisible')}
                  className="text-foreground"
                >
                  {t('settings.constellationLines')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={stellariumSettings.equatorialLinesVisible}
                  onCheckedChange={() => toggleStellariumSetting('equatorialLinesVisible')}
                  className="text-foreground"
                >
                  {t('settings.equatorialGrid')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={stellariumSettings.azimuthalLinesVisible}
                  onCheckedChange={() => toggleStellariumSetting('azimuthalLinesVisible')}
                  className="text-foreground"
                >
                  {t('settings.azimuthalGrid')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={stellariumSettings.dsosVisible}
                  onCheckedChange={() => toggleStellariumSetting('dsosVisible')}
                  className="text-foreground"
                >
                  {t('settings.deepSkyObjects')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuCheckboxItem
                  checked={stellariumSettings.surveyEnabled}
                  onCheckedChange={() => toggleStellariumSetting('surveyEnabled')}
                  className="text-foreground"
                >
                  {t('settings.skySurveys')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={stellariumSettings.atmosphereVisible}
                  onCheckedChange={() => toggleStellariumSetting('atmosphereVisible')}
                  className="text-foreground"
                >
                  {t('settings.atmosphere')}
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="bg-border" />

            {/* Coordinates */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {t('coordinates.coordinates')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-card border-border">
                {contextMenuCoords && (
                  <DropdownMenuItem 
                    onClick={() => {
                      navigator.clipboard.writeText(`${contextMenuCoords.raStr} ${contextMenuCoords.decStr}`);
                      setContextMenuOpen(false);
                    }}
                    className="text-foreground"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t('coordinates.copyClickPosition')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
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
                    setContextMenuOpen(false);
                  }} 
                  className="text-foreground"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  {t('coordinates.copyViewCenter')}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="bg-border" />

            {/* Search */}
            <DropdownMenuItem 
              onClick={() => {
                setIsSearchOpen(true);
                setContextMenuOpen(false);
                setTimeout(() => searchRef.current?.focusSearchInput(), 100);
              }} 
              className="text-foreground"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('starmap.searchObjects')}
              <DropdownMenuShortcut>Ctrl+F</DropdownMenuShortcut>
            </DropdownMenuItem>

            {/* Reset View */}
            <DropdownMenuItem onClick={() => { handleResetView(); setContextMenuOpen(false); }} className="text-foreground">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('starmap.resetView')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Go to Coordinates Dialog */}
        <Dialog open={goToDialogOpen} onOpenChange={setGoToDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('coordinates.goToCoordinates')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ra">{t('coordinates.ra')}</Label>
                <Input
                  id="ra"
                  value={goToRa}
                  onChange={(e) => { setGoToRa(e.target.value); setCoordError(''); }}
                  placeholder={t('coordinates.raPlaceholder')}
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dec">{t('coordinates.dec')}</Label>
                <Input
                  id="dec"
                  value={goToDec}
                  onChange={(e) => { setGoToDec(e.target.value); setCoordError(''); }}
                  placeholder={t('coordinates.decPlaceholder')}
                  className="font-mono"
                />
              </div>
              {coordError && (
                <p className="text-sm text-destructive">{coordError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGoToDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleGoToCoordinates}>
                {t('coordinates.goTo')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              
              {/* Tonight's Recommendations */}
              <div className="bg-black/60 backdrop-blur-sm rounded-md">
                <TonightRecommendations />
              </div>
              
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

        {/* Search Panel - Enhanced */}
        {isSearchOpen && (
          <Card className="absolute top-16 left-3 w-96 max-w-[calc(100vw-24px)] bg-card/95 backdrop-blur-sm border-border z-50 shadow-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-foreground">{t('starmap.searchObjects')}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <StellariumSearch
                ref={searchRef}
                onSelect={() => setIsSearchOpen(false)}
                enableMultiSelect={true}
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

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm border-t border-border px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              {/* Left: View Center Coordinates */}
              <div className="flex items-center gap-4">
                <ViewCenterDisplay />
              </div>
              
              {/* Center: FOV */}
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  FOV: <span className="text-foreground font-mono">{currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°</span>
                </span>
              </div>
              
              {/* Right: Location & Time */}
              <div className="flex items-center gap-4">
                <LocationTimeDisplay />
              </div>
            </div>
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
