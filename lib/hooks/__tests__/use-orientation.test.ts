/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useOrientation } from '../use-orientation';

describe('useOrientation', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset to default values
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
  });

  // ============================================================================
  // Initial state
  // ============================================================================
  describe('initial state', () => {
    it('returns orientation object', () => {
      const { result } = renderHook(() => useOrientation());

      expect(result.current.orientation).toBeDefined();
      expect(result.current.orientation.width).toBeDefined();
      expect(result.current.orientation.height).toBeDefined();
    });

    it('returns isLandscape', () => {
      const { result } = renderHook(() => useOrientation());
      expect(typeof result.current.isLandscape).toBe('boolean');
    });

    it('detects landscape when width > height', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });

      const { result } = renderHook(() => useOrientation());
      expect(result.current.isLandscape).toBe(true);
    });

    it('detects portrait when height > width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });

      const { result } = renderHook(() => useOrientation());
      expect(result.current.isLandscape).toBe(false);
    });
  });

  // ============================================================================
  // Resize handling
  // ============================================================================
  describe('resize handling', () => {
    it('updates on window resize', () => {
      const { result } = renderHook(() => useOrientation());

      // Initial state
      expect(result.current.orientation.width).toBe(1024);
      expect(result.current.orientation.height).toBe(768);

      // Change window size
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 800 });
        Object.defineProperty(window, 'innerHeight', { value: 600 });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.orientation.width).toBe(800);
      expect(result.current.orientation.height).toBe(600);
    });

    it('updates on orientation change', () => {
      const { result } = renderHook(() => useOrientation());

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 600 });
        Object.defineProperty(window, 'innerHeight', { value: 800 });
        window.dispatchEvent(new Event('orientationchange'));
      });

      expect(result.current.orientation.width).toBe(600);
      expect(result.current.orientation.height).toBe(800);
      expect(result.current.isLandscape).toBe(false);
    });

    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOrientation());

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
