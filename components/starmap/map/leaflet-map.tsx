'use client';

import { useEffect, useRef, useMemo, memo, useCallback } from 'react';
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
  showLightPollution?: boolean;
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
}: {
  center: Coordinates;
  zoom: number;
  disabled: boolean;
  onClick?: (location: Coordinates) => void;
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

  // Handle map click
  useMapEvents({
    click(e) {
      if (!disabled) {
        onClick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
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
  className,
  height = 400,
  tileLayer = 'openstreetmap',
  showMarker = true,
  draggableMarker = true,
  disabled = false,
  minZoom = 2,
  maxZoom = 19,
  showLightPollution = false,
}: LeafletMapProps) {
  const tileConfig = TILE_LAYER_CONFIGS[tileLayer] || TILE_LAYER_CONFIGS.openstreetmap;

  const handleMarkerDragEnd = useCallback(
    (location: Coordinates) => {
      if (!disabled && draggableMarker) {
        onLocationChange?.(location);
      }
    },
    [disabled, draggableMarker, onLocationChange]
  );

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
          key={tileLayer}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
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
