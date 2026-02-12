/**
 * Custom hook for calculating tour tooltip position
 * Extracted from components/starmap/onboarding/tour-tooltip.tsx
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { TourStep, TooltipPosition } from '@/types/starmap/onboarding';
import { TOOLTIP_MARGIN, ARROW_SIZE } from '@/lib/constants/onboarding';

/**
 * Calculates and tracks the tooltip position relative to a tour step's target element.
 * Handles viewport boundary clamping, placement fallback, resize/scroll updates, and visibility animation.
 */
export function useTourPosition(
  step: TourStep,
  tooltipRef: React.RefObject<HTMLDivElement | null>,
) {
  const rafRef = useRef<number>(0);
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    arrowPosition: 'none',
    arrowOffset: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const element = document.querySelector(step.targetSelector);
      const tooltip = tooltipRef.current;

      if (!tooltip) return;

      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const targetRect = element?.getBoundingClientRect();
      const padding = step.highlightPadding || 8;
      const gap = ARROW_SIZE + 6;

      // Center placement (no target element or center specified)
      if (!element || step.placement === 'center' || !targetRect) {
        setPosition({
          top: (viewportHeight - tooltipRect.height) / 2,
          left: (viewportWidth - tooltipRect.width) / 2,
          arrowPosition: 'none',
          arrowOffset: 0,
        });
        return;
      }

      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      const canPlace = {
        bottom: targetRect.bottom + padding + gap + tooltipRect.height < viewportHeight - TOOLTIP_MARGIN,
        top: targetRect.top - padding - gap - tooltipRect.height > TOOLTIP_MARGIN,
        left: targetRect.left - padding - gap - tooltipRect.width > TOOLTIP_MARGIN,
        right: targetRect.right + padding + gap + tooltipRect.width < viewportWidth - TOOLTIP_MARGIN,
      };

      const placementOrder = [
        step.placement,
        'bottom',
        'top',
        'right',
        'left',
      ].filter((value, index, self) => Boolean(value) && self.indexOf(value) === index) as Array<TourStep['placement']>;

      const resolvedPlacement = placementOrder.find((p) => p === 'bottom' ? canPlace.bottom : p === 'top' ? canPlace.top : p === 'left' ? canPlace.left : p === 'right' ? canPlace.right : true) || 'bottom';

      let top = 0;
      let left = 0;
      let arrowPosition: TooltipPosition['arrowPosition'] = 'none';
      let arrowOffset = 0;

      switch (resolvedPlacement) {
        case 'bottom':
          top = targetRect.bottom + padding + gap;
          left = targetCenterX - tooltipRect.width / 2;
          arrowPosition = 'top';
          arrowOffset = targetCenterX - left;
          break;
        case 'top':
          top = targetRect.top - padding - tooltipRect.height - gap;
          left = targetCenterX - tooltipRect.width / 2;
          arrowPosition = 'bottom';
          arrowOffset = targetCenterX - left;
          break;
        case 'left':
          top = targetCenterY - tooltipRect.height / 2;
          left = targetRect.left - padding - tooltipRect.width - gap;
          arrowPosition = 'right';
          arrowOffset = targetCenterY - top;
          break;
        case 'right':
          top = targetCenterY - tooltipRect.height / 2;
          left = targetRect.right + padding + gap;
          arrowPosition = 'left';
          arrowOffset = targetCenterY - top;
          break;
      }

      // Ensure tooltip stays within viewport
      if (left < TOOLTIP_MARGIN) {
        const diff = TOOLTIP_MARGIN - left;
        left = TOOLTIP_MARGIN;
        if (arrowPosition === 'top' || arrowPosition === 'bottom') {
          arrowOffset = Math.max(ARROW_SIZE * 2, arrowOffset - diff);
        }
      }
      if (left + tooltipRect.width > viewportWidth - TOOLTIP_MARGIN) {
        const diff = left + tooltipRect.width - (viewportWidth - TOOLTIP_MARGIN);
        left = viewportWidth - TOOLTIP_MARGIN - tooltipRect.width;
        if (arrowPosition === 'top' || arrowPosition === 'bottom') {
          arrowOffset = Math.min(tooltipRect.width - ARROW_SIZE * 2, arrowOffset + diff);
        }
      }
      if (top < TOOLTIP_MARGIN) {
        top = TOOLTIP_MARGIN;
      }
      if (top + tooltipRect.height > viewportHeight - TOOLTIP_MARGIN) {
        top = viewportHeight - TOOLTIP_MARGIN - tooltipRect.height;
      }

      setPosition({ top, left, arrowPosition, arrowOffset });
    });
  }, [step, tooltipRef]);

  // Attach resize/scroll listeners and ResizeObserver
  useEffect(() => {
    // Initial calculation after render
    calculatePosition();

    // Delay visibility for animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Update on resize
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    // Use ResizeObserver on target element instead of MutationObserver on body
    let resizeObserver: ResizeObserver | undefined;
    const element = document.querySelector(step.targetSelector);
    if (element) {
      resizeObserver = new ResizeObserver(calculatePosition);
      resizeObserver.observe(element);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [calculatePosition, step.targetSelector]);

  // Recalculate when step changes and auto-focus tooltip
  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), 0);
    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
      tooltipRef.current?.focus();
    }, 150);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(timer);
    };
  }, [step.id, calculatePosition, tooltipRef]);

  return { position, isVisible };
}
