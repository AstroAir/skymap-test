/**
 * Tests for use-focus-trap.ts
 * Focus trapping within a container element
 */

import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from '../use-focus-trap';

describe('useFocusTrap', () => {
  it('should not throw when containerRef is null', () => {
    expect(() => {
      renderHook(() => {
        const ref = useRef<HTMLElement | null>(null);
        useFocusTrap(ref);
      });
    }).not.toThrow();
  });

  it('should attach keydown listener to container', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const addSpy = jest.spyOn(container, 'addEventListener');

    renderHook(() => {
      const ref = useRef<HTMLElement | null>(container);
      useFocusTrap(ref);
    });

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    document.body.removeChild(container);
    addSpy.mockRestore();
  });
});
