'use client';

import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { cn } from '@/lib/utils';
import type * as Leaflet from 'leaflet';
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
  const tileLayerRef = useRef<unknown>(null);
  const zoomControlRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const initialTileLayerRef = useRef(tileLayer);
  const initialShowMarkerRef = useRef(showMarker);
  const initialMinZoomRef = useRef(minZoom);
  const initialMaxZoomRef = useRef(maxZoom);

  const currentTileLayerKeyRef = useRef(tileLayer);

  // Store callbacks in refs to avoid recreating map on callback changes
  const onLocationChangeRef = useRef(onLocationChange);
  const onClickRef = useRef(onClick);
  const disabledRef = useRef(disabled);
  const draggableMarkerRef = useRef(draggableMarker);
  
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);
  
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    draggableMarkerRef.current = draggableMarker;
  }, [draggableMarker]);

  // Initialize map with dynamic Leaflet import
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;
    
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
      
      const initialCenter = initialCenterRef.current;
      currentTileLayerKeyRef.current = initialTileLayerRef.current;
      const tileConfig = TILE_LAYER_CONFIGS[initialTileLayerRef.current] || TILE_LAYER_CONFIGS.openstreetmap;

      const map = L.map(containerRef.current, {
        center: [initialCenter.latitude, initialCenter.longitude],
        zoom: initialZoomRef.current,
        minZoom: initialMinZoomRef.current,
        maxZoom: initialMaxZoomRef.current,
        zoomControl: true,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      });

      const baseLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
        subdomains: tileConfig.subdomains,
      }).addTo(map);

      tileLayerRef.current = baseLayer;
      zoomControlRef.current = (map as unknown as { zoomControl?: unknown }).zoomControl;

      if (initialShowMarkerRef.current) {
        const marker = L.marker([initialCenter.latitude, initialCenter.longitude], {
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          if (disabledRef.current || !draggableMarkerRef.current) return;
          const pos = marker.getLatLng();
          onLocationChangeRef.current?.({ latitude: pos.lat, longitude: pos.lng });
        });

        markerRef.current = marker;
      }

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (disabledRef.current) return;
        const { lat, lng } = e.latlng;
        onClickRef.current?.({ latitude: lat, longitude: lng });
      });

      mapRef.current = map;
      setIsLoaded(true);
    };
    
    initMap();

    return () => {
      mounted = false;
      if (mapRef.current && leafletRef.current) {
        (mapRef.current as unknown as Leaflet.Map).remove();
        mapRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
        zoomControlRef.current = null;
      }
    };
  }, []);

  // Update tile layer when prop changes
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    if (currentTileLayerKeyRef.current === tileLayer) {
      return;
    }

    const leaflet = leafletRef.current;
    const map = mapRef.current as unknown as import('leaflet').Map;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current as unknown as import('leaflet').TileLayer);
      tileLayerRef.current = null;
    }

    const tileConfig = TILE_LAYER_CONFIGS[tileLayer] || TILE_LAYER_CONFIGS.openstreetmap;
    const baseLayer = leaflet.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains,
    }).addTo(map);
    tileLayerRef.current = baseLayer;
    currentTileLayerKeyRef.current = tileLayer;
  }, [tileLayer]);

  // Update enabled/disabled behavior without re-creating the map
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const leaflet = leafletRef.current;
    const map = mapRef.current as unknown as import('leaflet').Map;

    if (disabled) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();

      const zoomControl = (map as unknown as { zoomControl?: { remove: () => void } }).zoomControl;
      if (zoomControl) {
        zoomControl.remove();
        zoomControlRef.current = zoomControl;
      }
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();

      const existingZoomControl = (map as unknown as { zoomControl?: { addTo: (m: import('leaflet').Map) => void } }).zoomControl;
      if (existingZoomControl) {
        existingZoomControl.addTo(map);
      } else if (zoomControlRef.current) {
        (zoomControlRef.current as unknown as { addTo: (m: import('leaflet').Map) => void }).addTo(map);
        (map as unknown as { zoomControl?: unknown }).zoomControl = zoomControlRef.current;
      } else {
        const newZoomControl = leaflet.control.zoom();
        newZoomControl.addTo(map);
        (map as unknown as { zoomControl?: unknown }).zoomControl = newZoomControl;
        zoomControlRef.current = newZoomControl;
      }
    }

    // Marker drag enable/disable
    if (markerRef.current) {
      const marker = markerRef.current as unknown as Leaflet.Marker;
      if (draggableMarker && !disabled) {
        marker.dragging?.enable();
      } else {
        marker.dragging?.disable();
      }
    }
  }, [disabled, draggableMarker]);

  // Create/remove marker based on showMarker
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const leaflet = leafletRef.current;
    const map = mapRef.current as unknown as import('leaflet').Map;

    if (!showMarker) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current as unknown as Leaflet.Marker);
        markerRef.current = null;
      }
      return;
    }

    if (!markerRef.current) {
      const marker = leaflet.marker([center.latitude, center.longitude], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        if (disabledRef.current || !draggableMarkerRef.current) return;
        const pos = marker.getLatLng();
        onLocationChangeRef.current?.({ latitude: pos.lat, longitude: pos.lng });
      });
      markerRef.current = marker;
    }
  }, [showMarker, center.latitude, center.longitude]);

  // Update zoom constraints
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const map = mapRef.current as unknown as Leaflet.Map;
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
  }, [minZoom, maxZoom]);

  // Update center and zoom when props change
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const map = mapRef.current as unknown as Leaflet.Map;
    const currentCenter = map.getCenter();
    const newLat = center.latitude;
    const newLng = center.longitude;

    if (
      Math.abs(currentCenter.lat - newLat) > 0.0001 ||
      Math.abs(currentCenter.lng - newLng) > 0.0001
    ) {
      map.setView([newLat, newLng], zoom, { animate: true });

      if (markerRef.current) {
        (markerRef.current as unknown as Leaflet.Marker).setLatLng([newLat, newLng]);
      }
    }
  }, [center.latitude, center.longitude, zoom]);

  // Update marker position externally
  const updateMarkerPosition = useCallback((coords: Coordinates) => {
    if (markerRef.current) {
      (markerRef.current as unknown as Leaflet.Marker).setLatLng([coords.latitude, coords.longitude]);
    }
    if (mapRef.current) {
      (mapRef.current as unknown as Leaflet.Map).setView([coords.latitude, coords.longitude]);
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
