/**
 * Tests for use-stellarium-events.ts
 * Right-click context menu and long press event handling
 */

import { renderHook } from '@testing-library/react';
import { useStellariumEvents } from '../use-stellarium-events';
import { useRef } from 'react';

describe('useStellariumEvents', () => {
  it('should not throw when containerRef is null', () => {
    expect(() => {
      renderHook(() => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        useStellariumEvents({
          containerRef,
          getClickCoordinates: () => null,
        });
      });
    }).not.toThrow();
  });

  it('should attach event listeners when container exists', () => {
    const container = document.createElement('div');
    const addSpy = jest.spyOn(container, 'addEventListener');

    renderHook(() => {
      const containerRef = useRef<HTMLDivElement | null>(container);
      useStellariumEvents({
        containerRef,
        getClickCoordinates: () => null,
      });
    });

    // Should have attached mousedown and other event listeners
    expect(addSpy).toHaveBeenCalled();
    addSpy.mockRestore();
  });
});
