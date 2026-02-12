'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMarkerStore, type SkyMarker, type MarkerIcon } from '@/lib/stores';
import { useBatchProjection } from '@/lib/hooks';
import type { SkyMarkersProps } from '@/types/starmap/overlays';
import {
  Star,
  Circle,
  Crosshair,
  MapPin,
  Diamond,
  Triangle,
  Square,
  Flag,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Navigation,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuLabel,
} from '@/components/ui/context-menu';

// Icon component mapping
const MarkerIconComponent: Record<MarkerIcon, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  star: Star,
  circle: Circle,
  crosshair: Crosshair,
  pin: MapPin,
  diamond: Diamond,
  triangle: Triangle,
  square: Square,
  flag: Flag,
};

export function SkyMarkers({
  containerWidth,
  containerHeight,
  onMarkerClick,
  onMarkerDoubleClick,
  onMarkerEdit,
  onMarkerDelete,
  onMarkerNavigate,
}: SkyMarkersProps) {
  const t = useTranslations();
  const markers = useMarkerStore((state) => state.markers);
  const showMarkers = useMarkerStore((state) => state.showMarkers);
  const activeMarkerId = useMarkerStore((state) => state.activeMarkerId);
  const setActiveMarker = useMarkerStore((state) => state.setActiveMarker);
  const toggleMarkerVisibility = useMarkerStore((state) => state.toggleMarkerVisibility);
  const removeMarker = useMarkerStore((state) => state.removeMarker);

  // Compute visible markers with useMemo to avoid creating new array on each render
  const visibleMarkers = useMemo(() => {
    if (!showMarkers) return [];
    return markers.filter((m) => m.visible);
  }, [markers, showMarkers]);

  // Use unified batch projection hook for coordinate conversion
  // This replaces the duplicated convertToScreen logic and RAF-based update loop
  const projectedMarkers = useBatchProjection({
    containerWidth,
    containerHeight,
    items: visibleMarkers,
    getRa: (marker) => marker.ra,
    getDec: (marker) => marker.dec,
    enabled: showMarkers,
    intervalMs: 33, // ~30fps
    loopId: 'sky-markers',
  });

  // Map projected items to marker positions for rendering
  const renderableMarkers = useMemo(() => {
    return projectedMarkers.map((p) => ({
      marker: p.item,
      x: p.x,
      y: p.y,
      visible: p.visible,
    }));
  }, [projectedMarkers]);

  // Marker action handlers (accept marker directly, no shared state needed)
  const handleEdit = useCallback((marker: SkyMarker) => {
    onMarkerEdit?.(marker);
  }, [onMarkerEdit]);

  const handleDelete = useCallback((marker: SkyMarker) => {
    if (onMarkerDelete) {
      onMarkerDelete(marker);
    } else {
      removeMarker(marker.id);
    }
  }, [onMarkerDelete, removeMarker]);

  const handleNavigate = useCallback((marker: SkyMarker) => {
    onMarkerNavigate?.(marker);
  }, [onMarkerNavigate]);

  const handleToggleVisibility = useCallback((marker: SkyMarker) => {
    toggleMarkerVisibility(marker.id);
  }, [toggleMarkerVisibility]);

  if (renderableMarkers.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {renderableMarkers.map(({ marker, x, y }) => {
        const IconComponent = MarkerIconComponent[marker.icon];
        const isActive = marker.id === activeMarkerId;

        return (
          <ContextMenu key={marker.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <ContextMenuTrigger asChild>
                  <div
                    className="absolute pointer-events-auto cursor-pointer transition-transform hover:scale-125"
                    style={{
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMarker(marker.id);
                      onMarkerClick?.(marker);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onMarkerDoubleClick?.(marker);
                    }}
                  >
                    <IconComponent
                      className="drop-shadow-lg"
                      style={{
                        color: marker.color,
                        width: isActive ? 28 : 20,
                        height: isActive ? 28 : 20,
                        filter: `drop-shadow(0 0 ${isActive ? 4 : 2}px ${marker.color})`,
                      }}
                    />
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor: marker.color,
                          opacity: 0.3,
                          transform: 'scale(1.5)',
                        }}
                      />
                    )}
                  </div>
                </ContextMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="font-medium">{marker.name}</div>
                {marker.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {marker.description}
                  </div>
                )}
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  {marker.raString} / {marker.decString}
                </div>
              </TooltipContent>
            </Tooltip>
            <ContextMenuContent className="w-48" aria-label={t('markers.contextMenu')}>
              <ContextMenuLabel className="text-xs">
                <div className="font-medium truncate" style={{ color: marker.color }}>
                  {marker.name}
                </div>
                <div className="font-mono text-muted-foreground font-normal">
                  {marker.raString}
                </div>
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handleNavigate(marker)}>
                <Navigation className="h-4 w-4 mr-2" />
                {t('markers.goTo')}
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleEdit(marker)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleToggleVisibility(marker)}>
                {marker.visible ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t('markers.hide')}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('markers.show')}
                  </>
                )}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={() => handleDelete(marker)}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}

