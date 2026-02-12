/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useStarField } from '../use-star-field';

// Mock canvas context
const mockCtx = {
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  scale: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
};

let rafId = 1;

beforeEach(() => {
  jest.clearAllMocks();

  // Mock requestAnimationFrame to capture callback but not auto-call
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb) => {
    return rafId++;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(jest.fn());

  // Mock matchMedia to return reduced-motion=false by default
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

function createMockCanvas() {
  const canvas = document.createElement('canvas');
  jest.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
  jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  return canvas;
}

describe('useStarField', () => {
  it('starts animation when canvas ref is available', () => {
    const canvas = createMockCanvas();
    const ref = { current: canvas };

    renderHook(() => useStarField(ref, true));

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('does nothing when canvas ref is null', () => {
    const ref = { current: null };

    renderHook(() => useStarField(ref, true));

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('cancels animation on unmount', () => {
    const canvas = createMockCanvas();
    const ref = { current: canvas };

    const { unmount } = renderHook(() => useStarField(ref, true));
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('draws static stars when prefers-reduced-motion is enabled', () => {
    // Override matchMedia to return reduced-motion=true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const canvas = createMockCanvas();
    const ref = { current: canvas };

    renderHook(() => useStarField(ref, true));

    // Should draw static stars (beginPath + arc + fill calls) but NOT start animation loop
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    // requestAnimationFrame should NOT have been called for reduced motion
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('registers resize listener', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const canvas = createMockCanvas();
    const ref = { current: canvas };

    renderHook(() => useStarField(ref, true));

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('registers visibilitychange listener when motion is allowed', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const canvas = createMockCanvas();
    const ref = { current: canvas };

    renderHook(() => useStarField(ref, true));

    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const removeWinSpy = jest.spyOn(window, 'removeEventListener');
    const removeDocSpy = jest.spyOn(document, 'removeEventListener');
    const canvas = createMockCanvas();
    const ref = { current: canvas };

    const { unmount } = renderHook(() => useStarField(ref, true));
    unmount();

    expect(removeWinSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeDocSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
