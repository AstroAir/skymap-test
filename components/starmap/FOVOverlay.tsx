'use client';

import { useRef, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { type MosaicSettings, type GridType } from '@/lib/starmap/stores';

interface FOVOverlayProps {
  enabled: boolean;
  sensorWidth: number;
  sensorHeight: number;
  focalLength: number;
  currentFov: number; // Current view FOV in degrees (horizontal)
  rotationAngle: number; // Rotation angle in degrees
  onRotationChange?: (angle: number) => void;
  mosaic: MosaicSettings;
  gridType?: GridType;
}

export function FOVOverlay({
  enabled,
  sensorWidth,
  sensorHeight,
  focalLength,
  currentFov,
  rotationAngle,
  onRotationChange,
  mosaic,
  gridType = 'crosshair',
}: FOVOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  if (!enabled) return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;

  // Calculate camera FOV in degrees
  const cameraFovWidth = (2 * Math.atan(sensorWidth / (2 * focalLength)) * 180) / Math.PI;
  const cameraFovHeight = (2 * Math.atan(sensorHeight / (2 * focalLength)) * 180) / Math.PI;

  // Calculate the view's vertical FOV using proper perspective math
  // currentFov is the horizontal FOV reported by Stellarium
  const safeHeight = Math.max(containerSize.height, 1);
  const viewAspect = containerSize.width / safeHeight;
  const deg2rad = Math.PI / 180;
  const horizontalFovRad = currentFov * deg2rad;
  const verticalFovRad = viewAspect > 0
    ? 2 * Math.atan(Math.tan(horizontalFovRad / 2) / viewAspect)
    : horizontalFovRad;
  const viewFovVerticalDeg = (verticalFovRad * 180) / Math.PI;

  // Mirror Touch-N-Stars approach: scale camera frame by degree ratios to match background imagery
  const overlayWidthPx = containerSize.width * (cameraFovWidth / currentFov);
  const overlayHeightPx = safeHeight * (cameraFovHeight / viewFovVerticalDeg);

  // Calculate mosaic dimensions
  const overlapFactor = 1 - mosaic.overlap / 100;
  const mosaicCols = mosaic.enabled ? mosaic.cols : 1;
  const mosaicRows = mosaic.enabled ? mosaic.rows : 1;
  
  // Single panel size
  const panelWidthPx = overlayWidthPx;
  const panelHeightPx = overlayHeightPx;
  
  // Total mosaic size with overlap
  const totalMosaicWidthPx = panelWidthPx * (1 + (mosaicCols - 1) * overlapFactor);
  const totalMosaicHeightPx = panelHeightPx * (1 + (mosaicRows - 1) * overlapFactor);

  // Check if FOV is too large to display
  const isTooLarge = totalMosaicWidthPx > containerSize.width || totalMosaicHeightPx > containerSize.height;

  // Clamp overlay size to reasonable bounds
  const clampedWidth = Math.min(containerSize.width * 0.95, Math.max(20, totalMosaicWidthPx));
  const clampedHeight = Math.min(containerSize.height * 0.95, Math.max(20, totalMosaicHeightPx));
  
  // Calculate scale factor for clamped display
  const scaleX = clampedWidth / totalMosaicWidthPx;
  const scaleY = clampedHeight / totalMosaicHeightPx;
  const scale = Math.min(scaleX, scaleY, 1);
  
  // Scaled panel dimensions
  const scaledPanelWidth = panelWidthPx * scale;
  const scaledPanelHeight = panelHeightPx * scale;
  const scaledStepX = scaledPanelWidth * overlapFactor;
  const scaledStepY = scaledPanelHeight * overlapFactor;
  const scaledTotalWidth = scaledPanelWidth + scaledStepX * (mosaicCols - 1);
  const scaledTotalHeight = scaledPanelHeight + scaledStepY * (mosaicRows - 1);

  // Generate mosaic panel positions
  const panels: { x: number; y: number; isCenter: boolean }[] = [];
  for (let row = 0; row < mosaicRows; row++) {
    for (let col = 0; col < mosaicCols; col++) {
      const x = col * scaledStepX;
      const y = row * scaledStepY;
      const isCenter = mosaicCols > 1 || mosaicRows > 1 
        ? (col === Math.floor((mosaicCols - 1) / 2) && row === Math.floor((mosaicRows - 1) / 2))
        : true;
      panels.push({ x, y, isCenter });
    }
  }

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {isTooLarge ? (
        // Show warning when FOV is larger than view
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-500/50">
          <p className="text-xs text-yellow-400 text-center">
            Camera FOV ({cameraFovWidth.toFixed(1)}° × {cameraFovHeight.toFixed(1)}°) is larger than current view
          </p>
        </div>
      ) : (
        <div
          className="relative transition-transform duration-100"
          style={{
            width: `${scaledTotalWidth}px`,
            height: `${scaledTotalHeight}px`,
            transform: `rotate(${rotationAngle}deg)`,
          }}
        >
          {/* Mosaic Panels */}
          {panels.map((panel, idx) => (
            <div
              key={idx}
              className={`absolute border-2 transition-colors ${
                panel.isCenter 
                  ? 'border-primary/80 bg-primary/10' 
                  : 'border-primary/40 bg-primary/5'
              }`}
              style={{
                left: `${panel.x}px`,
                top: `${panel.y}px`,
                width: `${scaledPanelWidth}px`,
                height: `${scaledPanelHeight}px`,
                boxShadow: panel.isCenter ? '0 0 15px hsl(var(--primary) / 0.3)' : 'none',
              }}
            >
              {/* Corner markers for each panel */}
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-primary/60" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-primary/60" />
              <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-primary/60" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-primary/60" />
              
              {/* Panel number label */}
              {mosaic.enabled && (mosaicCols > 1 || mosaicRows > 1) && (
                <div className="absolute top-1 left-1 text-[10px] text-primary/70 font-mono">
                  {idx + 1}
                </div>
              )}
              
              {/* Grid overlays */}
              {panel.isCenter && gridType !== 'none' && (
                <>
                  {/* Crosshair - always show center cross */}
                  {(gridType === 'crosshair' || gridType === 'thirds' || gridType === 'golden') && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-0.5 bg-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      <div className="h-4 w-0.5 bg-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  )}
                  
                  {/* Rule of Thirds */}
                  {gridType === 'thirds' && (
                    <>
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-primary/30" />
                      <div className="absolute top-2/3 left-0 right-0 h-px bg-primary/30" />
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-primary/30" />
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-primary/30" />
                      {/* Intersection points */}
                      <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-1/3 left-2/3 w-1.5 h-1.5 bg-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-2/3 left-1/3 w-1.5 h-1.5 bg-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-2/3 left-2/3 w-1.5 h-1.5 bg-primary/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    </>
                  )}
                  
                  {/* Golden Ratio (phi ≈ 0.618) */}
                  {gridType === 'golden' && (
                    <>
                      <div className="absolute h-px bg-primary/30" style={{ top: '38.2%', left: 0, right: 0 }} />
                      <div className="absolute h-px bg-primary/30" style={{ top: '61.8%', left: 0, right: 0 }} />
                      <div className="absolute w-px bg-primary/30" style={{ left: '38.2%', top: 0, bottom: 0 }} />
                      <div className="absolute w-px bg-primary/30" style={{ left: '61.8%', top: 0, bottom: 0 }} />
                      {/* Golden spiral approximation points */}
                      <div className="absolute w-1.5 h-1.5 bg-amber-400/50 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ top: '38.2%', left: '38.2%' }} />
                      <div className="absolute w-1.5 h-1.5 bg-amber-400/50 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ top: '38.2%', left: '61.8%' }} />
                      <div className="absolute w-1.5 h-1.5 bg-amber-400/50 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ top: '61.8%', left: '38.2%' }} />
                      <div className="absolute w-1.5 h-1.5 bg-amber-400/50 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ top: '61.8%', left: '61.8%' }} />
                    </>
                  )}
                  
                  {/* Diagonal lines */}
                  {gridType === 'diagonal' && (
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
                      <line x1="100%" y1="0" x2="0" y2="100%" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
                      {/* Center point */}
                      <circle cx="50%" cy="50%" r="3" fill="hsl(var(--primary) / 0.5)" />
                    </svg>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Rotation handle */}
          {onRotationChange && (
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-auto cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (!rect) return;
                
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const dx = moveEvent.clientX - centerX;
                  const dy = moveEvent.clientY - centerY;
                  const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
                  onRotationChange(Math.round(angle));
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <RotateCw className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          )}

          {/* FOV label */}
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-primary whitespace-nowrap bg-background/70 px-2 py-1 rounded flex items-center gap-2">
            {mosaic.enabled && (mosaicCols > 1 || mosaicRows > 1) ? (
              <span>{mosaicCols}×{mosaicRows} @ {cameraFovWidth.toFixed(1)}°×{cameraFovHeight.toFixed(1)}°</span>
            ) : (
              <span>{cameraFovWidth.toFixed(1)}° × {cameraFovHeight.toFixed(1)}°</span>
            )}
            {rotationAngle !== 0 && (
              <span className="text-primary/80">({rotationAngle}°)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
