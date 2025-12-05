'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMarkerStore, type SkyMarker, type MarkerIcon } from '@/lib/stores';
import { useStellariumStore } from '@/lib/stores';
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

interface MarkerPosition {
  marker: SkyMarker;
  x: number;
  y: number;
  visible: boolean;
}

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
  const stel = useStellariumStore((state) => state.stel);
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

  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([]);

  // Convert RA/Dec to screen coordinates
  // Uses gnomonic (rectilinear) projection - must be inverse of getClickCoordinates in StellariumCanvas
  const convertToScreen = useCallback(
    (ra: number, dec: number): { x: number; y: number; visible: boolean } | null => {
      if (!stel) return null;

      try {
        // Convert degrees to radians
        const raRad = ra * stel.D2R;
        const decRad = dec * stel.D2R;

        // Convert spherical to cartesian (ICRF frame)
        const icrfVec = stel.s2c(raRad, decRad);

        // Convert ICRF to VIEW frame
        const viewVec = stel.convertFrame(stel.observer, 'ICRF', 'VIEW', icrfVec);

        // Check if the point is behind the viewer (z > 0 in VIEW frame means behind)
        if (viewVec[2] > 0) {
          return { x: 0, y: 0, visible: false };
        }

        // Get current FOV and aspect ratio
        const fov = stel.core.fov; // FOV in radians
        const aspect = containerWidth / containerHeight;
        
        // Gnomonic projection:
        // projX = viewX / (-viewZ), projY = viewY / (-viewZ)
        // Then scale by 1/tan(fov/2) and account for aspect ratio
        const scale = 1 / Math.tan(fov / 2);
        
        // Project onto the viewing plane
        const projX = viewVec[0] / (-viewVec[2]);
        const projY = viewVec[1] / (-viewVec[2]);

        // Convert to normalized device coordinates
        // ndcX = projX * scale / aspect (to match inverse in getClickCoordinates)
        // ndcY = projY * scale
        const ndcX = projX * scale / aspect;
        const ndcY = projY * scale;

        // Check if within visible area (with some margin)
        if (Math.abs(ndcX) > 1.1 || Math.abs(ndcY) > 1.1) {
          return { x: 0, y: 0, visible: false };
        }

        // Convert to screen coordinates
        // screenX = (ndcX + 1) * 0.5 * width
        // screenY = (1 - ndcY) * 0.5 * height (Y is inverted)
        const screenX = (ndcX + 1) * 0.5 * containerWidth;
        const screenY = (1 - ndcY) * 0.5 * containerHeight;

        return { x: screenX, y: screenY, visible: true };
      } catch (error) {
        console.error('Error converting coordinates:', error);
        return null;
      }
    },
    [stel, containerWidth, containerHeight]
  );

  // Ref to store markers for the interval callback
  const markersRef = useRef(visibleMarkers);
  
  // Update ref when markers change
  useEffect(() => {
    markersRef.current = visibleMarkers;
  }, [visibleMarkers]);

  // Update marker positions periodically
  useEffect(() => {
    if (!stel || !showMarkers) {
      return;
    }

    let mounted = true;

    const updatePositions = () => {
      if (!mounted) return;
      
      const currentMarkers = markersRef.current;
      const positions: MarkerPosition[] = [];

      for (const marker of currentMarkers) {
        const pos = convertToScreen(marker.ra, marker.dec);
        if (pos) {
          positions.push({
            marker,
            x: pos.x,
            y: pos.y,
            visible: pos.visible,
          });
        }
      }

      setMarkerPositions(positions);
    };

    // Initial update via RAF to avoid synchronous setState
    requestAnimationFrame(updatePositions);
    // Update at 30fps for smooth tracking
    const interval = setInterval(updatePositions, 33);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [stel, showMarkers, convertToScreen]);

  // Memoize renderable markers for rendering
  const renderableMarkers = useMemo(() => {
    if (!showMarkers) {
      return [];
    }
    return markerPositions.filter((p) => p.visible);
  }, [markerPositions, showMarkers]);

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
        <DropdownMenuContent align="start" className="w-48">
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

