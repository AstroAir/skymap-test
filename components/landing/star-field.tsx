'use client';

import { useRef } from 'react';
import { useTheme } from 'next-themes';
import { useStarField } from '@/lib/hooks/use-star-field';

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  useStarField(canvasRef, resolvedTheme === 'dark');

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ willChange: 'transform', background: 'transparent' }}
    />
  );
}
