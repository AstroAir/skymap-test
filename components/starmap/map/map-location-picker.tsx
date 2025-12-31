'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MapPin, Search, Loader2, Locate, Layers } from 'lucide-react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { geocodingService } from '@/lib/services/geocoding-service';
import type { Coordinates, LocationResult, TileLayerType } from './types';

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
}

const TILE_LAYER_OPTIONS: { value: TileLayerType; label: string }[] = [
  { value: 'openstreetmap', label: 'OpenStreetMap' },
  { value: 'cartodb_light', label: 'CartoDB Light' },
  { value: 'cartodb_dark', label: 'CartoDB Dark' },
  { value: 'esri_satellite', label: 'Satellite' },
  { value: 'esri_topo', label: 'Topographic' },
];

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
}: MapLocationPickerProps) {
  const t = useTranslations();
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; address: string; coordinates: Coordinates }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [zoom, setZoom] = useState(10);
  const [tileLayer, setTileLayer] = useState<TileLayerType>(initialTileLayer);

  // Memoize map height style
  const mapHeight = useMemo(() => 
    typeof height === 'number' ? height - 40 : height, // Subtract space for controls
    [height]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await geocodingService.geocode(searchQuery, { limit: 5, fallback: true });
      setSearchResults(results.map((r, i) => ({ id: String(i), address: r.displayName, coordinates: r.coordinates })));
    } catch { 
      toast.error(t('map.searchFailed') || 'Search failed'); 
      setSearchResults([]); 
    } finally { 
      setIsSearching(false); 
    }
  }, [searchQuery, t]);

  const handleSearchResultSelect = useCallback((result: { id: string; address: string; coordinates: Coordinates }) => {
    setCurrentLocation(result.coordinates);
    setSearchResults([]);
    setSearchQuery(result.address);
    setZoom(14);
    onLocationChange(result.coordinates);
    onLocationSelect?.({ coordinates: result.coordinates, address: result.address, displayName: result.address });
  }, [onLocationChange, onLocationSelect]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { 
      toast.error(t('map.geolocationNotSupported') || 'Geolocation not supported'); 
      return; 
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setCurrentLocation(location);
        setZoom(14);
        onLocationChange(location);
        try {
          const result = await geocodingService.reverseGeocode(location);
          onLocationSelect?.({ coordinates: location, address: result.address, displayName: result.displayName });
          toast.success(t('map.locationAcquired') || 'Location acquired');
        } catch {
          const coordsString = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
          onLocationSelect?.({ coordinates: location, address: coordsString, displayName: coordsString });
        }
        setIsLoading(false);
      }, 
      (geoError) => { 
        toast.error(geoError.message); 
        setIsLoading(false); 
      }, 
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [t, onLocationChange, onLocationSelect]);

  const handleMapLocationChange = useCallback((location: Coordinates) => {
    setCurrentLocation(location);
    onLocationChange(location);
  }, [onLocationChange]);

  const handleMapClick = useCallback((location: Coordinates) => {
    setCurrentLocation(location);
    setZoom(prev => Math.max(prev, 12));
    onLocationChange(location);
  }, [onLocationChange]);

  const handleCoordinateChange = useCallback((type: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    const clampedValue = type === 'latitude' 
      ? Math.max(-90, Math.min(90, numValue)) 
      : Math.max(-180, Math.min(180, numValue));
    const newLocation = { ...currentLocation, [type]: clampedValue };
    setCurrentLocation(newLocation);
    onLocationChange(newLocation);
  }, [currentLocation, onLocationChange]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className='pb-3'>
        <div className="flex items-center justify-between">
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            {t('map.locationPicker') || 'Location Picker'}
          </CardTitle>
          {showControls && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Layers className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TILE_LAYER_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setTileLayer(option.value)}
                    className={cn(tileLayer === option.value && 'bg-muted')}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {showSearch && (
          <div className='space-y-2'>
            <div className='flex gap-2'>
              <Input 
                placeholder={t('map.searchPlaceholder') || 'Search...'} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                disabled={disabled} 
              />
              <Button 
                onClick={handleSearch} 
                disabled={!searchQuery.trim() || isSearching || disabled} 
                size='icon'
              >
                {isSearching ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
              </Button>
              <Button 
                onClick={handleGetCurrentLocation} 
                disabled={isLoading || disabled} 
                size='icon' 
                variant='outline'
              >
                {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Locate className='h-4 w-4' />}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className='max-h-32 overflow-y-auto border rounded-md'>
                {searchResults.map((result) => (
                  <div 
                    key={result.id} 
                    className='px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0' 
                    onClick={() => handleSearchResultSelect(result)}
                  >
                    <div className='text-sm font-medium truncate'>{result.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label className='text-xs'>{t('map.latitude') || 'Latitude'}</Label>
            <Input 
              type='number' 
              step='any' 
              min='-90' 
              max='90' 
              value={currentLocation.latitude} 
              onChange={(e) => handleCoordinateChange('latitude', e.target.value)} 
              disabled={disabled} 
              className='font-mono text-sm' 
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>{t('map.longitude') || 'Longitude'}</Label>
            <Input 
              type='number' 
              step='any' 
              min='-180' 
              max='180' 
              value={currentLocation.longitude} 
              onChange={(e) => handleCoordinateChange('longitude', e.target.value)} 
              disabled={disabled} 
              className='font-mono text-sm' 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const MapLocationPicker = memo(MapLocationPickerComponent);
