'use client';

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MapPin, Layers, Sun } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LocationSearch } from './location-search';
import type { Coordinates, LocationResult } from '@/types/starmap/map';
import type { TileLayerType } from '@/lib/constants/map';

// Lazy load LeafletMap to avoid SSR issues and improve initial load
const LeafletMap = dynamic(() => import('./leaflet-map').then(mod => ({ default: mod.LeafletMap })), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

interface MapLocationPickerProps {
  initialLocation?: Coordinates;
  onLocationChange: (location: Coordinates) => void;
  onLocationSelect?: (location: LocationResult) => void;
  className?: string;
  showSearch?: boolean;
  showControls?: boolean;
  height?: string | number;
  disabled?: boolean;
  tileLayer?: TileLayerType;
  compact?: boolean;
}

interface TileLayerDropdownProps {
  options: { value: TileLayerType; label: string }[];
  current: TileLayerType;
  onChange: (value: TileLayerType) => void;
  size?: 'sm' | 'default';
}

function TileLayerDropdown({ options, current, onChange, size = 'default' }: TileLayerDropdownProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={btnSize}>
          <Layers className={iconSize} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(current === option.value && 'bg-muted')}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function MapLocationPickerComponent({
  initialLocation = { latitude: 39.9042, longitude: 116.4074 },
  onLocationChange,
  onLocationSelect,
  className,
  showSearch = true,
  showControls = true,
  height = 400,
  disabled = false,
  tileLayer: initialTileLayer = 'openstreetmap',
  compact = false,
}: MapLocationPickerProps) {
  const t = useTranslations();

  // Dynamic tile layer options with i18n
  const TILE_LAYER_OPTIONS = useMemo(() => [
    { value: 'openstreetmap' as TileLayerType, label: t('map.tileLayers.openstreetmap') },
    { value: 'cartodb_light' as TileLayerType, label: t('map.tileLayers.cartodbLight') },
    { value: 'cartodb_dark' as TileLayerType, label: t('map.tileLayers.cartodbDark') },
    { value: 'esri_satellite' as TileLayerType, label: t('map.tileLayers.satellite') },
    { value: 'esri_topo' as TileLayerType, label: t('map.tileLayers.topographic') },
  ], [t]);

  const [currentLocation, setCurrentLocation] = useState<Coordinates>(initialLocation);
  const [zoom, setZoom] = useState(10);
  const [tileLayer, setTileLayer] = useState<TileLayerType>(initialTileLayer);
  const [showLightPollution, setShowLightPollution] = useState(false);
  const latInputRef = useRef<HTMLInputElement>(null);
  const lngInputRef = useRef<HTMLInputElement>(null);

  // Sync ref input values when currentLocation changes from non-input sources (map click, search)
  useEffect(() => {
    if (latInputRef.current && document.activeElement !== latInputRef.current) {
      latInputRef.current.value = String(currentLocation.latitude);
    }
    if (lngInputRef.current && document.activeElement !== lngInputRef.current) {
      lngInputRef.current.value = String(currentLocation.longitude);
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  // Sync with external initialLocation changes
  const initialLocationKey = `${initialLocation.latitude}:${initialLocation.longitude}`;
  const lastInitialLocationKeyRef = useRef(initialLocationKey);
  useEffect(() => {
    if (lastInitialLocationKeyRef.current === initialLocationKey) {
      return;
    }
    lastInitialLocationKeyRef.current = initialLocationKey;
    const timer = window.setTimeout(() => {
      setCurrentLocation(initialLocation);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialLocation, initialLocationKey]);

  // Memoize map height style
  const mapHeight = useMemo(() => 
    typeof height === 'number' ? height - 40 : height, // Subtract space for controls
    [height]
  );

  const handleLocationSearchSelect = useCallback((result: LocationResult) => {
    setCurrentLocation(result.coordinates);
    setZoom(14);
    onLocationChange(result.coordinates);
    onLocationSelect?.(result);
  }, [onLocationChange, onLocationSelect]);

  const handleMapLocationChange = useCallback((location: Coordinates) => {
    setCurrentLocation(location);
    onLocationChange(location);
  }, [onLocationChange]);

  const handleMapClick = useCallback((location: Coordinates) => {
    setCurrentLocation(location);
    setZoom(prev => Math.max(prev, 12));
    onLocationChange(location);
  }, [onLocationChange]);

  const commitCoordinateInput = useCallback(() => {
    const latVal = parseFloat(latInputRef.current?.value ?? '');
    const lngVal = parseFloat(lngInputRef.current?.value ?? '');
    if (isNaN(latVal) || isNaN(lngVal)) return;
    const newLocation = {
      latitude: Math.max(-90, Math.min(90, latVal)),
      longitude: Math.max(-180, Math.min(180, lngVal)),
    };
    setCurrentLocation(newLocation);
    onLocationChange(newLocation);
  }, [onLocationChange]);

  const handleCoordinateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitCoordinateInput();
    }
  }, [commitCoordinateInput]);

  const mapContent = (
    <>
      {showSearch && (
        <LocationSearch
          onLocationSelect={handleLocationSearchSelect}
          disabled={disabled}
          showCurrentLocation={true}
          showRecentSearches={true}
        />
      )}
      <div 
        className={cn('relative border rounded-lg overflow-hidden bg-muted')} 
        style={{ height: typeof height === 'number' ? `${mapHeight}px` : height }}
      >
        <LeafletMap
          center={currentLocation}
          zoom={zoom}
          onLocationChange={handleMapLocationChange}
          onClick={handleMapClick}
          height={mapHeight}
          tileLayer={tileLayer}
          disabled={disabled}
          showMarker={true}
          draggableMarker={!disabled}
          showLightPollution={showLightPollution}
        />
      </div>
      {!compact && (
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label className='text-xs'>{t('map.latitude') || 'Latitude'}</Label>
            <Input 
              ref={latInputRef}
              type='number' 
              step='any' 
              min='-90' 
              max='90' 
              defaultValue={currentLocation.latitude} 
              onBlur={commitCoordinateInput}
              onKeyDown={handleCoordinateKeyDown}
              disabled={disabled} 
              className='font-mono text-sm' 
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>{t('map.longitude') || 'Longitude'}</Label>
            <Input 
              ref={lngInputRef}
              type='number' 
              step='any' 
              min='-180' 
              max='180' 
              defaultValue={currentLocation.longitude} 
              onBlur={commitCoordinateInput}
              onKeyDown={handleCoordinateKeyDown}
              disabled={disabled} 
              className='font-mono text-sm' 
            />
          </div>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <div className={cn('w-full space-y-3', className)}>
        {showControls && (
          <div className="flex justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={showLightPollution}
                  onPressedChange={setShowLightPollution}
                  aria-label={t('map.lightPollution') || 'Light Pollution'}
                  className="h-7 w-7"
                >
                  <Sun className="h-3.5 w-3.5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                {t('map.lightPollution') || 'Light Pollution'}
              </TooltipContent>
            </Tooltip>
            <TileLayerDropdown options={TILE_LAYER_OPTIONS} current={tileLayer} onChange={setTileLayer} size="sm" />
          </div>
        )}
        {mapContent}
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className='pb-3'>
        <div className="flex items-center justify-between">
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            {t('map.locationPicker') || 'Location Picker'}
          </CardTitle>
          {showControls && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showLightPollution}
                    onPressedChange={setShowLightPollution}
                    aria-label={t('map.lightPollution') || 'Light Pollution'}
                    className="h-8 w-8"
                  >
                    <Sun className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  {t('map.lightPollution') || 'Light Pollution'}
                </TooltipContent>
              </Tooltip>
              <TileLayerDropdown options={TILE_LAYER_OPTIONS} current={tileLayer} onChange={setTileLayer} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {mapContent}
      </CardContent>
    </Card>
  );
}

export const MapLocationPicker = memo(MapLocationPickerComponent);
