'use client';

import { useEffect, useState, useCallback, useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { SpotlightRect, TourSpotlightProps } from '@/types/starmap/onboarding';

export function TourSpotlight({
  targetSelector,
  padding = 8,
  isActive,
  spotlightRadius = 8,
  className,
}: TourSpotlightProps) {
  const maskId = useId();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number>(0);

  const updateRect = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const domRect = element.getBoundingClientRect();
        setRect({
          top: domRect.top - padding,
          left: domRect.left - padding,
          width: domRect.width + padding * 2,
          height: domRect.height + padding * 2,
        });
      } else {
        setRect(null);
      }
    });
  }, [targetSelector, padding]);

  useEffect(() => {
    if (!isActive) {
      const timer = setTimeout(() => setIsVisible(false), 0);
      return () => clearTimeout(timer);
    }

    // Initial rect calculation
    updateRect();

    // Delay visibility for smooth animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Update on resize/scroll
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    // Use ResizeObserver on target element instead of MutationObserver on body
    let resizeObserver: ResizeObserver | undefined;
    const element = document.querySelector(targetSelector);
    if (element) {
      resizeObserver = new ResizeObserver(updateRect);
      resizeObserver.observe(element);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(showTimer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      resizeObserver?.disconnect();
    };
  }, [isActive, updateRect, targetSelector]);

  if (!isActive) return null;

  // If no rect, show a centered glow effect
  if (!rect) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[9998]',
          isVisible ? 'tour-spotlight-enter' : 'opacity-0',
          className
        )}
        aria-hidden="true"
      >
        {/* Dark overlay with radial gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9998] pointer-events-none',
        isVisible ? 'tour-spotlight-enter' : 'opacity-0',
        className
      )}
      aria-hidden="true"
    >
      {/* SVG overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              className="tour-spotlight-rect"
              x={rect.left}
              y={rect.top}
              width={rect.width}
              height={rect.height}
              rx={spotlightRadius}
              ry={spotlightRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask={`url(#${maskId})`}
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* Spotlight border glow - uses primary color from theme */}
      <div
        className="absolute pointer-events-none tour-spotlight-pulse ring-2 ring-primary/50"
        style={{
          top: rect.top - 2,
          left: rect.left - 2,
          width: rect.width + 4,
          height: rect.height + 4,
          borderRadius: spotlightRadius + 2,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Pulse animation ring - uses primary color */}
      <div
        className="absolute pointer-events-none tour-glow-ring border-2 border-primary/40"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          borderRadius: spotlightRadius + 4,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}
