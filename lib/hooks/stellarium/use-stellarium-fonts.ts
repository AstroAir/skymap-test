'use client';

import { useCallback, RefObject } from 'react';
import type { StellariumEngine } from '@/lib/core/types';

export function useStellariumFonts(stelRef: RefObject<StellariumEngine | null>) {
  const setEngineFont = useCallback(async (face: 'regular' | 'bold', url: string): Promise<void> => {
    const stel = stelRef.current;
    if (!stel?.setFont) {
      throw new Error('Stellarium setFont API is not available');
    }
    await stel.setFont(face, url);
  }, [stelRef]);

  return { setEngineFont };
}
