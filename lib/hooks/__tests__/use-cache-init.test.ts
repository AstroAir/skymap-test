/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useCacheInit } from '../use-cache-init';
import { installFetchInterceptor } from '@/lib/offline';

// Mock the unified cache module
jest.mock('@/lib/offline', () => ({
  installFetchInterceptor: jest.fn(),
}));

const mockInstallFetchInterceptor = installFetchInterceptor as jest.Mock;

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    persist: jest.fn(() => Promise.resolve(true)),
  },
  writable: true,
});

describe('useCacheInit', () => {
  let consoleLogSpy: jest.SpyInstance;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('installs fetch interceptor by default', () => {
    renderHook(() => useCacheInit());

    expect(mockInstallFetchInterceptor).toHaveBeenCalledWith('cache-first');
  });

  it('uses custom strategy when provided', () => {
    renderHook(() => useCacheInit({ strategy: 'network-first' }));

    expect(mockInstallFetchInterceptor).toHaveBeenCalledWith('network-first');
  });

  it('does not install interceptor when disabled', () => {
    renderHook(() => useCacheInit({ enableInterception: false }));

    expect(mockInstallFetchInterceptor).not.toHaveBeenCalled();
  });

  it('sets up online/offline event listeners', () => {
    renderHook(() => useCacheInit());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = renderHook(() => useCacheInit());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('requests persistent storage', async () => {
    renderHook(() => useCacheInit());

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(navigator.storage.persist).toHaveBeenCalled();
  });

  it('only initializes once', () => {
    const { rerender } = renderHook(() => useCacheInit());
    
    rerender();
    rerender();

    // Should only be called once despite multiple renders
    expect(mockInstallFetchInterceptor).toHaveBeenCalledTimes(1);
  });

  it('logs cache initialization', () => {
    renderHook(() => useCacheInit());

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Cache] Fetch interceptor installed with strategy:',
      'cache-first'
    );
  });
});
