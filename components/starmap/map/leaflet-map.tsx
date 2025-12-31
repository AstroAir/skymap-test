'use client';

import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Coordinates } from './types';
import { TILE_LAYER_CONFIGS, type TileLayerType } from './types';
import { Skeleton } from '@/components/ui/skeleton';

export interface LeafletMapProps {
  center: Coordinates;
  zoom?: number;
  onLocationChange?: (location: Coordinates) => void;
  onClick?: (location: Coordinates) => void;
  className?: string;
  height?: string | number;
  tileLayer?: TileLayerType;
  showMarker?: boolean;
  draggableMarker?: boolean;
  disabled?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

function LeafletMapComponent({
  center,
  zoom = 10,
  onLocationChange,
  onClick,
  className,
  height = 400,
  tileLayer = 'openstreetmap',
  showMarker = true,
  draggableMarker = true,
  disabled = false,
  minZoom = 2,
  maxZoom = 19,
}: LeafletMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  // Store callbacks in refs to avoid recreating map on callback changes
  const onLocationChangeRef = useRef(onLocationChange);
  const onClickRef = useRef(onClick);
  
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);
  
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // Initialize map with dynamic Leaflet import
  useEffect(() => {
    if (!containerRef.current) return;
    
    let mounted = true;
    
    const initMap = async () => {
      // Dynamic import of Leaflet - only runs on client
      const L = await import('leaflet');
      
      // Import CSS by adding link element (CSS modules can't be dynamically imported)
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      
      if (!mounted || !containerRef.current) return;
      
      leafletRef.current = L;
      
      // Fix default marker icon
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = defaultIcon;
      
      const tileConfig = TILE_LAYER_CONFIGS[tileLayer] || TILE_LAYER_CONFIGS.openstreetmap;

      const map = L.map(containerRef.current, {
        center: [center.latitude, center.longitude],
        zoom,
        minZoom,
        maxZoom,
        zoomControl: !disabled,
        dragging: !disabled,
        touchZoom: !disabled,
        scrollWheelZoom: !disabled,
        doubleClickZoom: !disabled,
      });

      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
        subdomains: tileConfig.subdomains,
      }).addTo(map);

      if (showMarker) {
        const marker = L.marker([center.latitude, center.longitude], {
          draggable: draggableMarker && !disabled,
        }).addTo(map);

        if (draggableMarker && !disabled) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onLocationChangeRef.current?.({ latitude: pos.lat, longitude: pos.lng });
          });
        }

        markerRef.current = marker;
      }

      if (!disabled) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onClickRef.current?.({ latitude: lat, longitude: lng });
        });
      }

      mapRef.current = map;
      setIsLoaded(true);
    };
    
    initMap();

    return () => {
      mounted = false;
      if (mapRef.current && leafletRef.current) {
        (mapRef.current as L.Map).remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [tileLayer, disabled, showMarker, draggableMarker, minZoom, maxZoom, center.latitude, center.longitude, zoom]);

  // Update center and zoom when props change
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const map = mapRef.current as L.Map;
    const currentCenter = map.getCenter();
    const newLat = center.latitude;
    const newLng = center.longitude;

    if (
      Math.abs(currentCenter.lat - newLat) > 0.0001 ||
      Math.abs(currentCenter.lng - newLng) > 0.0001
    ) {
      map.setView([newLat, newLng], zoom, { animate: true });

      if (markerRef.current) {
        (markerRef.current as L.Marker).setLatLng([newLat, newLng]);
      }
    }
  }, [center.latitude, center.longitude, zoom]);

  // Update marker position externally
  const updateMarkerPosition = useCallback((coords: Coordinates) => {
    if (markerRef.current) {
      (markerRef.current as L.Marker).setLatLng([coords.latitude, coords.longitude]);
    }
    if (mapRef.current) {
      (mapRef.current as L.Map).setView([coords.latitude, coords.longitude]);
    }
  }, []);

  // Expose methods via ref
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current as HTMLDivElement & {
        __leafletMap?: unknown;
        __updateMarker?: (coords: Coordinates) => void;
      };
      container.__leafletMap = mapRef.current;
      container.__updateMarker = updateMarkerPosition;
    }
  }, [updateMarkerPosition, isLoaded]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-lg overflow-hidden',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {!isLoaded && <Skeleton className="w-full h-full absolute inset-0" />}
    </div>
  );
}

export const LeafletMap = memo(LeafletMapComponent);

// Type alias for external use
type L = typeof import('leaflet');
