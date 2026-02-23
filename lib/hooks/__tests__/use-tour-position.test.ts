/**
 * Tests for use-tour-position.ts
 * Tour tooltip position calculation
 */

import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useTourPosition } from '../use-tour-position';
import type { TourStep } from '@/types/starmap/onboarding';

const mockStep: TourStep = {
  id: 'test-step',
  titleKey: 'onboarding.tour.test.title',
  descriptionKey: 'onboarding.tour.test.desc',
  targetSelector: '.nonexistent',
  placement: 'center',
};

describe('useTourPosition', () => {
  it('should return center position when target not found', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      return useTourPosition(mockStep, ref);
    });
    expect(result.current.position).toBeDefined();
    expect(result.current.position.arrowPosition).toBe('none');
  });

  it('should provide isVisible state', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      return useTourPosition(mockStep, ref);
    });
    expect(typeof result.current.isVisible).toBe('boolean');
  });

  it('should have initial arrowOffset of 0', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      return useTourPosition(mockStep, ref);
    });
    expect(result.current.position.arrowOffset).toBe(0);
  });
});
