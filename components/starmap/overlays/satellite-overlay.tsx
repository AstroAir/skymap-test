'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useStellariumStore, useSatelliteStore } from '@/lib/stores';
import { useThrottledUpdate } from '@/lib/hooks';
import { getSatelliteColor } from '@/lib/services/celestial-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

interface SatelliteData {
  id: string;
  name: string;
  noradId: number;
  type: string;
  altitude: number;
  velocity: number;
  ra?: number;
  dec?: number;
  azimuth?: number;
  elevation?: number;
  isVisible: boolean;
}

interface SatellitePosition {
  satellite: SatelliteData;
  x: number;
  y: number;
  visible: boolean;
}

interface SatelliteOverlayProps {
  containerWidth: number;
  containerHeight: number;
  onSatelliteClick?: (satellite: SatelliteData) => void;
}

// ============================================================================
// Satellite Marker Component
// ============================================================================

function SatelliteMarker({
  satellite,
  x,
  y,
  showLabel,
  onClick,
}: {
  satellite: SatelliteData;
  x: number;
  y: number;
  showLabel: boolean;
  onClick?: () => void;
}) {
  const color = getSatelliteColor(satellite.type);
  const size = satellite.type === 'iss' ? 12 : 8;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          transform={`translate(${x}, ${y})`}
          onClick={onClick}
          style={{ cursor: 'pointer' }}
          className="satellite-marker"
        >
          {/* Glow effect */}
          <circle
            r={size + 4}
            fill={color}
            opacity={0.2}
            className="animate-pulse"
          />
          
          {/* Main marker */}
          <circle
            r={size / 2}
            fill={color}
            stroke="white"
            strokeWidth={1}
          />
          
          {/* Direction indicator for ISS */}
          {satellite.type === 'iss' && (
            <>
              <line
                x1={0}
                y1={-size}
                x2={0}
                y2={size}
                stroke={color}
                strokeWidth={2}
                opacity={0.5}
              />
              <line
                x1={-size * 1.5}
                y1={0}
                x2={size * 1.5}
                y2={0}
                stroke={color}
                strokeWidth={2}
                opacity={0.5}
              />
            </>
          )}
          
          {/* Label */}
          {showLabel && (
            <text
              x={size + 4}
              y={4}
              fill="white"
              fontSize={10}
              fontFamily="monospace"
              style={{ textShadow: '0 0 3px black, 0 0 3px black' }}
            >
              {satellite.name.length > 15 
                ? satellite.name.substring(0, 15) + '...' 
                : satellite.name}
            </text>
          )}
        </g>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-medium">{satellite.name}</div>
          <div className="text-xs text-muted-foreground">
            NORAD: {satellite.noradId}
          </div>
          <div className="flex gap-2 text-xs">
            <span>Alt: {satellite.altitude} km</span>
            <span>Vel: {satellite.velocity} km/s</span>
          </div>
          {satellite.isVisible && (
            <Badge className="bg-green-500/20 text-green-400 text-[10px]">
              Visible
            </Badge>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SatelliteOverlay({
  containerWidth,
  containerHeight,
  onSatelliteClick,
}: SatelliteOverlayProps) {
  const stel = useStellariumStore((state) => state.stel);
  
  // Get satellite display settings from store
  const showSatellites = useSatelliteStore((state) => state.showSatellites);
  const showLabels = useSatelliteStore((state) => state.showLabels);
  const trackedSatellites = useSatelliteStore((state) => state.trackedSatellites);
  
  // Convert tracked satellites to local format
  const satellites: SatelliteData[] = trackedSatellites.map(sat => ({
    id: sat.id,
    name: sat.name,
    noradId: sat.noradId,
    type: sat.type,
    altitude: sat.altitude,
    velocity: sat.velocity,
    ra: sat.ra,
    dec: sat.dec,
    azimuth: sat.azimuth,
    elevation: sat.elevation,
    isVisible: sat.isVisible,
  }));
  const [positions, setPositions] = useState<SatellitePosition[]>([]);
  
  // Convert RA/Dec to screen coordinates using Stellarium's coordinate system
  // Unified with sky-markers.tsx for consistency
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
        const ndcX = projX * scale / aspect;
        const ndcY = projY * scale;

        // Check if within visible area (with some margin)
        if (Math.abs(ndcX) > 1.2 || Math.abs(ndcY) > 1.2) {
          return { x: 0, y: 0, visible: false };
        }

        // Convert to screen coordinates
        const screenX = (ndcX + 1) * 0.5 * containerWidth;
        const screenY = (1 - ndcY) * 0.5 * containerHeight;

        return { x: screenX, y: screenY, visible: true };
      } catch {
        return null;
      }
    },
    [stel, containerWidth, containerHeight]
  );

  // Ref to store satellites for the throttled callback
  const satellitesRef = useRef(satellites);
  
  // Update ref when satellites change
  useEffect(() => {
    satellitesRef.current = satellites;
  }, [satellites]);

  // Optimized position update callback using RAF-based throttling
  const updatePositions = useCallback(() => {
    if (!showSatellites || !stel) {
      setPositions([]);
      return;
    }

    const currentSatellites = satellitesRef.current;
    const newPositions: SatellitePosition[] = [];

    for (const satellite of currentSatellites) {
      if (satellite.ra !== undefined && satellite.dec !== undefined) {
        const screenPos = convertToScreen(satellite.ra, satellite.dec);
        if (screenPos && screenPos.visible) {
          newPositions.push({
            satellite,
            x: screenPos.x,
            y: screenPos.y,
            visible: true,
          });
        }
      }
    }

    setPositions(newPositions);
  }, [showSatellites, stel, convertToScreen]);

  // Use RAF-based throttled update for smooth 30fps tracking (same as sky-markers)
  useThrottledUpdate(updatePositions, 33, !!stel && showSatellites);

  if (!showSatellites || positions.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 30 }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="satellite-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#satellite-glow)" className="pointer-events-auto">
        {positions.map((pos) => (
          <SatelliteMarker
            key={pos.satellite.id}
            satellite={pos.satellite}
            x={pos.x}
            y={pos.y}
            showLabel={showLabels}
            onClick={() => onSatelliteClick?.(pos.satellite)}
          />
        ))}
      </g>
    </svg>
  );
}

// ============================================================================
// Satellite Trail Component (for orbit visualization)
// ============================================================================

export function SatelliteTrail({
  points,
  color,
  containerWidth,
  containerHeight,
}: {
  points: Array<{ x: number; y: number }>;
  color: string;
  containerWidth: number;
  containerHeight: number;
}) {
  if (points.length < 2) return null;

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 29 }}
    >
      <defs>
        <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity={0} />
          <stop offset="100%" stopColor={color} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <path
        d={pathData}
        fill="none"
        stroke="url(#trail-gradient)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="4 2"
      />
    </svg>
  );
}


