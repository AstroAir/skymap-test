'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMarkerStore, type SkyMarker, type MarkerIcon } from '@/lib/stores';
import { useBatchProjection } from '@/lib/hooks';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SkyMarkersProps {
  containerWidth: number;
  containerHeight: number;
  onMarkerClick?: (marker: SkyMarker) => void;
  onMarkerDoubleClick?: (marker: SkyMarker) => void;
  onMarkerEdit?: (marker: SkyMarker) => void;
  onMarkerDelete?: (marker: SkyMarker) => void;
  onMarkerNavigate?: (marker: SkyMarker) => void;
}

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
  
  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuMarker, setContextMenuMarker] = useState<SkyMarker | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

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

  // Handle right-click on marker
  const handleMarkerContextMenu = useCallback((e: React.MouseEvent, marker: SkyMarker) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuMarker(marker);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  }, []);

  // Handle marker edit
  const handleEdit = useCallback(() => {
    if (contextMenuMarker) {
      onMarkerEdit?.(contextMenuMarker);
    }
    setContextMenuOpen(false);
  }, [contextMenuMarker, onMarkerEdit]);

  // Handle marker delete
  const handleDelete = useCallback(() => {
    if (contextMenuMarker) {
      if (onMarkerDelete) {
        onMarkerDelete(contextMenuMarker);
      } else {
        removeMarker(contextMenuMarker.id);
      }
    }
    setContextMenuOpen(false);
  }, [contextMenuMarker, onMarkerDelete, removeMarker]);

  // Handle navigate to marker
  const handleNavigate = useCallback(() => {
    if (contextMenuMarker) {
      onMarkerNavigate?.(contextMenuMarker);
    }
    setContextMenuOpen(false);
  }, [contextMenuMarker, onMarkerNavigate]);

  // Handle toggle visibility
  const handleToggleVisibility = useCallback(() => {
    if (contextMenuMarker) {
      toggleMarkerVisibility(contextMenuMarker.id);
    }
    setContextMenuOpen(false);
  }, [contextMenuMarker, toggleMarkerVisibility]);

  if (renderableMarkers.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {renderableMarkers.map(({ marker, x, y }) => {
        const IconComponent = MarkerIconComponent[marker.icon];
        const isActive = marker.id === activeMarkerId;

        return (
          <Tooltip key={marker.id}>
            <TooltipTrigger asChild>
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
                onContextMenu={(e) => handleMarkerContextMenu(e, marker)}
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
        );
      })}

      {/* Context Menu for Markers */}
      <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div 
            className="fixed w-0 h-0 pointer-events-none"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48" aria-label={t('markers.contextMenu')}>
          {contextMenuMarker && (
            <>
              <div className="px-2 py-1.5 text-xs">
                <div className="font-medium truncate" style={{ color: contextMenuMarker.color }}>
                  {contextMenuMarker.name}
                </div>
                <div className="font-mono text-muted-foreground">
                  {contextMenuMarker.raString}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNavigate}>
                <Navigation className="h-4 w-4 mr-2" />
                {t('markers.goTo')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleVisibility}>
                {contextMenuMarker.visible ? (
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
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

