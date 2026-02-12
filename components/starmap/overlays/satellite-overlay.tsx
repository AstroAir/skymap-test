'use client';

import { useMemo } from 'react';
import { useSatelliteStore } from '@/lib/stores';
import { useBatchProjection } from '@/lib/hooks';
import { getSatelliteColor } from '@/lib/services/celestial-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { SatelliteData } from '@/lib/core/types';
import type { SatelliteOverlayProps, SatelliteMarkerProps, SatelliteTrailProps } from '@/types/starmap/overlays';

// ============================================================================
// Satellite Marker Component
// ============================================================================

function SatelliteMarker({
  satellite,
  x,
  y,
  showLabel,
  onClick,
}: SatelliteMarkerProps) {
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
  // Get satellite display settings from store
  const showSatellites = useSatelliteStore((state) => state.showSatellites);
  const showLabels = useSatelliteStore((state) => state.showLabels);
  const trackedSatellites = useSatelliteStore((state) => state.trackedSatellites);
  
  // Convert tracked satellites to local format
  const satellites: SatelliteData[] = useMemo(() => 
    trackedSatellites.map(sat => ({
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
    })),
    [trackedSatellites]
  );

  // Use unified batch projection hook for coordinate conversion
  // This replaces the duplicated convertToScreen logic and RAF-based update loop
  const positions = useBatchProjection({
    containerWidth,
    containerHeight,
    items: satellites,
    getRa: (sat) => sat.ra,
    getDec: (sat) => sat.dec,
    enabled: showSatellites,
    intervalMs: 33, // ~30fps
    visibilityMargin: 1.2, // Slightly larger margin for satellites
    loopId: 'satellite-overlay',
  });

  if (!showSatellites || positions.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 30 }}
      role="img"
      aria-label="Satellite overlay"
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
            key={pos.item.id}
            satellite={pos.item}
            x={pos.x}
            y={pos.y}
            showLabel={showLabels}
            onClick={() => onSatelliteClick?.(pos.item)}
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
}: SatelliteTrailProps) {
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


