/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useOrientation } from '../use-orientation';

describe('useOrientation', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('returns initial orientation', () => {
    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation.width).toBe(1024);
    expect(result.current.orientation.height).toBe(768);
  });

  it('detects landscape orientation', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 1080 });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.isLandscape).toBe(true);
  });

  it('detects portrait orientation', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    Object.defineProperty(window, 'innerHeight', { value: 1024 });

    const { result } = renderHook(() => useOrientation());

    expect(result.current.isLandscape).toBe(false);
  });

  it('updates on resize event', () => {
    const { result } = renderHook(() => useOrientation());

    expect(result.current.orientation.width).toBe(1024);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.orientation.width).toBe(1920);
    expect(result.current.orientation.height).toBe(1080);
  });

  it('updates on orientationchange event', () => {
    const { result } = renderHook(() => useOrientation());

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current.orientation.width).toBe(768);
    expect(result.current.orientation.height).toBe(1024);
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
