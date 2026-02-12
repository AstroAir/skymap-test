'use client';

import { useRef } from 'react';
import { useStarField } from '@/lib/hooks/use-star-field';

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useStarField(canvasRef);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}
