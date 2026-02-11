'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'panel' | 'list' | 'chart' | 'toolbar';
}

/**
 * Card skeleton for loading states
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4 rounded-lg border bg-card', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * Panel skeleton for side panels
 */
function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * List skeleton for search results or object lists
 */
function ListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2 rounded-lg"
          style={{ opacity: 1 - i * 0.12 }}
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton for altitude charts and graphs
 */
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="relative h-32 w-full">
        <Skeleton className="absolute inset-0 rounded-lg" />
        {/* Simulated chart lines */}
        <div className="absolute inset-4 flex items-end justify-between gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-2 rounded-t"
              style={{ height: `${30 + Math.sin(i / 2) * 40}%` }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

/**
 * Toolbar skeleton for button groups
 */
function ToolbarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-9 rounded-md" />
      ))}
    </div>
  );
}

/**
 * Generic loading skeleton component with multiple variants
 */
export function LoadingSkeleton({ className, variant = 'card' }: LoadingSkeletonProps) {
  switch (variant) {
    case 'card':
      return <CardSkeleton className={className} />;
    case 'panel':
      return <PanelSkeleton className={className} />;
    case 'list':
      return <ListSkeleton className={className} />;
    case 'chart':
      return <ChartSkeleton className={className} />;
    case 'toolbar':
      return <ToolbarSkeleton className={className} />;
    default:
      return <CardSkeleton className={className} />;
  }
}

/**
 * Full-screen loading overlay for initial load
 */
export function FullScreenLoader({ message }: { message?: string }) {
  return (
    <div
      role="status"
      aria-busy
      aria-label={message || 'Loading'}
      data-testid="full-screen-loader"
      className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50"
    >
      <div className="relative">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 animate-ping rounded-full bg-primary/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-pulse rounded-full bg-primary/30" />
        </div>
        <div className="relative h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

/**
 * Inline loading indicator for buttons or small areas
 */
export function InlineLoader({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-3 w-3 border',
    default: 'h-4 w-4 border-2',
    lg: 'h-6 w-6 border-2',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size]
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

// Pre-computed star positions for loading skeleton (deterministic)
const STAR_POSITIONS = [
  { left: 12, top: 8, delay: 0.1 },
  { left: 45, top: 15, delay: 0.3 },
  { left: 78, top: 22, delay: 0.5 },
  { left: 23, top: 35, delay: 0.7 },
  { left: 67, top: 42, delay: 0.9 },
  { left: 34, top: 58, delay: 1.1 },
  { left: 89, top: 65, delay: 1.3 },
  { left: 56, top: 72, delay: 1.5 },
  { left: 15, top: 85, delay: 1.7 },
  { left: 82, top: 92, delay: 1.9 },
  { left: 38, top: 18, delay: 0.2 },
  { left: 91, top: 38, delay: 0.4 },
  { left: 7, top: 52, delay: 0.6 },
  { left: 62, top: 28, delay: 0.8 },
  { left: 28, top: 78, delay: 1.0 },
  { left: 73, top: 88, delay: 1.2 },
  { left: 48, top: 45, delay: 1.4 },
  { left: 95, top: 12, delay: 1.6 },
  { left: 18, top: 68, delay: 1.8 },
  { left: 55, top: 95, delay: 0.15 },
];

/**
 * Starmap-specific loading skeleton
 */
export function StarmapLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-busy
      aria-label="Loading star map"
      data-testid="starmap-loading-skeleton"
      className="relative w-full h-full bg-black"
    >
      {/* Simulated star field */}
      <div className="absolute inset-0 overflow-hidden">
        {STAR_POSITIONS.map((star, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Center loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>

      {/* Toolbar skeleton */}
      <div className="absolute top-4 left-4 right-4 flex justify-between">
        <ToolbarSkeleton />
        <ToolbarSkeleton />
      </div>

      {/* Bottom bar skeleton */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-card/50 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center justify-between px-4 h-full">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
