/**
 * Zustand bear icon
 * Simplified bear face inspired by the Zustand logo
 */

import { cn } from '@/lib/utils';

interface ZustandIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ZustandIcon({ className, style }: ZustandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-4', className)}
      style={style}
      aria-hidden="true"
    >
      {/* Left ear (outer) */}
      <circle cx="6" cy="5.5" r="3.2" />
      {/* Left ear (inner) */}
      <circle cx="6" cy="5.8" r="1.8" fill="var(--background, #fff)" opacity="0.35" />
      {/* Right ear (outer) */}
      <circle cx="18" cy="5.5" r="3.2" />
      {/* Right ear (inner) */}
      <circle cx="18" cy="5.8" r="1.8" fill="var(--background, #fff)" opacity="0.35" />
      {/* Head */}
      <ellipse cx="12" cy="13.5" rx="9.2" ry="9" />
      {/* Left eye (white) */}
      <circle cx="8.5" cy="12" r="1.7" fill="var(--background, #fff)" />
      {/* Left pupil */}
      <circle cx="8.8" cy="12" r="0.9" />
      {/* Right eye (white) */}
      <circle cx="15.5" cy="12" r="1.7" fill="var(--background, #fff)" />
      {/* Right pupil */}
      <circle cx="15.2" cy="12" r="0.9" />
      {/* Snout area */}
      <ellipse cx="12" cy="16" rx="3.2" ry="2.4" fill="var(--background, #fff)" />
      {/* Nose */}
      <ellipse cx="12" cy="15.2" rx="1.3" ry="1" />
      {/* Mouth */}
      <path
        d="M10.5 16.8 Q12 18.2 13.5 16.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
