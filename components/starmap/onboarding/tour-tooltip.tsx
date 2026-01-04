'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TourStep } from '@/lib/stores/onboarding-store';

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
  arrowOffset: number;
}

interface TourTooltipProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TOOLTIP_MARGIN = 16;
const ARROW_SIZE = 8;

export function TourTooltip({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onClose,
  isFirst,
  isLast,
}: TourTooltipProps) {
  const t = useTranslations();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    arrowPosition: 'none',
    arrowOffset: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
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
  }, [step]);

  useEffect(() => {
    // Initial calculation after render
    const rafId = requestAnimationFrame(() => {
      calculatePosition();
    });
    
    // Delay visibility for animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Update on resize
    window.addEventListener('resize', calculatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [calculatePosition]);

  // Recalculate when step changes
  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), 0);
    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 150);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(timer);
    };
  }, [step.id, calculatePosition]);

  const renderArrow = () => {
    if (position.arrowPosition === 'none') return null;

    const arrowStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    const borderSize = `${ARROW_SIZE}px`;
    // Use CSS variable for theme consistency
    const borderColor = 'hsl(var(--card))';

    switch (position.arrowPosition) {
      case 'top':
        arrowStyles.top = -ARROW_SIZE;
        arrowStyles.left = position.arrowOffset - ARROW_SIZE;
        arrowStyles.borderLeft = `${borderSize} solid transparent`;
        arrowStyles.borderRight = `${borderSize} solid transparent`;
        arrowStyles.borderBottom = `${borderSize} solid ${borderColor}`;
        break;
      case 'bottom':
        arrowStyles.bottom = -ARROW_SIZE;
        arrowStyles.left = position.arrowOffset - ARROW_SIZE;
        arrowStyles.borderLeft = `${borderSize} solid transparent`;
        arrowStyles.borderRight = `${borderSize} solid transparent`;
        arrowStyles.borderTop = `${borderSize} solid ${borderColor}`;
        break;
      case 'left':
        arrowStyles.left = -ARROW_SIZE;
        arrowStyles.top = position.arrowOffset - ARROW_SIZE;
        arrowStyles.borderTop = `${borderSize} solid transparent`;
        arrowStyles.borderBottom = `${borderSize} solid transparent`;
        arrowStyles.borderRight = `${borderSize} solid ${borderColor}`;
        break;
      case 'right':
        arrowStyles.right = -ARROW_SIZE;
        arrowStyles.top = position.arrowOffset - ARROW_SIZE;
        arrowStyles.borderTop = `${borderSize} solid transparent`;
        arrowStyles.borderBottom = `${borderSize} solid transparent`;
        arrowStyles.borderLeft = `${borderSize} solid ${borderColor}`;
        break;
    }

    return <div style={arrowStyles} />;
  };

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[9999] w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-md text-card-foreground rounded-lg shadow-2xl border border-border',
        isVisible ? 'tour-tooltip-enter' : 'opacity-0 scale-95'
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {renderArrow()}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {currentIndex + 1}
          </div>
          <span className="text-xs text-muted-foreground">
            {t('onboarding.stepOf', { current: currentIndex + 1, total: totalSteps })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <h3 className="text-lg font-semibold mb-2">
          {t(step.titleKey)}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(step.descriptionKey)}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 py-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full tour-progress-dot',
              i === currentIndex
                ? 'w-4 bg-primary tour-progress-dot-active'
                : i < currentIndex
                ? 'w-1.5 bg-primary/50'
                : 'w-1.5 bg-muted'
            )}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-border">
        <div>
          {step.showSkip !== false && !isLast && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={onSkip}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              {t('onboarding.skip')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onPrev}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('onboarding.prev')}
            </Button>
          )}
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={onNext}
          >
            {isLast ? (
              t('onboarding.finish')
            ) : (
              <>
                {t('onboarding.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
