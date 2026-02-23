/**
 * Tests for use-stellarium-value-watch.ts
 * Engine value change observation
 */

import { renderHook } from '@testing-library/react';
import { useStellariumValueWatch } from '../use-stellarium-value-watch';
import { useRef } from 'react';

describe('useStellariumValueWatch', () => {
  it('should return watchValue function', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useStellariumValueWatch(ref);
    });
    expect(typeof result.current.watchValue).toBe('function');
  });

  it('should return noop unsubscribe when stel is null', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useStellariumValueWatch(ref);
    });
    const unsub = result.current.watchValue(() => {});
    expect(typeof unsub).toBe('function');
    unsub(); // should not throw
  });

  it('should register watcher when engine is available', () => {
    const onValueChangedMock = jest.fn();
    const mockStel = { onValueChanged: onValueChangedMock };

    const { result } = renderHook(() => {
      const ref = useRef(mockStel);
      return useStellariumValueWatch(ref as never);
    });

    const callback = jest.fn();
    const unsub = result.current.watchValue(callback);
    expect(onValueChangedMock).toHaveBeenCalled();
    expect(typeof unsub).toBe('function');
  });
});
