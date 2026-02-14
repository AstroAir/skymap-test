import { cn } from '@/lib/utils';

/**
 * Returns className and style props for scroll-triggered fade-in animations.
 * Used by landing page sections with staggered entry animations.
 */
export function getScrollAnimationProps(
  isInView: boolean,
  index: number,
  baseDelay: number = 0.1
): { className: string; style: React.CSSProperties | undefined } {
  return {
    className: cn(isInView ? 'opacity-0 animate-fade-in' : 'opacity-0'),
    style: isInView
      ? { animationDelay: `${index * baseDelay}s`, animationFillMode: 'forwards' as const }
      : undefined,
  };
}
