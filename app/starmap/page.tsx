'use client';

import { useState } from 'react';
import { StellariumView, SplashScreen } from '@/components/starmap';

export default function StarmapPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <StellariumView />
    </main>
  );
}
