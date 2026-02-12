/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { useInView } from '../use-in-view';

// Store the IntersectionObserver callback so we can trigger it manually
let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;
let mockObserve: jest.Mock;
let mockDisconnect: jest.Mock;

beforeEach(() => {
  mockObserve = jest.fn();
  mockDisconnect = jest.fn();
  observerOptions = undefined;

  global.IntersectionObserver = jest.fn((callback, options) => {
    observerCallback = callback;
    observerOptions = options;
    return {
      observe: mockObserve,
      unobserve: jest.fn(),
      disconnect: mockDisconnect,
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    };
  }) as unknown as typeof IntersectionObserver;
});

// Helper component that renders a div with the ref from useInView
function TestComponent({
  onResult,
  options,
}: {
  onResult: (result: ReturnType<typeof useInView>) => void;
  options?: Parameters<typeof useInView>[0];
}) {
  const result = useInView<HTMLDivElement>(options);
  // Report result to parent via callback
  React.useEffect(() => {
    onResult(result);
  });
  return React.createElement('div', { ref: result.ref, 'data-testid': 'observed' });
}

function renderWithInView(options?: Parameters<typeof useInView>[0]) {
  let latestResult: ReturnType<typeof useInView> = { ref: { current: null }, isInView: false };
  const onResult = (r: ReturnType<typeof useInView>) => {
    latestResult = r;
  };
  const utils = render(
    React.createElement(TestComponent, { onResult, options })
  );
  return { ...utils, getResult: () => latestResult };
}

describe('useInView', () => {
  it('returns isInView=false initially', () => {
    const { getResult } = renderWithInView();
    expect(getResult().isInView).toBe(false);
  });

  it('observes the element', () => {
    renderWithInView();
    expect(mockObserve).toHaveBeenCalled();
  });

  it('sets isInView=true when element intersects', () => {
    const { getResult } = renderWithInView();

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(getResult().isInView).toBe(true);
  });

  it('disconnects observer after first intersection when triggerOnce=true (default)', () => {
    renderWithInView({ triggerOnce: true });

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('does not disconnect on intersection when triggerOnce=false', () => {
    renderWithInView({ triggerOnce: false });

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it('resets isInView when element leaves viewport with triggerOnce=false', () => {
    const { getResult } = renderWithInView({ triggerOnce: false });

    // Enter viewport
    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    expect(getResult().isInView).toBe(true);

    // Leave viewport
    act(() => {
      observerCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    expect(getResult().isInView).toBe(false);
  });

  it('passes threshold and rootMargin options to IntersectionObserver', () => {
    renderWithInView({ threshold: 0.5, rootMargin: '10px' });

    expect(observerOptions?.threshold).toBe(0.5);
    expect(observerOptions?.rootMargin).toBe('10px');
  });

  it('uses default options', () => {
    renderWithInView();

    expect(observerOptions?.threshold).toBe(0.1);
    expect(observerOptions?.rootMargin).toBe('0px');
  });

  it('cleans up observer on unmount', () => {
    const { unmount } = renderWithInView();
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
