/**
 * Stellarium Web Engine logo icon
 * Circular celestial dome with a prominent bright star — the Stellarium visual identity
 */

import { cn } from '@/lib/utils';

interface StellariumIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function StellariumIcon({ className, style }: StellariumIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4', className)}
      style={style}
      aria-hidden="true"
    >
      {/* Celestial dome / sphere */}
      <circle cx="12" cy="12" r="10" />

      {/* Prominent bright star with 4-point diffraction spikes */}
      <polygon
        points="12,3 12.8,7.8 17,9 12.8,10.2 12,15 11.2,10.2 7,9 11.2,7.8"
        fill="currentColor"
        stroke="none"
      />

      {/* Small background stars */}
      <circle cx="7" cy="15" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17" cy="5.5" r="0.5" fill="currentColor" stroke="none" />

      {/* Horizon silhouette */}
      <path d="M2.7 19 Q7 17.5 12 18 Q17 18.5 21.3 17.5" strokeWidth="1" />
    </svg>
  );
}
