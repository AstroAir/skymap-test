/**
 * Windows logo icon
 * Windows 11 style — four equal square panes
 */

import { cn } from '@/lib/utils';

interface WindowsIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function WindowsIcon({ className, style }: WindowsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-4', className)}
      style={style}
      aria-hidden="true"
    >
      {/* Four equal square panes (official Windows 11 logo) */}
      <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
    </svg>
  );
}
