'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useMountStore } from '@/lib/stores';
import { rad2deg, degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { getLST, lstToHours } from '@/lib/astronomy/time/sidereal';
import { SystemStatusIndicator } from '@/components/common/system-status-indicator';
import type { BottomStatusBarProps } from '@/types/starmap/view';

// Sub-component: View Center Display - subscribes to store's viewDirection (no independent polling)
const ViewCenterDisplay = memo(function ViewCenterDisplay() {
  const t = useTranslations();
  const viewDirection = useStellariumStore((state) => state.viewDirection);

  const viewCenter = useMemo(() => {
    if (!viewDirection) return null;
    const raDeg = rad2deg(viewDirection.ra);
    const decDeg = rad2deg(viewDirection.dec);
    const altDeg = rad2deg(viewDirection.alt);
    const azDeg = rad2deg(viewDirection.az);
    return {
      ra: degreesToHMS(((raDeg % 360) + 360) % 360),
      dec: degreesToDMS(decDeg),
      alt: `${altDeg.toFixed(1)}°`,
      az: `${(((azDeg % 360) + 360) % 360).toFixed(1)}°`,
    };
  }, [viewDirection]);

  if (!viewCenter) return null;

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <span>
        {t('coordinates.ra')}: <span className="text-foreground font-mono">{viewCenter.ra}</span>
      </span>
      <span>
        {t('coordinates.dec')}: <span className="text-foreground font-mono">{viewCenter.dec}</span>
      </span>
      <span className="hidden sm:inline">
        {t('coordinates.alt')}: <span className="text-foreground font-mono">{viewCenter.alt}</span>
      </span>
      <span className="hidden sm:inline">
        {t('coordinates.az')}: <span className="text-foreground font-mono">{viewCenter.az}</span>
      </span>
    </div>
  );
});
ViewCenterDisplay.displayName = 'ViewCenterDisplay';

// Sub-component: Location & Time Display - memoized for performance
const LocationTimeDisplay = memo(function LocationTimeDisplay() {
  const t = useTranslations();
  const profileInfo = useMountStore((state) => state.profileInfo);
  const stel = useStellariumStore((state) => state.stel);
  const [timeInfo, setTimeInfo] = useState<{ currentTime: string; lst: string }>({ currentTime: '', lst: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      let lst = '';
      if (stel?.core?.observer) {
        try {
          const observer = stel.core.observer;
          if (observer.utc !== undefined) {
            const lon = profileInfo.AstrometrySettings.Longitude || 0;
            const lstHours = lstToHours(getLST(lon, observer.utc));
            const h = Math.floor(lstHours);
            const m = Math.floor((lstHours - h) * 60);
            const s = Math.floor(((lstHours - h) * 60 - m) * 60);
            lst = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          }
        } catch {
          // Ignore LST calculation errors
        }
      }
      setTimeInfo({ currentTime, lst });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [stel, profileInfo]);

  const lat = profileInfo.AstrometrySettings.Latitude || 0;
  const lon = profileInfo.AstrometrySettings.Longitude || 0;

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <span className="hidden md:inline">
        {t('session.location')}: <span className="text-foreground font-mono">{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
      </span>
      {timeInfo.lst && (
        <span className="hidden sm:inline">
          {t('session.lst')}: <span className="text-foreground font-mono">{timeInfo.lst}</span>
        </span>
      )}
      <span>
        <span className="text-foreground font-mono">{timeInfo.currentTime}</span>
      </span>
    </div>
  );
});
LocationTimeDisplay.displayName = 'LocationTimeDisplay';

export const BottomStatusBar = memo(function BottomStatusBar({ currentFov }: BottomStatusBarProps) {
  const t = useTranslations();
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none safe-area-bottom">
      <div className="bg-card/80 backdrop-blur-md border-t border-border/50 px-2 sm:px-4 py-1.5 sm:py-2 status-bar-reveal">
        <div className="flex items-center justify-between text-[10px] sm:text-xs gap-2">
          {/* Left: View Center Coordinates */}
          <div className="flex items-center gap-4">
            <ViewCenterDisplay />
          </div>

          {/* Center: FOV */}
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {t('fov.label')}: <span className="text-foreground font-mono">{currentFov < 1 ? currentFov.toFixed(2) : currentFov.toFixed(1)}°</span>
            </span>
          </div>

          {/* Right: Location & Time + System Status */}
          <div className="flex items-center gap-4">
            <LocationTimeDisplay />
            <div className="hidden sm:block">
              <SystemStatusIndicator compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
BottomStatusBar.displayName = 'BottomStatusBar';

// Export sub-components for reuse
export { ViewCenterDisplay, LocationTimeDisplay };
