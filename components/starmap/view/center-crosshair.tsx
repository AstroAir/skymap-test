'use client';

import { memo } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';

export const CenterCrosshair = memo(function CenterCrosshair() {
  const visible = useSettingsStore((s) => s.stellarium.crosshairVisible);
  const color = useSettingsStore((s) => s.stellarium.crosshairColor);

  if (!visible) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 crosshair-pulse">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: color }} />
        <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: color }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ borderWidth: 1, borderStyle: 'solid', borderColor: color }} />
      </div>
    </div>
  );
});
CenterCrosshair.displayName = 'CenterCrosshair';
