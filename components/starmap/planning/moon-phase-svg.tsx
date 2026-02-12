'use client';

import { cn } from '@/lib/utils';

interface MoonPhaseSVGProps {
  /** Moon phase value: 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter */
  phase: number;
  /** Size in pixels */
  size?: number;
  className?: string;
}

/**
 * Renders a realistic moon phase using SVG.
 * Uses a circle for the moon outline and a path for the terminator (shadow edge)
 * to create an accurate crescent/gibbous shape.
 */
export function MoonPhaseSVG({ phase, size = 40, className }: MoonPhaseSVGProps) {
  const r = size / 2 - 1; // radius with 1px padding for border
  const cx = size / 2;
  const cy = size / 2;

  // Normalize phase to 0-1
  const p = ((phase % 1) + 1) % 1;

  // Calculate the terminator curve
  // The terminator is the line between the lit and dark sides
  // We use an elliptical arc whose x-radius varies with phase
  const illumination = (1 - Math.cos(2 * Math.PI * p)) / 2; // 0 at new, 1 at full

  // Determine which side is lit
  // 0-0.5: right side lit (waxing), 0.5-1: left side lit (waning)
  const isWaxing = p < 0.5;

  // The terminator x-radius determines the crescent shape
  // At new/full moon, the terminator aligns with the circle edge
  // At quarters, the terminator is a straight line (rx = 0)
  const terminatorRx = Math.abs(Math.cos(2 * Math.PI * p)) * r;

  // Build the lit area path
  // We draw from top to bottom, using two arcs:
  // 1. The outer edge (always a semicircle on the lit side)
  // 2. The terminator (an elliptical arc)
  const top = `${cx},${cy - r}`;
  const bottom = `${cx},${cy + r}`;

  // Outer arc sweep: right side for waxing, left side for waning
  const outerSweep = isWaxing ? 1 : 0;

  // Terminator sweep depends on phase within each half
  // 0-0.25 and 0.75-1: crescent (terminator curves inward)
  // 0.25-0.5 and 0.5-0.75: gibbous (terminator curves outward)
  const isCrescent = (p < 0.25) || (p > 0.75);
  const terminatorSweep = isCrescent
    ? (isWaxing ? 0 : 1)
    : (isWaxing ? 1 : 0);

  const litPath = [
    `M ${top}`,
    // Outer semicircle arc on the lit side
    `A ${r},${r} 0 0,${outerSweep} ${bottom}`,
    // Terminator elliptical arc back to top
    `A ${terminatorRx},${r} 0 0,${terminatorSweep} ${top}`,
    'Z',
  ].join(' ');

  // Moon surface colors
  const darkColor = '#1e293b';
  const litColor = '#fef3c7';
  const borderColor = '#475569';
  const glowOpacity = Math.max(0, (illumination - 0.3) * 0.4);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0', className)}
    >
      {/* Glow for bright moon */}
      {illumination > 0.3 && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 2}
          fill="none"
          stroke={litColor}
          strokeWidth={1.5}
          opacity={glowOpacity}
        />
      )}

      {/* Dark base (unlit moon) */}
      <circle cx={cx} cy={cy} r={r} fill={darkColor} stroke={borderColor} strokeWidth={0.5} />

      {/* Lit portion */}
      {illumination > 0.01 && illumination < 0.99 && (
        <path d={litPath} fill={litColor} opacity={0.95} />
      )}

      {/* Full moon special case */}
      {illumination >= 0.99 && (
        <circle cx={cx} cy={cy} r={r} fill={litColor} opacity={0.95} />
      )}

      {/* Subtle surface texture dots */}
      {illumination > 0.3 && (
        <g opacity={0.15}>
          <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.08} fill={darkColor} />
          <circle cx={cx + r * 0.2} cy={cy + r * 0.3} r={r * 0.06} fill={darkColor} />
          <circle cx={cx - r * 0.1} cy={cy + r * 0.4} r={r * 0.05} fill={darkColor} />
        </g>
      )}
    </svg>
  );
}
