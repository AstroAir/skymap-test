'use client';

import { memo } from 'react';

export const CenterCrosshair = memo(function CenterCrosshair() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 crosshair-pulse">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 border border-white/50 rounded-full" />
      </div>
    </div>
  );
});
CenterCrosshair.displayName = 'CenterCrosshair';
