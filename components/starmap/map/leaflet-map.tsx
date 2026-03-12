'use client';

import { useEffect, useRef, useMemo, memo, useCallback, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import type { Coordinates } from '@/types/starmap/map';
import { TILE_LAYER_CONFIGS, LIGHT_POLLUTION_OVERLAY, type TileLayerType } from '@/lib/constants/map';

// Fix default marker icon (Leaflet + bundler issue)
// Icons are copied from node_modules/leaflet/dist/images/ to public/leaflet/
L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

export interface TileLayerFallbackEvent {
  failedLayer: TileLayerType;
  fallbackLayer: TileLayerType;
  errorCount: number;
}

export interface LeafletMapProps {
  center: Coordinates;
  zoom?: number;
  onLocationChange?: (location: Coordinates) => void;
  onClick?: (location: Coordinates) => void;
  onZoomChange?: (zoom: number) => void;
  className?: string;
  height?: string | number;
  tileLayer?: TileLayerType;
  showMarker?: boolean;
  draggableMarker?: boolean;
  disabled?: boolean;
  minZoom?: number;
  maxZoom?: number;
  showLightPollution?: boolean;
  tileErrorThreshold?: number;
  fallbackTileLayer?: TileLayerType;
  onTileLayerFallback?: (event: TileLayerFallbackEvent) => void;
}

function normalizeTileLayer(tileLayer: TileLayerType | undefined): TileLayerType {
  if (!tileLayer) return 'openstreetmap';
  return tileLayer in TILE_LAYER_CONFIGS ? tileLayer : 'openstreetmap';
}

/**
 * Inner component that syncs map state with props using react-leaflet hooks.
 * Must be a child of MapContainer.
 */
function MapController({
  center,
  zoom,
  disabled,
  onClick,
  onZoomChange,
}: {
  center: Coordinates;
  zoom: number;
  disabled: boolean;
  onClick?: (location: Coordinates) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();
  const prevCenterRef = useRef({ lat: center.latitude, lng: center.longitude });
  const prevZoomRef = useRef(zoom);

  // Sync center/zoom from props
  useEffect(() => {
    const prevLat = prevCenterRef.current.lat;
    const prevLng = prevCenterRef.current.lng;
    const prevZoom = prevZoomRef.current;

    const centerChanged =
      Math.abs(prevLat - center.latitude) > 0.0001 ||
      Math.abs(prevLng - center.longitude) > 0.0001;
    const zoomChanged = prevZoom !== zoom;

    if (centerChanged || zoomChanged) {
      map.setView([center.latitude, center.longitude], zoom, { animate: true });
      prevCenterRef.current = { lat: center.latitude, lng: center.longitude };
      prevZoomRef.current = zoom;
    }
  }, [map, center.latitude, center.longitude, zoom]);

  // Sync disabled state
  useEffect(() => {
    if (disabled) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.zoomControl?.remove();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      if (!document.querySelector('.leaflet-control-zoom')) {
        L.control.zoom().addTo(map);
      }
    }
  }, [map, disabled]);

  useMapEvents({
    click(e) {
      if (!disabled) {
        onClick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
    zoomend() {
      onZoomChange?.(map.getZoom());
    },
  });

  return null;
}

/**
 * Draggable marker component that syncs position with props.
 */
function DraggableMarker({
  position,
  draggable,
  disabled,
  onDragEnd,
}: {
  position: Coordinates;
  draggable: boolean;
  disabled: boolean;
  onDragEnd?: (location: Coordinates) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragstart() {
        const marker = markerRef.current;
        if (marker) {
          marker.setOpacity(0.6);
        }
      },
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          marker.setOpacity(1);
          if (!disabled) {
            const pos = marker.getLatLng();
            onDragEnd?.({ latitude: pos.lat, longitude: pos.lng });
          }
        }
      },
    }),
    [disabled, onDragEnd]
  );

  return (
    <Marker
      ref={markerRef}
      position={[position.latitude, position.longitude]}
      draggable={draggable && !disabled}
      eventHandlers={eventHandlers}
    />
  );
}

