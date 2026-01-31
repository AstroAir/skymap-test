'use client';

import { useState, useEffect, memo } from 'react';
import { useTranslations } from 'next-intl';
import { useStellariumStore, useMountStore } from '@/lib/stores';
import { rad2deg, degreesToHMS, degreesToDMS } from '@/lib/astronomy/starmap-utils';
import { SystemStatusIndicator } from '@/components/common/system-status-indicator';

interface BottomStatusBarProps {
  currentFov: number;
}

// Sub-component: View Center Display - memoized for performance
const ViewCenterDisplay = memo(function ViewCenterDisplay() {
  const t = useTranslations();
  const getCurrentViewDirection = useStellariumStore((state) => state.getCurrentViewDirection);
  const [viewCenter, setViewCenter] = useState<{ ra: string; dec: string; alt: string; az: string } | null>(null);

  useEffect(() => {
    const updateViewCenter = () => {
      if (getCurrentViewDirection) {
        try {
          const dir = getCurrentViewDirection();
          const raDeg = rad2deg(dir.ra);
          const decDeg = rad2deg(dir.dec);
          const altDeg = rad2deg(dir.alt);
          const azDeg = rad2deg(dir.az);
          
          setViewCenter({
            ra: degreesToHMS(((raDeg % 360) + 360) % 360),
            dec: degreesToDMS(decDeg),
            alt: `${altDeg.toFixed(1)}°`,
            az: `${(((azDeg % 360) + 360) % 360).toFixed(1)}°`,
          });
        } catch {
          // Ignore errors during initialization
        }
      }
    };

    updateViewCenter();
    const interval = setInterval(updateViewCenter, 500);
    return () => clearInterval(interval);
  }, [getCurrentViewDirection]);

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
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lst, setLst] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      // Current UTC time
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      // Calculate LST if we have observer info
      if (stel?.core?.observer) {
        try {
          const observer = stel.core.observer;
          // Get sidereal time from Stellarium if available
          if (observer.utc !== undefined) {
            const jd = observer.utc;
            const T = (jd - 2451545.0) / 36525.0;
            const lon = profileInfo.AstrometrySettings.Longitude || 0;
            // Greenwich Mean Sidereal Time
            let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
            gmst = ((gmst % 360) + 360) % 360;
            // Local Sidereal Time
            let lstDeg = gmst + lon;
            lstDeg = ((lstDeg % 360) + 360) % 360;
            const lstHours = lstDeg / 15;
            const h = Math.floor(lstHours);
            const m = Math.floor((lstHours - h) * 60);
            const s = Math.floor(((lstHours - h) * 60 - m) * 60);
            setLst(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          }
        } catch {
          // Ignore LST calculation errors
        }
      }
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
      {lst && (
        <span className="hidden sm:inline">
          {t('session.lst')}: <span className="text-foreground font-mono">{lst}</span>
        </span>
      )}
      <span>
        <span className="text-foreground font-mono">{currentTime}</span>
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
