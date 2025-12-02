'use client';

import { useState, useEffect, useCallback } from 'react';

interface OrientationState {
  width: number;
  height: number;
}

export function useOrientation() {
  const [orientation, setOrientation] = useState<OrientationState>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const updateOrientation = useCallback(() => {
    setOrientation({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // Subscribe to resize/orientation events
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [updateOrientation]);

  const isLandscape = orientation.width > orientation.height;

  return {
    isLandscape,
    orientation,
  };
}