function LeafletMapComponent({
  center,
  zoom = 10,
  onLocationChange,
  onClick,
  onZoomChange,
  className,
  height = 400,
  tileLayer = 'openstreetmap',
  showMarker = true,
  draggableMarker = true,
  disabled = false,
  minZoom = 2,
  maxZoom = 19,
  showLightPollution = false,
  tileErrorThreshold = 3,
  fallbackTileLayer = 'openstreetmap',
  onTileLayerFallback,
}: LeafletMapProps) {
  const normalizedFallbackLayer = normalizeTileLayer(fallbackTileLayer);
  const [unavailableLayers, setUnavailableLayers] = useState<Set<TileLayerType>>(
    () => new Set<TileLayerType>()
  );
  const requestedLayer = normalizeTileLayer(tileLayer);
  const activeTileLayer =
    requestedLayer !== normalizedFallbackLayer && unavailableLayers.has(requestedLayer)
      ? normalizedFallbackLayer
      : requestedLayer;
  const tileErrorCountRef = useRef(0);
  const lastFallbackSignatureRef = useRef<string | null>(null);

  const emitFallback = useCallback((failedLayer: TileLayerType, errorCount: number) => {
    const signature = `${failedLayer}:${normalizedFallbackLayer}:${errorCount}`;
    if (lastFallbackSignatureRef.current === signature) {
      return;
    }
    lastFallbackSignatureRef.current = signature;
    onTileLayerFallback?.({
      failedLayer,
      fallbackLayer: normalizedFallbackLayer,
      errorCount,
    });
  }, [normalizedFallbackLayer, onTileLayerFallback]);

  useEffect(() => {
    tileErrorCountRef.current = 0;
    lastFallbackSignatureRef.current = null;

    if (requestedLayer !== normalizedFallbackLayer && unavailableLayers.has(requestedLayer)) {
      emitFallback(requestedLayer, 0);
    }
  }, [requestedLayer, normalizedFallbackLayer, unavailableLayers, emitFallback]);

  const tileConfig = TILE_LAYER_CONFIGS[activeTileLayer] || TILE_LAYER_CONFIGS.openstreetmap;

  const handleMarkerDragEnd = useCallback(
    (location: Coordinates) => {
      if (!disabled && draggableMarker) {
        onLocationChange?.(location);
      }
    },
    [disabled, draggableMarker, onLocationChange]
  );

  const handleTileError = useCallback(() => {
    if (activeTileLayer === normalizedFallbackLayer) {
      return;
    }

    tileErrorCountRef.current += 1;
    if (tileErrorCountRef.current < tileErrorThreshold) {
      return;
    }

    const failedLayer = activeTileLayer;
    const errorCount = tileErrorCountRef.current;
    tileErrorCountRef.current = 0;
    setUnavailableLayers((previous) => {
      if (previous.has(failedLayer)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(failedLayer);
      return next;
    });
    emitFallback(failedLayer, errorCount);
  }, [activeTileLayer, normalizedFallbackLayer, tileErrorThreshold, emitFallback]);

  return (
    <div
      role="application"
      aria-label="Interactive map"
      aria-disabled={disabled || undefined}
      className={cn(
        'relative rounded-lg overflow-hidden',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomControl={!disabled}
        scrollWheelZoom={!disabled}
        dragging={!disabled}
        touchZoom={!disabled}
        doubleClickZoom={!disabled}
        className="h-full w-full"
      >
        <TileLayer
          key={activeTileLayer}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
          eventHandlers={{ tileerror: handleTileError }}
          {...(tileConfig.subdomains ? { subdomains: tileConfig.subdomains } : {})}
        />
        {showLightPollution && (
          <TileLayer
            key="light-pollution-overlay"
            url={LIGHT_POLLUTION_OVERLAY.url}
            attribution={LIGHT_POLLUTION_OVERLAY.attribution}
            maxZoom={LIGHT_POLLUTION_OVERLAY.maxZoom}
            opacity={0.5}
          />
        )}
        <MapController
          center={center}
          zoom={zoom}
          disabled={disabled}
          onClick={onClick}
          onZoomChange={onZoomChange}
        />
        {showMarker && (
          <DraggableMarker
            position={center}
            draggable={draggableMarker}
            disabled={disabled}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </MapContainer>
    </div>
  );
}

export const LeafletMap = memo(LeafletMapComponent);
