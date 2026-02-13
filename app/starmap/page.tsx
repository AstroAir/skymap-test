'use client';

import { useState } from 'react';
import { StellariumView, SplashScreen } from '@/components/starmap';
import { LogPanel } from '@/components/common';
import { useCacheInit, useWindowState } from '@/lib/hooks';

export default function StarmapPage() {
  const [showSplash, setShowSplash] = useState(true);
  
  // Initialize unified cache system
  useCacheInit({ strategy: 'cache-first', enableInterception: true });
  
  // Restore and persist window state (Tauri desktop)
  useWindowState();

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <StellariumView />
      <LogPanel />
    </main>
  );
}
