'use client';

import { useState } from 'react';
import { StellariumView, SplashScreen } from '@/components/starmap';
import { useCacheInit } from '@/lib/hooks';

export default function StarmapPage() {
  const [showSplash, setShowSplash] = useState(true);
  
  // Initialize unified cache system
  useCacheInit({ strategy: 'cache-first', enableInterception: true });

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <StellariumView />
    </main>
  );
}
