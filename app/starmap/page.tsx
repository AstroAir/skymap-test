'use client';

import { StellariumView } from '@/components/starmap';

export default function StarmapPage() {
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      <StellariumView />
    </main>
  );
}
