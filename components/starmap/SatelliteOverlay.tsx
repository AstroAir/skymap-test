'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useStellariumStore, useSatelliteStore } from '@/lib/starmap/stores';
import { getSatelliteColor } from '@/lib/starmap/celestial-icons';
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
  const animationRef = useRef<number | null>(null);
  
  // Convert RA/Dec to screen coordinates
  const convertToScreen = useCallback(
    (ra: number, dec: number): { x: number; y: number; visible: boolean } | null => {
      if (!stel) return null;

      try {
        // Get current view direction
        const core = stel.core;
        if (!core) return null;

        // Get view direction - use core's getViewRaDecJ2000 method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coreAny = core as any;
        const viewRaDec = coreAny.getViewRaDecJ2000 ? coreAny.getViewRaDecJ2000() : [0, 0];
        const fov = core.fov || 60;

        // Calculate angular distance from view center
        const viewRa = viewRaDec[0] * (180 / Math.PI);
        const viewDec = viewRaDec[1] * (180 / Math.PI);

        // Convert to radians for calculation
        const ra1 = (viewRa * Math.PI) / 180;
        const dec1 = (viewDec * Math.PI) / 180;
        const ra2 = (ra * Math.PI) / 180;
        const dec2 = (dec * Math.PI) / 180;

        // Calculate angular separation
        const cosAngle =
          Math.sin(dec1) * Math.sin(dec2) +
          Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra2 - ra1);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        const angleDeg = (angle * 180) / Math.PI;

        // Check if within FOV (with some margin)
        if (angleDeg > fov * 0.7) {
          return { x: 0, y: 0, visible: false };
        }

        // Gnomonic projection
        const cosc = cosAngle;
        if (cosc <= 0) {
          return { x: 0, y: 0, visible: false };
        }

        const x_proj =
          (Math.cos(dec2) * Math.sin(ra2 - ra1)) / cosc;
        const y_proj =
          (Math.cos(dec1) * Math.sin(dec2) -
            Math.sin(dec1) * Math.cos(dec2) * Math.cos(ra2 - ra1)) /
          cosc;

        // Scale to screen coordinates
        const scale = Math.min(containerWidth, containerHeight) / (fov * (Math.PI / 180));
        const screenX = containerWidth / 2 + x_proj * scale;
        const screenY = containerHeight / 2 - y_proj * scale;

        // Check bounds
        const margin = 50;
        const visible =
          screenX >= -margin &&
          screenX <= containerWidth + margin &&
          screenY >= -margin &&
          screenY <= containerHeight + margin;

        return { x: screenX, y: screenY, visible };
      } catch {
        return null;
      }
    },
    [stel, containerWidth, containerHeight]
  );

  // Update satellite positions
  const updatePositions = useCallback(() => {
    if (!showSatellites || !stel) {
      setPositions([]);
      return;
    }

    const newPositions: SatellitePosition[] = [];

    satellites.forEach((satellite) => {
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
    });

    setPositions(newPositions);
  }, [satellites, showSatellites, stel, convertToScreen]);

  // Animation loop for real-time updates
  useEffect(() => {
    if (!showSatellites) return;

    const animate = () => {
      updatePositions();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showSatellites, updatePositions]);

  // Initial position update
  useEffect(() => {
    // Use a timeout to avoid synchronous setState in effect
    const timer = setTimeout(updatePositions, 0);
    return () => clearTimeout(timer);
  }, [updatePositions]);

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
